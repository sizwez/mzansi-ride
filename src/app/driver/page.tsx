'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Power, MapPin, Star, Shield, Clock, Navigation, Phone, MessageSquare, Check, X, ChevronRight, TrendingUp, AlertTriangle, ShieldAlert, Trophy, Scale } from 'lucide-react';
import { SA_LOCATIONS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/fare-calculator';
import { useAuth } from '@/context/AuthContext';
import { DriverService, NotificationService, SafetyService, VerificationService, RewardsService, CallService, GovernanceService } from '@/services/api';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import CallOverlay from '@/components/CallOverlay';

const MapView = dynamic(() => import('@/components/map/MapView'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', background: 'var(--surface-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Navigation className="animate-pulse" color="var(--green-light)" /></div>
});

export default function DriverDashboard() {
  const { user, role, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [inProgressTrip, setInProgressTrip] = useState<any>(null);
  const [requestTimer, setRequestTimer] = useState(30);
  const [currentPos, setCurrentPos] = useState<[number, number]>([-26.2041, 28.0473]);
  const [verificationStatus, setVerificationStatus] = useState<string>('pending');
  const [activeSOS, setActiveSOS] = useState<any>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [rewardsBalance, setRewardsBalance] = useState(0);
  const [parcelOtpInput, setParcelOtpInput] = useState('');
  const [parcelStage, setParcelStage] = useState<'pickup' | 'delivery'>('pickup');
  const [isSosTriggered, setIsSosTriggered] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      RewardsService.getPoints(user.id).then(r => setRewardsBalance(r.balance));
    }
  }, [user]);

  const handlePrivateCall = async () => {
    if (!inProgressTrip && !activeRequest) return;
    const targetId = inProgressTrip?.rider_id || activeRequest?.rider_id;
    if (!targetId) return;
    await CallService.initiatePrivateCall(targetId);
    setIsCallOpen(true);
  };

  // FETCH REAL VERIFICATION STATUS
  useEffect(() => {
    if (!user || !mounted) return;
    const fetchStatus = async () => {
      try {
        const data = await VerificationService.getVerificationStatus(user.id);
        setVerificationStatus(data.status);
      } catch (err) {
        console.error('Error fetching verification status:', err);
      }
    };
    fetchStatus();
  }, [user, mounted]);

  // LOCATION BROADCAST: Send GPS updates to riders every 5s when online
  useEffect(() => {
    if (!isOnline || !mounted || !user) return;

    const interval = setInterval(async () => {
      // Small simulated movement
      setCurrentPos(prev => [
        prev[0] + (Math.random() - 0.5) * 0.0005,
        prev[1] + (Math.random() - 0.5) * 0.0005
      ]);

      const channel = supabase.channel('driver_locations');
      await channel.send({
        type: 'broadcast',
        event: 'location',
        payload: { driverId: user.id, lat: currentPos[0], lng: currentPos[1], timestamp: new Date().toISOString() },
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isOnline, mounted, user, currentPos]);

  // ... (rest of the effects)

  // Listen for NEW ride requests and WALLET updates in real-time
  useEffect(() => {
    if (!mounted || !user) return;

    const reqChannel = supabase
      .channel('incoming_requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trips', filter: 'status=eq.requested' },
        (payload) => {
          if (!isOnline) return;
          console.log('New trip request!', payload.new);
          setActiveRequest(payload.new);
          setShowRequest(true);
          setRequestTimer(30);
        }
      )
      .subscribe();

    const walletChannel = supabase
      .channel('driver_wallet_sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions', filter: `profile_id=eq.${user.id}` },
        () => {
          // Re-fetch earnings or just increment local state
          // For now, let's assume we fetch update in background or trigger a refresh signal
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reqChannel);
      supabase.removeChannel(walletChannel);
    };
  }, [isOnline, mounted, user]);

  // Countdown timer for request
  useEffect(() => {
    if (!showRequest) return;
    const interval = setInterval(() => {
      setRequestTimer(prev => {
        if (prev <= 1) {
          setShowRequest(false);
          setActiveRequest(null);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showRequest]);

  const handleAcceptRide = async () => {
    if (!activeRequest || !user) return;
    try {
      const trip = await DriverService.acceptTrip(activeRequest.id, user.id);
      
      // NOTIFY RIDER persistent
      await NotificationService.createNotification(
        activeRequest.rider_id,
        activeRequest.service_type === 'PARCEL' ? 'Courier Found!' : 'Driver Found!',
        activeRequest.service_type === 'PARCEL' ? 'Your courier is on the way to pick up the parcel.' : 'Your driver is on the way. Check the map for their location.',
        'trip_status',
        { trip_id: activeRequest.id }
      );

      setInProgressTrip(trip);
      setParcelStage('pickup');
      setShowRequest(false);
      setActiveRequest(null);
    } catch (err) {
      console.error('Error accepting trip:', err);
    }
  };

  const handleVerifyParcel = async () => {
    if (!inProgressTrip) return;
    try {
      if (parcelStage === 'pickup') {
        const result = await LogisticsService.confirmParcelPickup(inProgressTrip.id, parcelOtpInput);
        setInProgressTrip(result);
        setParcelStage('delivery');
        setParcelOtpInput('');
        alert('Pickup verified! Proceed to delivery location.');
      } else {
        await LogisticsService.confirmParcelDropoff(inProgressTrip.id, parcelOtpInput);
        setInProgressTrip(null);
        setParcelOtpInput('');
        alert('Delivery completed successfully!');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTriggerSOS = async () => {
    if (!user) return;
    try {
      setIsSosTriggered(true);
      await SafetyService.triggerSOS(user.id, inProgressTrip?.id || null, currentPos[0], currentPos[1]);
      
      // WhatsApp fallback for drivers
      const link = WhatsAppService.generateSOSAlertLink('My current driver route');
      window.open(link, '_blank');
      
      alert('🚨 DRIVER SOS TRIGGERED. Association dispatchers and nearby members notified.');
    } catch (err) {
      console.error('SOS Trigger failed:', err);
    }
  };

  const handleCompleteTrip = async () => {
    if (!inProgressTrip) return;
    try {
      await DriverService.completeTrip(inProgressTrip.id, inProgressTrip.rider_id, inProgressTrip.fare_total);
      
      // NOTIFY RIDER persistent
      await NotificationService.createNotification(
        inProgressTrip.rider_id,
        'Trip Completed',
        `You've arrived! Thank you for riding with Co-Mo.`,
        'trip_status',
        { trip_id: inProgressTrip.id }
      );

      // NOTIFY DRIVER persistent
      await NotificationService.createNotification(
        user.id,
        'Trip Completed',
        `Successfully completed trip. Earnings added to your wallet.`,
        'payment',
        { trip_id: inProgressTrip.id }
      );

      setInProgressTrip(null);
      // Show success message or earnings update
    } catch (err) {
      console.error('Error completing trip:', err);
    }
  };

  const handleToggleOnline = useCallback(() => {
    if (verificationStatus !== 'verified') {
      alert("⚠️ CO-OP TRUST GATE: Verification required to accept rides. Visit the Verification Center.");
      return;
    }
    setIsOnline(prev => !prev);
    setShowRequest(false);
  }, [verificationStatus]);

  if (!mounted || loading) return null;

  // For the demo, if no profile found, use default values
  const profileName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Driver';

  // Prepare map data
  const mapDrivers = [{ id: user.id, lat: currentPos[0], lng: currentPos[1], rotation: 0 }];
  const mapRoute: [number, number][] | undefined = inProgressTrip 
    ? [[currentPos[0], currentPos[1]], [inProgressTrip.pickup_lat, inProgressTrip.pickup_lng], [inProgressTrip.dropoff_lat, inProgressTrip.dropoff_lng]]
    : undefined;

  return (
    <div className="page-enter" style={{ position: 'relative' }}>
      {/* Interactive Map */}
      <div style={{
        height: '38vh',
        position: 'relative', overflow: 'hidden',
        zIndex: 0,
      }}>
        <MapView 
          center={currentPos}
          drivers={isOnline ? mapDrivers : []}
          route={mapRoute}
          destination={inProgressTrip ? [inProgressTrip.dropoff_lat, inProgressTrip.dropoff_lng] : undefined}
        />

        {/* Status banner overlay */}
        <div style={{
          position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
          background: isOnline ? 'rgba(0,168,107,0.8)' : 'rgba(10,14,26,0.8)',
          backdropFilter: 'blur(8px)',
          padding: '8px 20px', borderRadius: '20px',
          border: `1px solid ${isOnline ? 'rgba(0,168,107,0.3)' : 'var(--border-subtle)'}`,
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.875rem', fontWeight: 600,
          color: isOnline ? 'white' : 'var(--text-tertiary)',
          transition: 'all 0.4s ease',
          zIndex: 10,
        }}>
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
          {isOnline ? 'Online — Accepting Rides' : 'Offline'}
          <button 
            onClick={(e) => { e.stopPropagation(); handleTriggerSOS(); }} 
            className={`btn-icon ${isSosTriggered ? 'bg-ruby' : ''}`}
            style={{ 
              marginLeft: '8px', background: 'rgba(239, 68, 68, 0.2)', border: 'none', 
              borderRadius: '50%', width: '28px', height: '28px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Panic SOS"
          >
            🆘
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px', marginTop: '-28px', position: 'relative', zIndex: 10 }}>
        
        {/* Verification Alert Banner */}
        {verificationStatus !== 'verified' && (
          <Link href="/driver/verify" style={{ textDecoration: 'none' }}>
            <div className="card-glass animate-pulse" style={{
              padding: '16px', borderRadius: '16px', marginBottom: '16px',
              border: '1px solid var(--border-gold)',
              background: 'linear-gradient(90deg, rgba(244,169,0,0.1), transparent)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <ShieldAlert size={20} color="var(--gold)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gold)' }}>TRUST VERIFICATION PENDING</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Complete your profile to accept rides.</div>
              </div>
              <ChevronRight size={16} color="var(--text-tertiary)" />
            </div>
          </Link>
        )}

        {/* Online Toggle */}
        <div className="card-glass" style={{
          padding: '20px', borderRadius: '16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="avatar avatar-lg" style={{
              background: isOnline ? 'var(--gradient-green)' : 'var(--surface-400)',
            }}>
              {profileName[0]}
            </div>
            <div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{profileName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <Star size={13} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>4.9</span>
                <Shield size={12} style={{ color: 'var(--green-light)' }} />
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleOnline}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: isOnline ? 'var(--gradient-green)' : 'var(--surface-300)',
              border: `2px solid ${isOnline ? 'var(--green-light)' : 'var(--border-medium)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: isOnline ? '0 0 20px rgba(0,168,107,0.3)' : 'none',
              color: 'white',
            }}
          >
            <Power size={24} />
          </button>
        </div>

        {/* Rewards Card */}
        <div className="card-glass animate-fade-up" style={{
          padding: '16px', marginBottom: '16px', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(0,168,107,0.1) 0%, rgba(0,168,107,0.02) 100%)',
          border: '1px solid rgba(0,168,107,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '12px', background: 'var(--gradient-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Trophy size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>CO-OP REWARDS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{rewardsBalance.toLocaleString()} pts</div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green-light)', fontWeight: 600 }}>Active Multiplier: 1.2x</div>
        </div>

        {/* Today's Earnings Quick View */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Today', value: 'R0.00', color: 'var(--gold)' },
            { label: 'This Week', value: 'R0.00', color: 'var(--green-light)' },
            { label: 'Trips Today', value: '0', color: 'var(--sky)' },
          ].map((stat, i) => (
            <div key={i} className="stat-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </div>
              <div className="stat-value" style={{ fontSize: '1.25rem', color: stat.color, fontFamily: 'var(--font-mono)' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Active Trip Banner */}
        {inProgressTrip && (
          <div className="animate-slide-up" style={{ marginBottom: '16px' }}>
            <div className="card-glass" style={{
              padding: '20px', borderRadius: '20px',
              border: '1px solid var(--border-emerald)',
              background: 'rgba(0,168,107,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--emerald)' }}>
                  🚗 Active Trip
                </span>
                <span className="badge badge-green">In Progress</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className="avatar">{inProgressTrip.service_type === 'PARCEL' ? '📦' : 'R'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{inProgressTrip.service_type === 'PARCEL' ? 'Parcel Delivery' : 'Rider In-Car'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {parcelStage === 'pickup' ? `Pickup: ${inProgressTrip.pickup_name}` : `Drop-off: ${inProgressTrip.dropoff_name || inProgressTrip.dropoff_address}`}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)', fontSize: '1.125rem' }}>
                  {formatCurrency(inProgressTrip.fare_total)}
                </div>
              </div>

              {inProgressTrip.service_type === 'PARCEL' ? (
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-bold text-sky uppercase tracking-wider">Verification Required: {parcelStage.toUpperCase()}</div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter 4-digit OTP" 
                      className="flex-1 p-3 bg-surface-100 border-subtle rounded-lg text-lg font-mono tracking-widest text-center"
                      value={parcelOtpInput}
                      maxLength={4}
                      onChange={(e) => setParcelOtpInput(e.target.value)}
                    />
                    <button 
                      onClick={handleVerifyParcel}
                      disabled={parcelOtpInput.length < 4}
                      className="btn btn-primary px-6"
                    >
                      Verify
                    </button>
                  </div>
                  <p className="text-[10px] text-tertiary">Confirm code with {parcelStage === 'pickup' ? 'sender' : 'recipient'}.</p>
                </div>
              ) : (
                <button 
                  onClick={handleCompleteTrip}
                  className="btn btn-primary" 
                  style={{ width: '100%', background: 'var(--gradient-green)', border: 'none' }}
                >
                  <Check size={18} /> Complete Trip & Process Payment
                </button>
              )}
            </div>
          </div>
        )}

        {/* Governance Banner */}
        <Link href="/governance" style={{ textDecoration: 'none' }}>
          <div className="card-glass animate-fade-up" style={{
            padding: '16px', marginBottom: '16px', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(244,169,0,0.1) 0%, rgba(244,169,0,0.02) 100%)',
            border: '1px solid rgba(244,169,0,0.2)',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '12px', background: 'var(--surface-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(244,169,0,0.3)'
            }}>
              <Scale size={20} color="var(--gold)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Your Voice, Your Co-op</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Vote on fund allocations and community grants.</div>
            </div>
            <ChevronRight size={16} color="var(--text-tertiary)" />
          </div>
        </Link>

        {/* Demand indicator */}
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} style={{ color: 'var(--sunset)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Demand Right Now</span>
            </div>
            <span className="badge badge-sunset">High</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: '78%', background: 'linear-gradient(90deg, var(--gold), var(--sunset))' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Sandton, Rosebank areas</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--sunset)', fontWeight: 600 }}>78%</span>
          </div>
        </div>

        {/* Recent trips placeholder */}
        <div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '12px' }}>Today&apos;s Trips</h3>
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            No trips completed today yet.
          </div>
        </div>
      </div>

      {/* Incoming Ride Request Popup */}
      {showRequest && activeRequest && (
        <div style={{
          position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 300,
          animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div className="card-glass" style={{
            padding: '20px', borderRadius: '20px',
            border: '1px solid var(--border-gold)',
            boxShadow: '0 -4px 40px rgba(244,169,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gold)' }}>
                🔔 New {activeRequest.service_type === 'PARCEL' ? 'Parcel' : 'Ride'} Request
              </span>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(244,169,0,0.1)', border: '2px solid var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem',
                color: 'var(--gold)',
              }}>
                {requestTimer}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div className="avatar">R</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{activeRequest.service_type === 'PARCEL' ? 'Parcel Sender' : 'Rider'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
                  <Star size={12} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
                  <span>4.8</span>
                  <Shield size={11} style={{ color: 'var(--green-light)', marginLeft: '4px' }} />
                  <span style={{ color: 'var(--green-light)', fontSize: '0.75rem' }}>{activeRequest.service_type === 'PARCEL' ? 'SECURE LOGISTICS' : 'Verified'}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)', fontSize: '1.125rem' }}>
                  {formatCurrency(activeRequest.fare_total)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Fixed rate</div>
              </div>
            </div>

            <div style={{
              padding: '12px', background: 'var(--surface-200)', borderRadius: '10px',
              marginBottom: '14px', fontSize: '0.8125rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{activeRequest.pickup_name || activeRequest.pickup_address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{activeRequest.dropoff_name || activeRequest.dropoff_address}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowRequest(false)} className="btn btn-secondary" style={{ flex: 1, gap: '6px' }}>
                <X size={18} /> Decline
              </button>
              <button onClick={handleAcceptRide} className="btn btn-primary" style={{ flex: 2, gap: '6px' }}>
                <Check size={18} /> Accept {activeRequest.service_type === 'PARCEL' ? 'Delivery' : 'Ride'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Community SOS Distress Overlay */}
      {activeSOS && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(153, 27, 27, 0.95)', // Deep ruby/red for urgency
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', animation: 'sosPulse 2s infinite'
        }}>
          <div style={{
            background: 'var(--surface-100)', width: '100%', maxWidth: '400px',
            borderRadius: '24px', padding: '32px', textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '2px solid white'
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'var(--ruby)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', animation: 'pulse-red 1.5s infinite'
            }}>
              <AlertTriangle size={40} color="white" />
            </div>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ruby)', marginBottom: '8px' }}>
              COMMUNITY SOS
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9375rem' }}>
              A member has triggered a panic alert nearby. The community is responding.
            </p>

            <div style={{ 
              background: 'var(--surface-200)', padding: '16px', borderRadius: '16px',
              marginBottom: '24px', textAlign: 'left', fontSize: '0.875rem'
            }}>
              <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Distress Location:</div>
              <div style={{ fontWeight: 600 }}>Approx. 1.2km from you (Soweto Central)</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => {
                  // In a real app, this would open Waze/G Maps
                  alert('Navigation starting to emergency location...');
                  setActiveSOS(null);
                }}
                className="btn btn-primary" 
                style={{ background: 'var(--ruby)', border: 'none', height: '56px' }}
              >
                <Navigation size={18} /> I AM RESPONDING
              </button>
              <button 
                onClick={() => setActiveSOS(null)}
                style={{ 
                  color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 600,
                  marginTop: '8px', background: 'none', border: 'none'
                }}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Call UI Overlay */}
      <CallOverlay 
        isOpen={isCallOpen} 
        onClose={() => setIsCallOpen(false)} 
        calleeName={inProgressTrip?.rider_name || activeRequest?.rider_name || 'Rider'} 
      />
    </div>
  );
}
