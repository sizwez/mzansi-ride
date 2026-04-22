'use client';

import React from 'react';
import { Scale, Clock, Users, ChevronRight, Vote, CheckCircle2, XCircle } from 'lucide-react';

interface ProposalCardProps {
  proposal: {
    id: string;
    title: string;
    description: string;
    deadline: string;
    votes_for: number;
    votes_against: number;
    total_eligible: number;
  };
  myVote: boolean | null;
  votingPower: number;
  onVote: (vote: boolean) => void;
}

export default function ProposalCard({ proposal, myVote, votingPower, onVote }: ProposalCardProps) {
  const totalVotes = proposal.votes_for + proposal.votes_against;
  const supportPercent = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 0;
  const opposePercent = totalVotes > 0 ? (proposal.votes_against / totalVotes) * 100 : 0;
  
  const isExpired = new Date(proposal.deadline) < new Date();
  const daysLeft = Math.ceil((new Date(proposal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="card-glass" style={{ padding: '24px', borderRadius: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-gold" style={{ fontSize: '0.625rem', padding: '2px 8px' }}>
              PHAKAMISA FUND PROPOSAL
            </span>
            {isExpired && <span className="badge badge-error">CLOSED</span>}
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>{proposal.title}</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            {proposal.description}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold)' }}>{votingPower}</div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>VOTING UNITS</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>
          <span style={{ color: 'var(--green-light)' }}>
            Support: {proposal.votes_for} units ({Math.round(supportPercent)}%)
          </span>
          <span style={{ color: 'var(--sunset)' }}>
            Oppose: {proposal.votes_against} units ({Math.round(opposePercent)}%)
          </span>
        </div>
        <div style={{ 
          height: '10px', width: '100%', background: 'var(--surface-300)', 
          borderRadius: '5px', overflow: 'hidden', display: 'flex' 
        }}>
          <div style={{ width: `${supportPercent}%`, height: '100%', background: 'var(--gradient-green)' }} />
          <div style={{ width: `${opposePercent}%`, height: '100%', background: 'var(--gradient-sunset)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            {isExpired ? 'Voting Closed' : `${daysLeft} days left`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} />
            {totalVotes} members voted
          </div>
        </div>

        {!isExpired && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {myVote === null ? (
              <>
                <button 
                  onClick={() => onVote(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--green-light)', border: '1px solid rgba(0,168,107,0.3)', borderRadius: '12px' }}
                >
                  <CheckCircle2 size={16} /> Support
                </button>
                <button 
                  onClick={() => onVote(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--sunset)', border: '1px solid rgba(255,78,80,0.3)', borderRadius: '12px' }}
                >
                  <XCircle size={16} /> Oppose
                </button>
              </>
            ) : (
              <div style={{ 
                padding: '6px 12px', background: myVote ? 'rgba(0,168,107,0.1)' : 'rgba(255,78,80,0.1)',
                borderRadius: '12px', border: `1px solid ${myVote ? 'rgba(0,168,107,0.3)' : 'rgba(255,78,80,0.3)'}`,
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600,
                color: myVote ? 'var(--green-light)' : 'var(--sunset)'
              }}>
                <Vote size={14} />
                Voted {myVote ? 'Support' : 'Oppose'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
