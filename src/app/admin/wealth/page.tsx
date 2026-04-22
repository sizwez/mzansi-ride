'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  PieChart, 
  ArrowUpRight, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  Wallet,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { AdminService, PhakamisaService } from '@/services/api';
import { formatCurrency } from '@/lib/fare-calculator';

export default function AdminWealth() {
  const [metrics, setMetrics] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDistributing, setIsDistributing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [distributionMsg, setDistributionMsg] = useState('');

  const fetchData = async () => {
    try {
      const [m, p, pr] = await Promise.all([
        AdminService.getPlatformMetrics(),
        AdminService.getDividendPreview(0.8), // Default 80% distribution
        AdminService.getPendingPayouts()
      ]);
      setMetrics(m);
      setPreview(p);
      setPayouts(pr);
    } catch (err) {
      console.error('Error fetching wealth data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecuteDistribution = async () => {
    if (!preview) return;
    setIsDistributing(true);
    setDistributionMsg('Calculating and distributing funds to member wallets...');
    try {
      await AdminService.executeDividendDistribution(preview.pool, preview.distributions);
      setDistributionMsg('Success! Dividends have been distributed.');
      setTimeout(() => {
        setShowConfirm(false);
        fetchData();
      }, 2000);
    } catch (err: any) {
      setDistributionMsg(`Error: ${err.message}`);
    } finally {
      setIsDistributing(false);
    }
  };

  const handleProcessPayout = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await AdminService.processPayout(id, status);
      fetchData();
    } catch (err) {
      console.error('Error processing payout:', err);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <RefreshCcw className="animate-spin" color="var(--gold)" />
    </div>
  );

  return (
    <div className="page-enter">
      {/* Header Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div className="card-glass" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
            <Wallet size={80} color="var(--gold)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(244,169,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="var(--gold)" />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Community Fund Balance</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold)' }}>
            {formatCurrency(metrics.fundBalance)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px' }}>
            <ArrowUpRight size={14} /> +12.4% from Solidarity Levy
          </div>
        </div>

        <div className="card-glass" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart size={18} color="var(--sky)" />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Dividend Pool (80%)</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatCurrency(preview.pool)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
            Eligible Members: {preview.distributions.length}
          </div>
        </div>

        <div className="card-glass" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="var(--emerald)" />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Weighted Participation</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {preview.totalTrips} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>trips</span>
          </div>
          <button 
            onClick={() => setShowConfirm(true)}
            className="btn btn-primary" 
            style={{ marginTop: '12px', width: '100%', height: '40px', background: 'var(--emerald)', border: 'none' }}
          >
            Distribute Profits
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Dividend Preview List */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Dividend Distribution Preview</h3>
            <span className="badge badge-gold">Q2 2026</span>
          </div>
          
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 8px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>MEMBER</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>TRIPS</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>TRUST</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>WEIGHT</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'right' }}>PAYOUT</th>
                </tr>
              </thead>
              <tbody>
                {preview.distributions.map((d: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Driver Member</div>
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '0.875rem' }}>{d.trips}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <span style={{ fontSize: '0.875rem' }}>{Math.round(d.trust)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>{d.weight.toFixed(1)}</td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--emerald)' }}>
                      {formatCurrency(d.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout Requests Queue */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '20px' }}>Payout Requests Queue</h3>
          
          {payouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
              <CheckCircle2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: '0.875rem' }}>No pending requests.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {payouts.map((p: any) => (
                <div key={p.id} style={{ 
                  padding: '16px', borderRadius: '12px', background: 'var(--surface-200)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{p.profile?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Requested {new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>{formatCurrency(p.amount)}</div>
                  </div>
                  
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px', marginBottom: '12px' }}>
                     <strong>{p.payment_method}</strong>: {JSON.stringify(p.account_details)}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleProcessPayout(p.id, 'approved')}
                      className="btn btn-primary" 
                      style={{ flex: 1, height: '32px', fontSize: '0.75rem', background: 'var(--emerald)' }}
                    >
                      Approve & Pay
                    </button>
                    <button 
                      onClick={() => handleProcessPayout(p.id, 'rejected')}
                      className="btn btn-secondary" 
                      style={{ flex: 1, height: '32px', fontSize: '0.75rem' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card-glass" style={{ maxWidth: '500px', width: '100%', padding: '32px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <AlertCircle size={32} color="var(--emerald)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>Confirm Distribution</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              You are about to distribute <strong>{formatCurrency(preview.pool)}</strong> from the Community Fund to <strong>{preview.distributions.length} members</strong>. This action is irreversible.
            </p>
            
            {distributionMsg && (
              <div style={{ marginBottom: '20px', fontSize: '0.875rem', color: distributionMsg.includes('Error') ? 'var(--ruby)' : 'var(--emerald)' }}>
                {distributionMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                disabled={isDistributing}
                onClick={handleExecuteDistribution}
                className="btn btn-primary" 
                style={{ flex: 1, background: 'var(--emerald)', border: 'none', height: '48px' }}
              >
                {isDistributing ? 'Processing...' : 'Confirm & Execute'}
              </button>
              <button 
                disabled={isDistributing}
                onClick={() => setShowConfirm(false)}
                className="btn btn-secondary" 
                style={{ flex: 1, height: '48px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
