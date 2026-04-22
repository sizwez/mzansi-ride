'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, CreditCard, QrCode, Building, RefreshCw, Loader2, Bell } from 'lucide-react';
import { formatCurrency } from '@/lib/fare-calculator';
import { useAuth } from '@/context/AuthContext';
import { FinanceService, NotificationService } from '@/services/api';
import { supabase } from '@/lib/supabase';

export default function RiderWallet() {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  const quickAmounts = [50, 100, 200, 500];

  const fetchData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [bal, txns] = await Promise.all([
        FinanceService.getBalance(user.id),
        FinanceService.getTransactions(user.id)
      ]);
      setBalance(Number(bal));
      setTransactions(txns);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
      
      // Real-time subscription for balance updates
      const channel = supabase
        .channel('wallet_updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => setBalance(Number(payload.new.wallet_balance))
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'wallet_transactions', filter: `profile_id=eq.${user.id}` },
          (payload) => setTransactions(prev => [payload.new, ...prev.slice(0, 9)])
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user, authLoading]);

  const handleTopUp = async () => {
    if (!user || !topUpAmount || isProcessing) return;
    try {
      setIsProcessing(true);
      const amount = parseFloat(topUpAmount);
      await FinanceService.topUpWallet(user.id, amount);
      
      // NOTIFY user persistent
      await NotificationService.createNotification(
        user.id,
        'Wallet Top-up Successful',
        `R${amount} has been added to your Co-Mo wallet.`,
        'payment'
      );

      setTopUpAmount('');
      setShowTopUp(false);
      // Data will refresh via real-time subscription
    } catch (err) {
      console.error('Top up failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || (isLoading && transactions.length === 0)) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--gold)" />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: '16px' }}>
      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(244,169,0,0.15) 0%, rgba(0,104,71,0.1) 100%)',
        border: '1px solid var(--border-gold)',
        borderRadius: '20px',
        padding: '28px 24px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(244,169,0,0.08)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Wallet size={20} style={{ color: 'var(--gold)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Co-Mo Wallet
          </span>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: '4px',
        }}>
          {formatCurrency(balance)}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          Available balance
        </div>
        <button
          onClick={() => setShowTopUp(!showTopUp)}
          className="btn btn-primary"
          style={{ marginTop: '20px' }}
        >
          <Plus size={16} /> Top Up Wallet
        </button>
      </div>

      {/* Top Up Section */}
      {showTopUp && (
        <div className="animate-slide-up card-glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Add Money</h3>
          
          {/* Quick amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {quickAmounts.map((amt) => (
              <button key={amt} onClick={() => setTopUpAmount(String(amt))} style={{
                padding: '10px', borderRadius: '10px',
                background: topUpAmount === String(amt) ? 'rgba(244,169,0,0.15)' : 'var(--surface-200)',
                border: `1px solid ${topUpAmount === String(amt) ? 'var(--border-gold)' : 'var(--border-subtle)'}`,
                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                fontWeight: 600, fontSize: '0.875rem',
                transition: 'all 0.2s ease',
              }}>
                R{amt}
              </button>
            ))}
          </div>

          <input
            type="number"
            className="input"
            placeholder="Or enter custom amount..."
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            style={{ marginBottom: '16px' }}
          />

          <button 
            onClick={handleTopUp}
            disabled={!topUpAmount || isProcessing}
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '16px' }}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Top Up'}
          </button>

          {/* Payment Methods Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { icon: CreditCard, label: 'Debit / Credit Card', desc: 'Visa, Mastercard' },
              { icon: Building, label: 'EFT / Bank Transfer', desc: 'Instant or manual' },
              { icon: QrCode, label: 'Cash at Agent', desc: 'Spaza shops, OK, Spar' },
            ].map((method, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px', borderRadius: '12px',
                background: 'var(--surface-200)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', width: '100%', opacity: 0.6
              }}>
                <method.icon size={20} style={{ color: 'var(--gold)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{method.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{method.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Transaction History</h3>
          <button onClick={fetchData} className="btn btn-ghost btn-sm" style={{ gap: '4px' }}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {transactions.length === 0 && !isLoading && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              No transactions yet.
            </div>
          )}
          {transactions.map((txn) => (
            <div key={txn.id} className="card" style={{
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '12px',
                background: txn.type === 'topup' ? 'rgba(52,211,153,0.1)' : txn.type === 'refund' ? 'rgba(56,189,248,0.1)' : 'rgba(244,169,0,0.1)',
                border: `1px solid ${txn.type === 'topup' ? 'rgba(52,211,153,0.2)' : txn.type === 'refund' ? 'rgba(56,189,248,0.2)' : 'rgba(244,169,0,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {txn.type === 'topup' ? (
                  <ArrowDownLeft size={18} style={{ color: 'var(--emerald)' }} />
                ) : txn.type === 'refund' ? (
                  <RefreshCw size={18} style={{ color: 'var(--sky)' }} />
                ) : (
                  <ArrowUpRight size={18} style={{ color: 'var(--gold)' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{txn.description}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {new Date(txn.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', fontWeight: 700,
                color: txn.type === 'topup' ? 'var(--emerald)' : 'var(--text-primary)',
              }}>
                {txn.type === 'topup' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
