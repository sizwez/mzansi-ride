'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Download, ArrowUpRight, ArrowDownRight, CreditCard, Clock, Shield, Loader2, Wallet, PieChart, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/fare-calculator';
import { useAuth } from '@/context/AuthContext';
import { FinanceService, FintechService } from '@/services/api';

export default function DriverEarnings() {
  const { user, loading: authLoading } = useAuth();
  const [earnings, setEarnings] = useState({ today: 0, thisMonth: 0, thisWeek: 0, subscriptionFee: 500, payoutHistory: [] as any[] });
  const [wealth, setWealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [earningsData, wealthData] = await Promise.all([
        FinanceService.getDriverEarnings(user.id),
        FintechService.getWealthOverview(user.id)
      ]);
      
      setEarnings(prev => ({
        ...prev,
        today: earningsData.today,
        payoutHistory: earningsData.payouts
      }));
      setWealth(wealthData);
    } catch (err) {
      console.error('Error fetching driver earnings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const weekDays = [
    { day: 'Mon', earned: 0, trips: 0 },
    { day: 'Tue', earned: 0, trips: 0 },
    { day: 'Wed', earned: 0, trips: 0 },
    { day: 'Thu', earned: 0, trips: 0 },
    { day: 'Fri', earned: 0, trips: 0 },
    { day: 'Sat', earned: 0, trips: 0 },
    { day: 'Sun', earned: 0, trips: 0 },
  ];
  const maxEarned = 1000;

  if (authLoading || isLoading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--emerald)" />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Earnings</h2>

      {/* Main Earnings Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,168,107,0.12) 0%, rgba(244,169,0,0.08) 100%)',
        border: '1px solid rgba(0,168,107,0.3)',
        borderRadius: '20px', padding: '24px', marginBottom: '20px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(0,168,107,0.06)' }} />
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Aggregated Earnings</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: '8px',
        }}>
          {formatCurrency(earnings.today)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
          <Clock size={16} style={{ color: 'var(--emerald)' }} />
          <span style={{ color: 'var(--text-tertiary)' }}>Total confirmed today</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Today', value: formatCurrency(earnings.today), icon: DollarSign, color: 'var(--gold)' },
          { label: 'Wallet Balance', value: wealth ? formatCurrency(wealth.wallet) : '...', icon: Wallet, color: 'var(--emerald)' },
          { label: 'Subscription Fee', value: formatCurrency(earnings.subscriptionFee) + '/mo', icon: CreditCard, color: 'var(--sky)' },
          { label: 'Total Dividends', value: wealth ? formatCurrency(wealth.totalWithdrawn) : '...', icon: PieChart, color: 'var(--sunset)' },
        ].map((stat, i) => (
          <div key={i} className="stat-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <stat.icon size={16} style={{ color: stat.color }} />
              <span className="stat-label" style={{ fontSize: '0.75rem' }}>{stat.label}</span>
            </div>
            <div className="stat-value" style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {wealth && (
        <div className="card-glass" style={{ padding: '20px', marginBottom: '20px', border: '1px solid var(--border-gold)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Wealth Summary</h3>
             {wealth.lastDividend && (
               <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                 Last Dividend: {new Date(wealth.lastDividend).toLocaleDateString()}
               </span>
             )}
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.6875rem', marginBottom: '4px' }}>CO-OP SHARES</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{wealth.shares}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.6875rem', marginBottom: '4px' }}>REWARDS</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{wealth.rewards} <span style={{ fontSize: '0.6rem' }}>PTS</span></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.6875rem', marginBottom: '4px' }}>TRUST SCORE</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>98%</div>
              </div>
           </div>

           <button 
             onClick={() => setShowPayoutModal(true)}
             className="btn btn-primary" 
             style={{ width: '100%', height: '48px', background: 'var(--gold)', color: 'black' }}
           >
             Cash Out to Bank
           </button>
        </div>
      )}

      {/* Weekly Chart Placeholder */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '16px' }}>Weekly Activity</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
          {weekDays.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '100%', borderRadius: '6px 6px 0 0',
                background: 'var(--surface-300)',
                height: `4px`,
                opacity: 0.3,
              }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Info */}
      <div className="card" style={{
        padding: '16px', marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, transparent 100%)',
        border: '1px solid rgba(56,189,248,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Shield size={16} style={{ color: 'var(--sky)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Co-Mo Cooperative</span>
          <span className="badge badge-green" style={{ fontSize: '0.625rem', marginLeft: 'auto' }}>Active</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          You are a verified member of the cooperative. You keeping 100% of your fares after the monthly subscription fee.
        </p>
      </div>

      {/* Payout History */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Recent Payouts</h3>
          <button className="btn btn-ghost btn-sm" style={{ gap: '4px' }}>
            <Download size={14} /> Export
          </button>
        </div>
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {earnings.payoutHistory.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              No payouts recorded yet.
            </div>
          )}
          {earnings.payoutHistory.map((payout: any) => (
            <div key={payout.id} className="card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '12px',
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowDownRight size={18} style={{ color: 'var(--emerald)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Weekly Payout</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {new Date(payout.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--emerald)' }}>
                  +{formatCurrency(payout.amount)}
                </div>
                <span className="badge badge-green" style={{ fontSize: '0.6rem' }}>
                  Completed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'flex-end', padding: '16px'
        }}>
          <div className="card-glass" style={{ width: '100%', borderRadius: '24px 24px 0 0', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Cash Out</h2>
              <button 
                onClick={() => setShowPayoutModal(false)}
                className="btn btn-ghost btn-icon"
              >
                <XCircle />
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'block' }}>WITHDRAWAL AMOUNT</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', fontWeight: 700 }}>R</span>
                <input 
                  type="number" 
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  className="input"
                  style={{ paddingLeft: '40px', fontSize: '1.5rem', height: '64px', fontWeight: 700 }}
                />
              </div>
              <div style={{ fontSize: '0.8125rem', marginTop: '12px', color: 'var(--text-secondary)' }}>
                Available: <strong>{wealth ? formatCurrency(wealth.wallet) : '...'}</strong>
              </div>
            </div>

            <button 
              disabled={isSubmitting || !payoutAmount || parseFloat(payoutAmount) <= 0}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  if (!user) return;
                  await FintechService.requestPayout(user.id, parseFloat(payoutAmount), 'EFT', { bank: 'FNB', account: '****1234' });
                  alert('Payout request submitted successfully!');
                  setShowPayoutModal(false);
                  fetchData();
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="btn btn-primary" 
              style={{ width: '100%', height: '56px', background: 'var(--emerald)', border: 'none' }}
            >
              {isSubmitting ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
