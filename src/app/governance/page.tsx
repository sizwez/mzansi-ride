'use client';

import React, { useState, useEffect } from 'react';
import { Scale, Users, TrendingUp, Info, ChevronLeft, Shield, Gavel } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { GovernanceService } from '@/services/api';
import ProposalCard from '@/components/governance/ProposalCard';
import DisputeMediation from '@/components/governance/DisputeMediation';

export default function GovernanceHub() {
  const { user, loading: authLoading } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, boolean | null>>({});
  const [votingPower, setVotingPower] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proposals' | 'court'>('proposals');

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchData = async () => {
      try {
        const [props, power] = await Promise.all([
          GovernanceService.getProposals(),
          GovernanceService.getVotingPower(user.id)
        ]);
        
        setProposals(props || []);
        setVotingPower(power);

        // Fetch my votes
        const voteMap: Record<string, boolean | null> = {};
        for (const p of props || []) {
          const v = await GovernanceService.getMemberVote(p.id, user.id);
          voteMap[p.id] = v ? v.vote : null;
        }
        setMyVotes(voteMap);
      } catch (err) {
        console.error('Error fetching governance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  const handleCastVote = async (proposalId: string, vote: boolean) => {
    if (!user) return;
    try {
      await GovernanceService.castVote(proposalId, user.id, vote);
      setMyVotes(prev => ({ ...prev, [proposalId]: vote }));
      
      // Refresh proposals to see updated tally
      const updatedProps = await GovernanceService.getProposals();
      setProposals(updatedProps);
    } catch (err) {
      console.error('Error casting vote:', err);
      alert('Failed to cast vote. Please ensure you are a verified member.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Scale className="animate-bounce" color="var(--gold)" size={48} />
        <p className="mt-4 text-tertiary">Accessing Democracy Ledger...</p>
      </div>
    );
  }

  return (
    <div className="page-enter p-4 md:p-8 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/rider" className="btn btn-ghost btn-icon">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Cooperative Governance</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Democratic Ownership in Action</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="card-glass flex items-center gap-2 px-4 py-2 rounded-full border-gold">
            <Scale size={16} color="var(--gold)" />
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{votingPower} {votingPower === 1 ? 'Vote' : 'Votes'}</span>
          </div>
          <Link href="/cooperative/governance/delegate" style={{ fontSize: '0.75rem', color: 'var(--sky)', textDecoration: 'none', fontWeight: 600 }}>
             Delegate Power &rarr;
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <div className="card-glass mb-8 p-6" style={{ background: 'linear-gradient(135deg, rgba(244,169,0,0.1), transparent)', border: '1px solid rgba(244,169,0,0.3)' }}>
        <div className="flex items-start gap-4">
          <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield color="var(--bg-primary)" size={24} />
          </div>
          <div className="flex-1">
            <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Your Voice Matters</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Mzansi Ride is member-owned. Every verified member has voting power to decide how the **Phakamisa Fund** is spent and how our cooperative grows. Participation increases your voting weight.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-8 bg-surface-200 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('proposals')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'proposals' ? 'bg-bg-primary shadow-sm text-gold' : 'text-tertiary'}`}
        >
          <Scale size={18} /> Proposals
        </button>
        <button 
          onClick={() => setActiveTab('court')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'court' ? 'bg-bg-primary shadow-sm text-gold' : 'text-tertiary'}`}
        >
          <Gavel size={18} /> Community Court
        </button>
      </div>

      {activeTab === 'proposals' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Active Proposals</h2>
            <span className="badge badge-gold">{proposals.length} Open</span>
          </div>

          <div className="stagger-children">
            {proposals.map((proposal) => (
              <ProposalCard 
                key={proposal.id}
                proposal={proposal}
                myVote={myVotes[proposal.id] ?? null}
                votingPower={votingPower}
                onVote={(vote) => handleCastVote(proposal.id, vote)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'court' && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Justice Ledger</h2>
            <Link href="#" className="btn btn-ghost btn-sm text-sky">Rules of Conduct</Link>
          </div>
          <DisputeMediation />
        </div>
      )}

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="var(--sky)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total Active Voters</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>1,248 Members</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(0,168,107,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} color="var(--green-light)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Participation Rate</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>84% of Quorum</div>
          </div>
        </div>
      </div>
    </div>
  );
}
