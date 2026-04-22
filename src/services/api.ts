import { supabase } from '@/lib/supabase';
import { IDBManager } from '@/lib/idb-manager';
import { Driver, Trip, Rider, UserRole } from '@/types';

export const MonitoringService = {
  /**
   * Check system health and maintenance status
   */
  async getSystemStatus() {
    const { data: config } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
    
    return {
      maintenance: config?.value?.active || false,
      reason: config?.value?.reason || '',
      status: 'operational',
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Log anonymized performance metadata for SADC optimization
   */
  async logPerformance(metric: string, value: number, region: string = 'SADC') {
    // In a real production app, this would hit an observability endpoint like Sentry or Datadog
    console.log(`[Health] ${region} - ${metric}: ${value}ms`);
  }
};

export const RiderService = {
  /**
   * Helper to wrap mutations with offline queueing
   */
  async applyOfflineSafety(type: string, data: any, userId: string, nativeCall: () => Promise<any>) {
    // Check for global maintenance mode before proceeding
    const status = await MonitoringService.getSystemStatus();
    if (status.maintenance) {
      throw new Error(`System Maintenance: ${status.reason}`);
    }

    if (typeof window !== 'undefined' && !navigator.onLine) {
      const { data: session } = await supabase.auth.getSession();
      await IDBManager.addAction({
        type,
        data,
        userId,
        timestamp: Date.now(),
        authToken: session?.session?.access_token || ''
      });
      
      // Register sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        try { await (reg as any).sync.register('mzansi-sync'); } catch(e) {}
      }
      return { offline: true };
    }
    return nativeCall();
  },

  /**
   * Fetch all drivers within the rider's vicinity
   */
  async getNearbyDrivers(lat: number, lng: number, radiusKm: number = 10) {
    // In a real app, you'd use PostGIS (st_dwithin) for this.
    // For now, we perform a simple select.
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        vehicles (*)
      `)
      .eq('role', 'driver')
      .eq('verification_status', 'verified');
    
    if (error) throw error;
    return data;
  },

  /**
   * Request a new trip
   */
  async requestTrip(tripData: Partial<Trip>) {
    const userId = tripData.riderId || '';
    return this.applyOfflineSafety('SUBMIT_TRIP', tripData, userId, async () => {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          rider_id: tripData.riderId,
          pickup_lat: tripData.pickup?.lat,
          pickup_lng: tripData.pickup?.lng,
          pickup_address: tripData.pickup?.address,
          pickup_name: tripData.pickup?.name,
          dropoff_lat: tripData.dropoff?.lat,
          dropoff_lng: tripData.dropoff?.lng,
          dropoff_address: tripData.dropoff?.address,
          dropoff_name: tripData.dropoff?.name,
          vehicle_type: tripData.vehicleType,
          fare_total: tripData.fare?.total,
          status: 'requested',
          payment_method: tripData.paymentMethod || 'wallet',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  },

  /**
   * Subscribe to trip updates (Real-time)
   */
  subscribeToTrip(tripId: string, onUpdate: (trip: any) => void) {
    return supabase
      .channel(`trip_${tripId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
        (payload) => onUpdate(payload.new)
      )
      .subscribe();
  }
};

export const DriverService = {
  /**
   * Fetch pending trip requests
   */
  async getPendingTrips() {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('status', 'requested')
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Accept a trip
   */
  async acceptTrip(tripId: string, driverId: string) {
    const { data, error } = await supabase
      .from('trips')
      .update({
        driver_id: driverId,
        status: 'accepted',
        started_at: new Date().toISOString(),
      })
      .eq('id', tripId)
     .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Complete a trip and process payment
   */
  async completeTrip(tripId: string, riderId: string, amount: number) {
    // 1. Update Trip Status
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', tripId)
      .select()
      .single();
    
    if (tripError) throw tripError;

    // 2. Process Rider Payment
    // Get current balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', riderId)
      .single();
    
    const newBalance = Number(profile?.wallet_balance || 0) - amount;

    // Update Rider Balance
    await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', riderId);

    // 3. Process Community Fund Levy (1% Solidarity Levy)
    const levyAmount = amount * 0.01;
    await supabase
      .from('fund_transactions')
      .insert({
        trip_id: tripId,
        type: 'levy_credit',
        amount: levyAmount,
        description: `Solidarity Levy - Trip #${tripId.slice(0, 8)}`
      });

    // 4. Log Transaction for Rider
    await supabase
      .from('wallet_transactions')
      .insert({
        profile_id: riderId,
        type: 'ride_payment',
        amount: -amount,
        description: `Ride Payment - Trip #${tripId.slice(0, 8)}`,
        reference: tripId,
      });

    return trip;
  }
};

export const FinanceService = {
  /**
   * Get total wallet balance for a user
   */
  async getBalance(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data.wallet_balance;
  },

  /**
   * Get transaction history for a user
   */
  async getTransactions(userId: string) {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Top up wallet balance
   * Note: Performs a simple update and insert. 
   * In full production, this should be handled by a Database Trigger or Edge Function to ensure atomicity.
   */
  async topUpWallet(userId: string, amount: number) {
    // 1. Get current balance
    const currentBalance = await this.getBalance(userId);
    const newBalance = Number(currentBalance) + amount;

    // 2. Update balance
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', userId);
    
    if (profileError) throw profileError;

    // 3. Log transaction
    const { data, error: txnError } = await supabase
      .from('wallet_transactions')
      .insert({
        profile_id: userId,
        type: 'topup',
        amount: amount,
        description: `Wallet Top-up via Card`,
      })
      .select()
      .single();
    
    if (txnError) throw txnError;
    return { data, newBalance };
  },

  /**
   * Get Driver earnings summaries
   */
  async getDriverEarnings(driverId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    // Aggregating Today's Earnings
    const { data: todayData, error: todayError } = await supabase
      .from('trips')
      .select('fare_total')
      .eq('driver_id', driverId)
      .eq('status', 'completed')
      .gte('completed_at', startOfDay);
    
    if (todayError) throw todayError;
    
    const todayTotal = todayData.reduce((acc, trip) => acc + Number(trip.fare_total), 0);

    // Weekly/Monthly aggregation would follow a similar pattern with different date ranges
    // For now, we'll return today's total and fetch payout history
    const { data: payouts, error: payoutError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('profile_id', driverId)
      .eq('type', 'payout')
      .order('created_at', { ascending: false });
    
    if (payoutError) throw payoutError;

    return {
      today: todayTotal,
      payouts: payouts
    };
  }
};

export const FintechService = {
  /**
   * Submit a request to withdraw funds from the cooperative wallet
   */
  async requestPayout(userId: string, amount: number, method: string, details: any) {
    return RiderService.applyOfflineSafety('REQUEST_PAYOUT', { amount, method, details }, userId, async () => {
      const { data, error } = await supabase
        .from('payout_requests')
        .insert({
          profile_id: userId,
          amount,
          payment_method: method,
          account_details: details,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;

      // Log a provisional transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          profile_id: userId,
          type: 'payout',
          amount: -amount,
          description: `Payout Request (Ref: ${data.id.slice(0,8)})`,
          reference: data.id
        });

      return data;
    });
  },

  async getPayoutRequests(userId: string) {
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getWealthOverview(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance, reward_points, shares, last_dividend_at, total_withdrawn')
      .eq('id', userId)
      .single();

    return {
      wallet: profile?.wallet_balance || 0,
      rewards: profile?.reward_points || 0,
      shares: profile?.shares || 0,
      lastDividend: profile?.last_dividend_at,
      totalWithdrawn: profile?.total_withdrawn || 0
    };
  }
};

export const GovernanceService = {
  /**
   * Fetch active and past proposals
   */
  async getProposals() {
    const { data, error } = await supabase
      .from('coop_proposals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Cast a vote on a proposal (Democratic: 1 Member = 1 Vote)
   */
  async castVote(proposalId: string, userId: string, vote: boolean) {
    return RiderService.applyOfflineSafety('CAST_VOTE', { proposalId, vote }, userId, async () => {
      // 1. Calculate effective voting power (Self + Delegations)
      const weight = await this.calculateVotingPower(userId, 'general');

      // 2. Record the vote with weight
      const { error: voteError } = await supabase
        .from('coop_votes')
        .upsert({ proposal_id: proposalId, profile_id: userId, vote, weight });
      
      if (voteError) throw voteError;

      // 3. Fetch all votes for this proposal, summing by weight
      const { data: votes, error: fetchError } = await supabase
        .from('coop_votes')
        .select('vote, weight')
        .eq('proposal_id', proposalId);
      
      if (fetchError) throw fetchError;

      const votesFor = votes.reduce((sum, v) => v.vote ? sum + (v.weight || 1) : sum, 0);
      const votesAgainst = votes.reduce((sum, v) => !v.vote ? sum + (v.weight || 1) : sum, 0);

      // 4. Update proposal tally
      const { error: updateError } = await supabase
        .from('coop_proposals')
        .update({ votes_for: votesFor, votes_against: votesAgainst })
        .eq('id', proposalId);
      
      if (updateError) throw updateError;
      
      return { success: true, votesFor, votesAgainst };
    });
  },

  /**
   * Delegate voting power to another member
   */
  async delegatePower(toUserId: string, category: string = 'general') {
    const { data: session } = await supabase.auth.getSession();
    const delegatorId = session.session?.user.id;
    if (!delegatorId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('coop_delegations')
      .upsert({ delegator_id: delegatorId, delegate_id: toUserId, category });
    
    if (error) throw error;
    return true;
  },

  /**
   * Revoke delegation in a specific category
   */
  async revokeDelegation(category: string = 'general') {
    const { data: session } = await supabase.auth.getSession();
    const delegatorId = session.session?.user.id;
    if (!delegatorId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('coop_delegations')
      .delete()
      .eq('delegator_id', delegatorId)
      .eq('category', category);
    
    if (error) throw error;
    return true;
  },

  /**
   * Calculate total voting power (Self + Direct Delegations)
   */
  async calculateVotingPower(userId: string, category: string = 'general') {
    // Start with self (1 vote)
    let power = 1;

    // Add count of direct delegators
    const { count, error } = await supabase
      .from('coop_delegations')
      .select('*', { count: 'exact', head: true })
      .eq('delegate_id', userId)
      .eq('category', category);
    
    if (error) throw error;
    power += (count || 0);

    return power;
  },

  /**
   * Fetch current delegations for the user
   */
  async getMyDelegations(userId: string) {
    const { data, error } = await supabase
      .from('coop_delegations')
      .select('*, delegate:profiles!delegate_id(name)')
      .eq('delegator_id', userId);
    
    if (error) throw error;
    return data;
  },

  /**
   * Check if user has already voted on a proposal
   */
  async hasVoted(proposalId: string, userId: string) {
    const { data, error } = await supabase
      .from('coop_votes')
      .select('*')
      .eq('proposal_id', proposalId)
      .eq('profile_id', userId)
      .maybeSingle();
    
    if (error) throw (error);
    return !!data;
  },

  async getMemberVote(proposalId: string, profileId: string) {
    const { data, error } = await supabase
      .from('coop_votes')
      .select('*')
      .eq('proposal_id', proposalId)
      .eq('profile_id', profileId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Fetch member profile including shares and benefits
   */
  async getMemberProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('shares, benefits_medical_aid, benefits_funeral_policy, benefits_retirement, verification_status')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new proposal (Admin only)
   */
  async createProposal(title: string, description: string, deadline: string, totalEligible: number = 1000) {
    const { data, error } = await supabase
      .from('coop_proposals')
      .insert({
        title,
        description,
        deadline,
        total_eligible: totalEligible
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getVotingPower(profileId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_trips')
      .eq('id', profileId)
      .single();
    
    if (error) throw error;
    
    const basePower = 1;
    const activityPower = Math.floor((data.total_trips || 0) / 10);
    return basePower + activityPower;
  },

  async getVotesForProposal(proposalId: string) {
    const { data, error } = await supabase
      .from('coop_votes')
      .select('vote, profile_id')
      .eq('proposal_id', proposalId);
    if (error) throw error;
    return data;
  }
};

export const SyncService = {
  /**
   * Create a Multi-Modal Combo Booking (Multi-leg Journey)
   */
  async createComboBooking(riderId: string, legs: any[]) {
    // 1. Create a "Parent" trip as the shell for the journey
    const { data: parent, error: pError } = await supabase
      .from('trips')
      .insert({
        rider_id: riderId,
        pickup_address: legs[0].pickup_address,
        pickup_lat: legs[0].pickup_lat,
        pickup_lng: legs[0].pickup_lng,
        dropoff_address: legs[legs.length - 1].dropoff_address,
        dropoff_lat: legs[legs.length - 1].dropoff_lat,
        dropoff_lng: legs[legs.length - 1].dropoff_lng,
        status: 'accepted', // Parent is just a container
        fare_total: legs.reduce((sum, l) => sum + l.fare, 0),
        vehicle_type: 'multi-modal',
        combo_metadata: { leg_count: legs.length, is_combo: true }
      })
      .select()
      .single();

    if (pError) throw pError;

    // 2. Create the individual segments
    const segments = [];
    let previousSegmentId = null;

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const { data: segment, error: sError } = await supabase
        .from('trips')
        .insert({
          rider_id: riderId,
          parent_trip_id: parent.id,
          segment_index: i,
          segment_type: leg.type,
          pickup_address: leg.pickup_address,
          pickup_lat: leg.pickup_lat,
          pickup_lng: leg.pickup_lng,
          dropoff_address: leg.dropoff_address,
          dropoff_lat: leg.dropoff_lat,
          dropoff_lng: leg.dropoff_lng,
          status: i === 0 ? 'requested' : 'accepted', // Only first leg starts as "requested"
          fare_total: leg.fare,
          vehicle_type: leg.vehicle_type
        })
        .select()
        .single();
      
      if (sError) throw sError;
      segments.push(segment);

      // Link previous segment to this one if needed (sequential triggering)
      if (previousSegmentId) {
        await supabase
          .from('trips')
          .update({ next_segment_id: segment.id })
          .eq('id', previousSegmentId);
      }
      previousSegmentId = segment.id;
    }

    return { parent, segments };
  },

  /**
   * Get the unified status of a Multi-Modal Journey
   */
  async getJourneyStatus(parentId: string) {
    const { data: segments, error } = await supabase
      .from('trips')
      .select('*, driver:profiles!driver_id(name, phone, rating, avatar_url), vehicle:vehicles(*)')
      .eq('parent_trip_id', parentId)
      .order('segment_index', { ascending: true });
    
    if (error) throw error;
    
    return {
      parentId,
      segments,
      currentLeg: segments.findIndex(s => s.status !== 'completed') || 0,
      isCompleted: segments.every(s => s.status === 'completed')
    };
  }
};

export const GlobalService = {
  /**
   * Fetch regional configurations and exchange rates
   */
  async getExchangeRates() {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  /**
   * Get localized emergency contacts for the user's region
   */
  getEmergencyContacts(regionCode: string = 'ZA') {
    const contacts: Record<string, { police: string; ambulance: string; coop_dispatch: string }> = {
      'ZA': { police: '10111', ambulance: '10177', coop_dispatch: '0800-COMO-SA' },
      'ZW': { police: '995', ambulance: '994', coop_dispatch: '0800-COMO-ZW' },
      'BW': { police: '999', ambulance: '997', coop_dispatch: '0800-COMO-BW' },
      'default': { police: '112', ambulance: '112', coop_dispatch: '0800-COMO-INT' }
    };
    return contacts[regionCode] || contacts['default'];
  },

  /**
   * Update user's regional and currency preferences
   */
  async updateRegionalPreferences(userId: string, currency: string, regionCode: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        currency, 
        region_code: regionCode 
      })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  }
};

export const TreasuryService = {
  /**
   * Update vehicle equity split after a trip (Rent-to-Own contribution)
   */
  async updateVehicleEquity(vehicleId: string, memberContribution: number) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('equity_member, equity_coop')
      .eq('id', vehicleId)
      .single();
    
    if (!vehicle) return;

    await supabase
      .from('vehicles')
      .update({
        equity_member: Number(vehicle.equity_member) + memberContribution,
        equity_coop: Math.max(0, Number(vehicle.equity_coop) - memberContribution)
      })
      .eq('id', vehicleId);
    
    await supabase.from('treasury_logs').insert({
      action_type: 'EQUITY_BUYOUT',
      amount: memberContribution,
      reference_id: vehicleId,
      metadata: { description: 'Rent-to-Own buyout contribution from trip' }
    });
  },

  /**
   * Run annual depreciation calculation for the entire fleet
   */
  async runFleetDepreciation() {
    const { data: vehicles } = await supabase.from('vehicles').select('*');
    if (!vehicles) return;

    for (const v of vehicles) {
      const depreciation = Number(v.market_value) * (Number(v.depreciation_rate_annual) / 100 / 12); // monthly
      await supabase
        .from('vehicles')
        .update({ market_value: Math.max(0, Number(v.market_value) - depreciation) })
        .eq('id', v.id);
    }
  },

  /**
   * Get global treasury metrics (Institutional View)
   */
  async getTreasuryState() {
    const { data: vehicles } = await supabase.from('vehicles').select('market_value, equity_coop, equity_member');
    const { data: fund } = await supabase.from('community_fund').select('balance').single();

    const fleetValue = vehicles?.reduce((s,v) => s + Number(v.market_value), 0) || 0;
    const coopEquity = vehicles?.reduce((s,v) => s + Number(v.equity_coop), 0) || 0;
    const runnerEquity = vehicles?.reduce((s,v) => s + Number(v.equity_member), 0) || 0;

    return {
      fleetValue,
      coopEquity,
      runnerEquity,
      cashReserve: fund?.balance || 0,
      totalAssets: fleetValue + (fund?.balance || 0),
      currency: 'ZAR'
    };
  }
};

export const IdentityService = {
  /**
   * Export all personal data as a JSON bundle (GDPR/POPIA Portability)
   */
  async exportUserData(userId: string) {
    const [profile, trips, transactions] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('trips').select('*').eq('rider_id', userId),
      supabase.from('wallet_transactions').select('*').eq('profile_id', userId)
    ]);

    return {
      export_date: new Date().toISOString(),
      member_profile: profile.data,
      trip_history: trips.data,
      financial_transactions: transactions.data,
      legal_notice: "This data is provided under the cooperative data sovereignty framework."
    };
  },

  /**
   * Update member privacy preferences
   */
  async updatePrivacySettings(userId: string, settings: any) {
    const { error } = await supabase
      .from('profiles')
      .update({ privacy_settings: settings })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  },

  /**
   * Deactivate and Anonymize account (Right to be Forgotten)
   */
  async anonymizeAccount(userId: string) {
    const { error } = await supabase.rpc('anonymize_profile', { user_uuid: userId });
    if (error) throw error;
    return true;
  }
};

export const AssociationService = {
  /**
   * Fetch aggregate stats for an association dashboard
   */
  async getAssociationStats(associationId: string) {
    const { count: driverCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', associationId)
      .eq('role', 'driver');
    
    const { count: activeFleet } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', associationId)
      .eq('status', 'active');

    const { data: association } = await supabase
      .from('taxi_associations')
      .select('*')
      .eq('id', associationId)
      .single();

    return {
      name: association?.name,
      driverCount,
      activeFleet,
      monthlyLevy: association?.monthly_levy,
      region: association?.region
    };
  },

  /**
   * Fetch all drivers registered to this association
   */
  async getMembers(associationId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, vehicles(*)')
      .eq('association_id', associationId)
      .eq('role', 'driver');
    
    if (error) throw error;
    return data;
  },

  /**
   * Fetch authorized routes for the association
   */
  async getAuthorizedRoutes(associationId: string) {
    const { data, error } = await supabase
      .from('association_routes')
      .select('*, start_rank:taxi_ranks!start_rank_id(name), end_rank:taxi_ranks!end_rank_id(name)')
      .eq('association_id', associationId);
    
    if (error) throw error;
    return data;
  },

  /**
   * Simulates a check to ensure a trip stayed within association boundaries
   */
  async checkRouteCompliance(tripId: string) {
    // In production, this would query a PostGIS function that checks 
    // the trip trace against association_routes polygons.
    console.log(`[Compliance] Verifying trip ${tripId} trace against regional geo-fences...`);
    
    // Simulate a 95% compliance rate
    const isCompliant = Math.random() > 0.05;
    
    return {
      compliant: isCompliant,
      deviationPoints: isCompliant ? [] : [{ lat: -26.2, lng: 28.0, reason: 'Unauthorized off-route pickup' }],
      checkedAt: new Date().toISOString()
    };
  },

  /**
   * Deduct association levy from driver wallet
   */
  async collectAssociationLevy(profileId: string, associationId: string) {
    const { data: assoc } = await supabase.from('taxi_associations').select('monthly_levy, name').eq('id', associationId).single();
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', profileId).single();
    
    if (!assoc || !profile) throw new Error('Invalid metadata for levy collection');

    const amount = Number(assoc.monthly_levy);
    if (profile.wallet_balance < amount) throw new Error('Insufficient wallet balance for association dues.');

    await supabase
      .from('profiles')
      .update({ wallet_balance: Number(profile.wallet_balance) - amount })
      .eq('id', profileId);

    await supabase.from('wallet_transactions').insert({
      profile_id: profileId,
      type: 'levy_contribution',
      amount: -amount,
      description: `Monthly Association Dues: ${assoc.name}`
    });

    return true;
  }
};

export const RealtimeService = {
  /**
   * Subscribe to global platform stats (Admin only)
   */
  subscribeToPlatformStats(onUpdate: () => void) {
    return supabase
      .channel('platform_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onUpdate)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wallet_transactions' }, onUpdate)
      .subscribe();
  },

  /**
   * Subscribe to driver location broadcasts (for Rider Map)
   */
  subscribeToDriverLocations(onUpdate: (payload: any) => void) {
    return supabase
      .channel('driver_locations')
      .on('broadcast', { event: 'location' }, (payload: any) => onUpdate(payload.payload))
      .subscribe();
  },

  /**
   * Broadcast driver location
   */
  async broadcastLocation(driverId: string, lat: number, lng: number) {
    const channel = supabase.channel('driver_locations');
    await channel.subscribe();
    return channel.send({
      type: 'broadcast',
      event: 'location',
      payload: { driverId, lat, lng, timestamp: new Date().toISOString() },
    });
  },

  /**
   * Subscribe to specific user updates (Profile/Wallet)
   */
  subscribeToUserUpdates(userId: string, onUpdate: (payload: any) => void) {
    return supabase
      .channel(`user_${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => onUpdate(payload.new)
      )
      .subscribe();
  }
};

export const NotificationService = {
  /**
   * Fetch all notifications for the current user
   */
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) throw error;
  },

  /**
   * Create a notification (Internal helper)
   */
  async createNotification(userId: string, title: string, message: string, type: string, data: any = {}) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data
      });
    
    if (error) throw error;
  }
};

export const SafetyService = {
  /**
   * Trigger a community SOS
   */
  async triggerSOS(profileId: string, tripId: string | null, lat: number, lng: number) {
    return RiderService.applyOfflineSafety('TRIGGER_SOS', { tripId, lat, lng }, profileId, async () => {
      const { data: alert, error } = await supabase
        .from('emergency_alerts')
        .insert({
          profile_id: profileId,
          trip_id: tripId,
          latitude: lat,
          longitude: lng,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;

      // Broadcast SOS
      const channel = supabase.channel('driver_safety_vibe');
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'SOS_TRIGGERED',
        payload: { alertId: alert.id, profileId, lat, lng, timestamp: new Date().toISOString() },
      });

      return alert;
    });
  },

  /**
   * Resolve an active SOS
   */
  async resolveSOS(alertId: string, notes: string) {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', alertId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async reportMember(reportData: {
    reporterId: string,
    accusedId: string,
    tripId?: string,
    type: string,
    description: string,
    severity: string
  }) {
    const { data, error } = await supabase
      .from('safety_reports')
      .insert({
        reporter_id: reportData.reporterId,
        accused_id: reportData.accusedId,
        trip_id: reportData.tripId,
        type: reportData.type,
        description: reportData.description,
        severity: reportData.severity,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    await AdminService.updateMemberTrust(reportData.accusedId, -5, `Automatic penalty: ${reportData.type} report filed.`);

    return data;
  }
};

export const PhakamisaService = {
  /**
   * Get total community fund balance
   */
  async getFundBalance() {
    const { data, error } = await supabase
      .from('community_fund')
      .select('balance')
      .single();
    
    if (error) throw error;
    return data.balance;
  },

  /**
   * Log a solidarity levy transaction
   */
  async logLevy(tripId: string, amount: number) {
    const { error } = await supabase
      .from('fund_transactions')
      .insert({
        trip_id: tripId,
        type: 'levy_credit',
        amount: amount,
        description: `Solidarity Levy - Trip #${tripId.slice(0, 8)}`
      });
    
    if (error) throw error;
  },

  /**
   * Deduct amount from fund (for dividends or expenses)
   */
  async deductFromFund(amount: number, type: string, description: string) {
    const { error } = await supabase
      .from('fund_transactions')
      .insert({
        type,
        amount: -amount,
        description
      });
    
    if (error) throw error;
  },

  /**
   * Fetch recent fund transactions for transparency
   */
  async getRecentTransactions() {
    const { data, error } = await supabase
      .from('fund_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return data;
  }
};

export const VerificationService = {
  /**
   * Fetch verification status and documents for a driver
   */
  async getVerificationStatus(userId: string) {
    const { data: docs, error: docsError } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('profile_id', userId);
    
    if (docsError) throw docsError;

    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('verification_status')
      .eq('id', userId)
      .single();
    
    if (profError) throw profError;

    return {
      status: profile?.verification_status || 'pending',
      documents: docs || []
    };
  },

  /**
   * Submit a document for verification
   */
  async submitDocument(profileId: string, docType: string, url: string, expiryDate?: string) {
    const { data, error } = await supabase
      .from('driver_documents')
      .insert({
        profile_id: profileId,
        doc_type: docType,
        doc_url: url,
        expiry_date: expiryDate,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Record a biometric selfie check
   */
  async recordBiometricCheck(profileId: string, selfieUrl: string, score: number = 0.98) {
    const { data, error } = await supabase
      .from('biometric_checks')
      .insert({
        profile_id: profileId,
        selfie_url: selfieUrl,
        liveness_score: score
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const AdminService = {
  /**
   * Fetch all pending driver documents for review
   */
  async getPendingDocs() {
    const { data, error } = await supabase
      .from('driver_documents')
      .select(`
        *,
        profile:profiles(full_name, email)
      `)
      .eq('status', 'pending')
      .order('uploaded_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Approve or reject a driver document
   */
  async verifyDoc(docId: string, status: 'verified' | 'rejected', reason?: string) {
    const { data, error } = await supabase
      .from('driver_documents')
      .update({
        status,
        rejection_reason: reason,
        verified_at: status === 'verified' ? new Date().toISOString() : null
      })
      .eq('id', docId)
      .select()
      .single();
    
    if (error) throw error;

    // If verified, check if ALL docs for this profile are verified
    if (status === 'verified') {
      const { data: allDocs } = await supabase
        .from('driver_documents')
        .select('status')
        .eq('profile_id', data.profile_id);
      
      const allVerified = allDocs?.every(d => d.status === 'verified');
      if (allVerified) {
        await supabase
          .from('profiles')
          .update({ verification_status: 'verified' })
          .eq('id', data.profile_id);
      }
    }

    return data;
  },

  /**
   * Fetch high-level platform metrics
   */
  async getPlatformMetrics() {
    // Current total in fund
    const { data: fund } = await supabase
      .from('community_fund')
      .select('balance')
      .single();
    
    // Total active drivers
    const { count: driversCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'driver');
    
    // Total trips completed
    const { count: tripsCount } = await supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    return {
      fundBalance: fund?.balance || 0,
      activeDrivers: driversCount || 0,
      totalTrips: tripsCount || 0,
      timestamp: new Date().toISOString()
    };
  },

  async getSafetyIncidents() {
    const { data: alerts, error: aError } = await supabase
      .from('emergency_alerts')
      .select('*, profile:profiles(name, phone)')
      .in('status', ['active', 'investigating'])
      .order('triggered_at', { ascending: false });
    
    if (aError) throw aError;

    const { data: reports, error: rError } = await supabase
      .from('safety_reports')
      .select('*, reporter:profiles!reporter_id(name), accused:profiles!accused_id(name)')
      .order('created_at', { ascending: false });
    
    if (rError) throw rError;

    return { alerts, reports };
  },

  async updateMemberTrust(profileId: string, scoreImpact: number, notes: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('trust_score')
      .eq('id', profileId)
      .single();
    
    const newScore = Math.max(0, Math.min(100, (profile?.trust_score || 100) + scoreImpact));

    const { data, error } = await supabase
      .from('profiles')
      .update({ trust_score: newScore })
      .eq('id', profileId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Get a preview of dividend distribution based on current fund balance
   */
  async getDividendPreview(percentage: number = 0.8) {
    const { data: fund } = await supabase.from('community_fund').select('balance').single();
    const pool = (fund?.balance || 0) * percentage;

    // Get all verified drivers
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, name, total_trips, trust_score')
      .eq('role', 'driver')
      .eq('verification_status', 'verified');
    
    if (error) throw error;

    if (totalTrips === 0) return { pool, distributions: [] };

    // 2. Fetch Rank Multipliers for performance-based weighting
    const { data: rankMultipliers } = await supabase.from('rank_performance_multipliers').select('*');

    const distributions = members.map(m => {
      let weight = (m.total_trips / totalTrips) * 0.7 + (m.trust_score / 100) * 0.3;
      
      // Apply Performance Multiplier if applicable
      const rankMult = rankMultipliers?.find(rm => rm.rank_id === m.primary_rank_id);
      if (rankMult) {
        weight *= (Number(rankMult.safety_multiplier) + Number(rankMult.efficiency_multiplier)) / 2;
      }

      return {
        profileId: m.id,
        name: m.name,
        trips: m.total_trips,
        trust: m.trust_score,
        weight,
        amount: 0
      };
    });

    const totalWeight = distributions.reduce((sum, d) => sum + d.weight, 0);
    
    distributions.forEach(d => {
      d.amount = (d.weight / totalWeight) * pool;
    });

    return { 
      pool, 
      totalWeight,
      totalTrips,
      distributions: distributions.filter(d => d.amount > 0).sort((a,b) => b.amount - a.amount) 
    };
  },

  /**
   * Execute the actual distribution batch
   */
  async executeDividendDistribution(poolAmount: number, distributions: any[]) {
    // 1. Create Batch Record
    const { data: batch, error: bError } = await supabase
      .from('dividend_batches')
      .insert({
        total_pool: poolAmount,
        distributed_amount: distributions.reduce((s,d) => s + d.amount, 0),
        member_count: distributions.length
      })
      .select()
      .single();
    
    if (bError) throw bError;

    // 2. Bulk Update Wallets
    for (const d of distributions) {
      const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', d.profileId).single();
      const newBalance = Number(profile?.wallet_balance || 0) + d.amount;
      
      await supabase
        .from('profiles')
        .update({ 
          wallet_balance: newBalance,
          last_dividend_at: new Date().toISOString()
        })
        .eq('id', d.profileId);
      
      await supabase.from('wallet_transactions').insert({
        profile_id: d.profileId,
        type: 'dividend',
        amount: d.amount,
        description: `Cooperative Dividend - Batch #${batch.id.slice(0,8)}`,
        reference: batch.id
      });
    }

    // 3. Deduct from Community Fund
    await PhakamisaService.deductFromFund(
      batch.distributed_amount, 
      'dividend_payout', 
      `Dividend Distribution Batch #${batch.id.slice(0,8)}`
    );

    return batch;
  },

  async getPendingPayouts() {
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*, profile:profiles(name, wallet_balance)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async processPayout(requestId: string, status: 'approved' | 'rejected', reason?: string) {
    const { data: request, error: rError } = await supabase
      .from('payout_requests')
      .update({ status, rejection_reason: reason, processed_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();
    
    if (rError) throw rError;

    if (status === 'rejected') {
      const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', request.profile_id).single();
      await supabase
        .from('profiles')
        .update({ wallet_balance: Number(profile?.wallet_balance || 0) + Number(request.amount) })
        .eq('id', request.profile_id);
      
      await supabase.from('wallet_transactions').insert({
        profile_id: request.profile_id,
        type: 'refund',
        amount: request.amount,
        description: `Refund: Payout Rejected - ${reason || 'Policy mismatch'}`,
        reference: request.id
      });
    }

    return request;
  }
};

export const RewardsService = {
  /**
   * Fetch a user's reward balance and history
   */
  async getPoints(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('reward_points')
      .eq('id', userId)
      .single();
    
    const { data: history } = await supabase
      .from('rewards_history')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });
    
    return {
      balance: profile?.reward_points || 0,
      history: history || []
    };
  },

  /**
   * Redeem points for a platform benefit
   */
  async redeem(userId: string, amount: number, benefit: string) {
    // Check balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('reward_points')
      .eq('id', userId)
      .single();
    
    if (!profile || profile.reward_points < amount) {
      throw new Error('Insufficient points balance.');
    }

    // Deduct and log
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ reward_points: profile.reward_points - amount })
      .eq('id', userId);
    
    if (updateError) throw updateError;

    await supabase
      .from('rewards_history')
      .insert({
        profile_id: userId,
        amount: -amount,
        description: `Redeemed for: ${benefit}`,
        category: 'redemption'
      });

    return true;
  }
};

export const CallService = {
  /**
   * Generates a secure signal for a private VoIP call
   * In a real app, this would ping a SIP/WebRTC turn server
   */
  async initiatePrivateCall(toUserId: string) {
    const { data: recipient } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', toUserId)
      .single();
    
    console.log(`[Signal] Initiating private VoIP tunnel to ${recipient?.full_name || 'Member'}`);
    
    return {
      channelId: Math.random().toString(36).substring(7),
      calleeName: recipient?.full_name || 'Member',
      privacyShield: 'ACTIVE'
    };
  }
};


export const OwnerService = {
  getFleetMetrics: async (ownerId: string) => {
    const { data: vehicles, error: vError } = await supabase
      .from('vehicles')
      .select('*, trips(id, fare_total, status)')
      .eq('owner_id', ownerId);
    
    if (vError) throw vError;

    const totalEarnings = vehicles.reduce((sum, v) => {
      const vehicleEarnings = v.trips
        .filter((t: any) => t.status === 'completed')
        .reduce((s: number, t: any) => s + parseFloat(t.fare_total), 0);
      return sum + vehicleEarnings;
    }, 0);

    const totalTrips = vehicles.reduce((sum, v) => sum + v.trips.length, 0);

    return {
      vehicleCount: vehicles.length,
      totalEarnings,
      totalTrips,
      vehicles: vehicles.map(v => ({
        id: v.id,
        make: v.make,
        model: v.model,
        plate: v.plate_number,
        health: v.health_score,
        earnings: v.trips
          .filter((t: any) => t.status === 'completed')
          .reduce((s: number, t: any) => s + parseFloat(t.fare_total), 0)
      }))
    };
  },

  registerVehicle: async (ownerId: string, vehicleData: any) => {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        owner_id: ownerId,
        make: vehicleData.make,
        model: vehicleData.model,
        plate_number: vehicleData.plateNumber,
        year: vehicleData.year,
        color: vehicleData.color,
        health_score: 100, // New vehicle starts at perfect health
        status: 'active'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const DisputeService = {
  fileDispute: async (tripId: string, reporterId: string, accusedId: string, reason: string) => {
    const { data, error } = await supabase
      .from('disputes')
      .insert({ trip_id: tripId, reporter_id: reporterId, accused_id: accusedId, reason })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getMediationQueue: async () => {
    const { data, error } = await supabase
      .from('disputes')
      .select('*, trips(*), reporter:profiles!reporter_id(name), accused:profiles!accused_id(name)')
      .eq('status', 'open');
    if (error) throw error;
    return data;
  },

  castMediationVote: async (disputeId: string, mediatorId: string, vote: string, comment: string) => {
    const { error } = await supabase
      .from('mediation_votes')
      .insert({ dispute_id: disputeId, mediator_id: mediatorId, vote, comment });
    
    if (error) throw error;

    // Check if quorum (3) reached
    const { data: votes } = await supabase
      .from('mediation_votes')
      .select('id')
      .eq('dispute_id', disputeId);
    
    if (votes && votes.length >= 3) {
      await supabase
        .from('disputes')
        .update({ status: 'mediating' })
        .eq('id', disputeId);
    }
    
    return { success: true };
  }
};

export const LogisticsService = {
  createParcelOrder: async (details: any) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const { data, error } = await supabase
      .from('trips')
      .insert({
        ...details,
        service_type: 'PARCEL',
        parcel_metadata: { ...details.parcel_metadata, pickup_otp: otp }
      })
      .select()
      .single();
    if (error) throw error;
    return { ...data, otp };
  },

  confirmParcelPickup: async (tripId: string, otp: string) => {
    const { data: trip, error: fetchError } = await supabase
      .from('trips')
      .select('parcel_metadata')
      .eq('id', tripId)
      .single();
    
    if (fetchError) throw fetchError;
    if (trip.parcel_metadata?.pickup_otp !== otp) {
      throw new Error('Invalid OTP. Please confirm with the sender.');
    }

    const dropoffOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const { data, error } = await supabase
      .from('trips')
      .update({
        status: 'accepted', // or 'in_progress' if we had that state specifically for parcels
        parcel_metadata: { ...trip.parcel_metadata, dropoff_otp: dropoffOtp }
      })
      .eq('id', tripId)
      .select()
      .single();
    
    if (error) throw error;
    return { ...data, dropoffOtp };
  },

  confirmParcelDropoff: async (tripId: string, otp: string) => {
    const { data: trip, error: fetchError } = await supabase
      .from('trips')
      .select('parcel_metadata, fare_total, rider_id')
      .eq('id', tripId)
      .single();
    
    if (fetchError) throw fetchError;
    if (trip.parcel_metadata?.dropoff_otp !== otp) {
      throw new Error('Invalid delivery OTP. Please confirm with the recipient.');
    }

    // This triggers the standard completion logic
    return DriverService.completeTrip(tripId, trip.rider_id, trip.fare_total);
  }
};

export * from './whatsapp';

