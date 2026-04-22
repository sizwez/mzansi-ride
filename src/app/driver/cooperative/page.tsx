'use client';

import { useState, useEffect } from 'react';
import { Users, DollarSign, Vote, Shield, Heart, Briefcase, TrendingUp, ChevronDown, ChevronUp, Check, X, Calendar, Award, PieChart, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/fare-calculator';
import { useAuth } from '@/context/AuthContext';
import { GovernanceService } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/context/SyncContext';

export default function DriverCooperative() {
  const { user, loading: authLoading } = useAuth();
  const { enqueueAction } = useSync();
  const [memberData, setMemberData] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [expandedVote, setExpandedVote] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [profile, props] = await Promise.all([
        GovernanceService.getMemberProfile(user.id),
        GovernanceService.getProposals()
      ]);
      
      setMemberData(profile);
      setProposals(props);

      // Check which ones have been voted on
      const votesCheck = await Promise.all(
        props.map(p => GovernanceService.hasVoted(p.id, user.id))
      );
      const votedSet = new Set<string>();
      props.forEach((p, i) => {
        if (votesCheck[i]) votedSet.add(p.id);
      });
      setVotedIds(votedSet);

    } catch (err) {
      console.error('Error fetching coop data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchData();

      // Real-time updates for proposals (vote counts)
      const channel = supabase
        .channel('coop_updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'coop_proposals' },
          (payload) => {
            setProposals(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user, authLoading]);

  const handleCastVote = async (proposalId: string, vote: boolean) => {
    if (!user) return;
    try {
      if (!navigator.onLine) {
        throw new Error('OFFLINE');
      }

      await GovernanceService.castVote(proposalId, user.id, vote);
      setVotedIds(prev => new Set(prev).add(proposalId));
    } catch (err: any) {
      if (err.message === 'OFFLINE' || !navigator.onLine) {
        await enqueueAction('CAST_VOTE', { proposalId, vote });
        setVotedIds(prev => new Set(prev).add(proposalId));
      } else {
        console.error('Error casting vote:', err);
      }
    }
  };

  const sharePrice = 1250; // Mock standard share price
  const dividendPool = 250000;
  const totalShares = 5000;
  const shareValue = memberData ? memberData.shares * sharePrice : 0;
  const dividendShare = memberData ? (memberData.shares / totalShares) * dividendPool : 0;

  if (authLoading || isLoading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--gold)" />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Co-Op Ownership</h2>

      {/* Ownership Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(244,169,0,0.12) 0%, rgba(0,168,107,0.08) 100%)',
        border: '1px solid var(--border-gold)',
        borderRadius: '20px', padding: '24px', marginBottom: '20px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Award size={20} style={{ color: 'var(--gold)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Your Cooperative Stake
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--gold)' }}>
              {memberData?.shares || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Shares Owned</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatCurrency(shareValue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Portfolio Value</div>
          </div>
        </div>

        <div style={{
          marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)',
          borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Member Dividends</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--emerald)', fontSize: '1.125rem' }}>
              {formatCurrency(dividendShare)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Status</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: memberData?.verification_status === 'verified' ? 'var(--emerald)' : 'var(--sunset)' }}>
              {memberData?.verification_status === 'verified' ? 'Verified Member' : 'Pending Verification'}
            </div>
          </div>
        </div>
      </div>

      {/* Voting Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Vote size={18} style={{ color: 'var(--gold)' }} />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Active Governance Votes</h3>
        </div>

        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {proposals.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              No active proposals at this time.
            </div>
          )}
          {proposals.map((item) => {
            const isExpanded = expandedVote === item.id;
            const hasVoted = votedIds.has(item.id);
            const totalVotes = (item.votes_for || 0) + (item.votes_against || 0);
            const forPercent = totalVotes > 0 ? (item.votes_for / totalVotes) * 100 : 50;

            return (
              <div key={item.id} className="card" style={{ padding: '16px', cursor: 'pointer' }}
                onClick={() => setExpandedVote(isExpanded ? null : item.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{item.title}</h4>
                      {hasVoted && (
                        <span className="badge badge-green" style={{ fontSize: '0.625rem' }}>
                          <Check size={10} /> Voted
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      <Calendar size={12} />
                      <span>Deadline: {new Date(item.deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />}
                </div>

                {/* Vote Bar */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    height: '8px', borderRadius: '4px', background: 'var(--surface-200)',
                    overflow: 'hidden', display: 'flex',
                  }}>
                    <div style={{
                      width: `${forPercent}%`, background: 'var(--emerald)',
                      borderRadius: '4px 0 0 4px', transition: 'width 0.5s ease',
                    }} />
                    <div style={{
                      width: `${100 - forPercent}%`, background: 'var(--ruby)',
                      borderRadius: '0 4px 4px 0', transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                      For: {item.votes_for} ({forPercent.toFixed(0)}%)
                    </span>
                    <span style={{ color: 'var(--ruby)', fontWeight: 600 }}>
                      Against: {item.votes_against}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="animate-fade-up" style={{ marginTop: '14px' }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
                      {item.description}
                    </p>
                    {!hasVoted && memberData?.verification_status === 'verified' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" style={{ flex: 1, gap: '6px' }}
                          onClick={(e) => { e.stopPropagation(); handleCastVote(item.id, true); }}>
                          <Check size={16} /> Vote For
                        </button>
                        <button className="btn btn-secondary" style={{ flex: 1, gap: '6px' }}
                          onClick={(e) => { e.stopPropagation(); handleCastVote(item.id, false); }}>
                          <X size={16} /> Vote Against
                        </button>
                      </div>
                    )}
                    {memberData?.verification_status !== 'verified' && (
                      <div style={{ padding: '10px', background: 'rgba(244,169,0,0.1)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--gold)' }}>
                        Only verified members can participate in governance votes.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Shield size={18} style={{ color: 'var(--green-light)' }} />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Your Member Benefits</h3>
        </div>

        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            {
              icon: Heart, label: 'Medical Aid', active: memberData?.benefits_medical_aid,
              detail: memberData?.benefits_medical_aid ? 'Discovery KeyCare Plus' : 'Not enrolled',
              color: 'var(--ruby)',
            },
            {
              icon: Shield, label: 'Funeral Policy', active: memberData?.benefits_funeral_policy,
              detail: memberData?.benefits_funeral_policy ? 'R50,000 Group Coverage' : 'Not enrolled',
              color: 'var(--purple)',
            },
            {
              icon: Briefcase, label: 'Co-Op Retirement Plan', active: memberData?.benefits_retirement,
              detail: memberData?.benefits_retirement ? 'Alexander Forbes Direct' : 'Not enrolled',
              color: 'var(--sky)',
            },
          ].map((benefit, i) => (
            <div key={i} className="card" style={{
              padding: '16px', display: 'flex', alignItems: 'center', gap: '14px',
              opacity: benefit.active ? 1 : 0.6,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: '12px',
                background: `${benefit.color}15`,
                border: `1px solid ${benefit.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <benefit.icon size={20} style={{ color: benefit.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{benefit.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{benefit.detail}</div>
              </div>
              {benefit.active ? (
                <span className="badge badge-green" style={{ fontSize: '0.625rem' }}>Active</span>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>
                  Enroll
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
