'use client';

import { useState, useEffect } from 'react';
import { Globe, Users, DollarSign, Vote, TrendingUp, Calendar, PieChart, Award, BarChart3, Plus, Loader2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/fare-calculator';
import { GovernanceService, NotificationService } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/context/SyncContext';

export default function CooperativeAdmin() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [shareholders, setShareholders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProposal, setNewProposal] = useState({ title: '', description: '', deadline: '' });
  const { enqueueAction } = useSync();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [props, members] = await Promise.all([
          GovernanceService.getProposals(),
          supabase.from('profiles').select('*').order('shares', { ascending: false }).limit(10)
        ]);
        setProposals(props || []);
        setShareholders(members.data || []);
      } catch (err) {
        console.error('Error loading cooperative data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!navigator.onLine) {
        throw new Error('OFFLINE');
      }

      const proposal = await GovernanceService.createProposal(newProposal.title, newProposal.description, newProposal.deadline);
      
      // Notify all members (demo: top 20)
      const { data: members } = await supabase.from('profiles').select('id').limit(20);
      if (members) {
        for (const member of members) {
          await NotificationService.createNotification(
            member.id,
            'New Cooperative Proposal',
            `A new proposal "${newProposal.title}" has been launched. Your vote matters!`,
            'governance',
            { proposal_id: proposal.id }
          );
        }
      }

      setShowCreateModal(false);
      setNewProposal({ title: '', description: '', deadline: '' });
      // Refresh proposals
      const updatedProps = await GovernanceService.getProposals();
      setProposals(updatedProps || []);
    } catch (err: any) {
      if (err.message === 'OFFLINE' || !navigator.onLine) {
        await enqueueAction('CREATE_PROPOSAL', {
          title: newProposal.title,
          description: newProposal.description,
          deadline: newProposal.deadline,
        });
        setShowCreateModal(false);
        setNewProposal({ title: '', description: '', deadline: '' });
      } else {
        console.error('Error creating proposal:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--gold)" />
      </div>
    );
  }

  const totalShares = 5000;
  const sharePrice = 1250;
  const totalAllocated = shareholders.reduce((acc, s) => acc + (s.shares || 0), 0);

  return (
    <div className="page-enter">
      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total Shares', value: totalShares.toLocaleString(), color: 'var(--gold)', icon: PieChart },
          { label: 'Share Price', value: formatCurrency(sharePrice), color: 'var(--green-light)', icon: TrendingUp },
          { label: 'Total Members', value: shareholders.length.toLocaleString(), color: 'var(--sky)', icon: Users },
          { label: 'Dividend Pool', value: formatCurrency(250000), color: 'var(--emerald)', icon: DollarSign },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '18px' }}>
            <s.icon size={20} style={{ color: s.color }} />
            <div className="stat-value" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Governance */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Vote size={18} style={{ color: 'var(--gold)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Active Proposals</h3>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <Plus size={14} /> New Proposal
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {proposals.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No active proposals.
              </div>
            )}
            {proposals.map((item) => {
              const totalVotes = (item.votes_for || 0) + (item.votes_against || 0);
              const forPct = totalVotes > 0 ? (item.votes_for / totalVotes) * 100 : 50;

              return (
                <div key={item.id} style={{
                  padding: '16px', borderRadius: '12px',
                  background: 'var(--surface-200)', border: '1px solid var(--border-subtle)',
                }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '10px' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: `${forPct}%`, background: 'var(--emerald)', transition: 'width 0.5s ease' }} />
                    <div style={{ width: `${100 - forPct}%`, background: 'var(--ruby)', transition: 'width 0.5s ease' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>✓ {item.votes_for || 0} For</span>
                    <span style={{ color: 'var(--ruby)', fontWeight: 600 }}>✗ {item.votes_against || 0} Against</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Share Distribution */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Award size={18} style={{ color: 'var(--gold)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Top Shareholders</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {shareholders.map((d, i) => (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px', borderRadius: '10px',
                background: i === 0 ? 'rgba(244,169,0,0.08)' : 'transparent',
                border: i === 0 ? '1px solid rgba(244,169,0,0.2)' : '1px solid transparent',
              }}>
                <div className="avatar avatar-sm" style={{ background: 'var(--surface-400)' }}>
                  {d.name ? d.name[0] : 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{d.name || d.email}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{d.verification_status}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)' }}>
                    {d.shares || 0} shares
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                    {formatCurrency((d.shares || 0) * sharePrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding: '16px', borderRadius: '12px',
            background: 'var(--surface-200)', border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Allocated</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{totalAllocated} / {totalShares.toLocaleString()}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{
                width: `${(totalAllocated / totalShares) * 100}%`,
                background: 'var(--gradient-gold)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card-glass animate-fade-up" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create New Proposal</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProposal} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Title</label>
                <input 
                  type="text" required className="input" placeholder="e.g. Expand to Pretoria North"
                  value={newProposal.title} onChange={e => setNewProposal({...newProposal, title: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Description</label>
                <textarea 
                  required className="input" rows={4} placeholder="Describe the strategic initiative..."
                  value={newProposal.description} onChange={e => setNewProposal({...newProposal, description: e.target.value})}
                  style={{ resize: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Deadline</label>
                <input 
                  type="date" required className="input"
                  value={newProposal.deadline} onChange={e => setNewProposal({...newProposal, deadline: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                Launch Voting Proposal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
