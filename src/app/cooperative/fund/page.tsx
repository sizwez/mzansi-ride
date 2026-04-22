'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Users, ArrowUpRight, TrendingUp, HandHelping, ShieldCheck, ChevronRight } from 'lucide-react';
import { PhakamisaService } from '@/services/api';
import { formatCurrency } from '@/lib/fare-calculator';
import { useAuth } from '@/context/AuthContext';

export default function CommunityFundPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bal, txns] = await Promise.all([
          PhakamisaService.getFundBalance(),
          PhakamisaService.getRecentTransactions()
        ]);
        setBalance(Number(bal));
        setTransactions(txns);
      } catch (err) {
        console.error('Error fetching fund data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="page-enter" style={{ padding: '24px 16px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
          Phakamisa Fund
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem' }}>
          The cooperative's shared emergency pool (Stokvel).
        </p>
      </div>

      {/* Main Balance Card */}
      <div className="card-glass" style={{
        padding: '32px', borderRadius: '24px', marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(10,14,26,0.8) 0%, rgba(20,30,60,0.5) 100%)',
        textAlign: 'center', border: '1px solid var(--border-gold)'
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'rgba(244,169,0,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
        }}>
          <Wallet size={32} color="var(--gold)" />
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
          Total Community Pool
        </div>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
          {formatCurrency(balance)}
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
          color: 'var(--green-light)', fontSize: '0.8125rem', marginTop: '12px' 
        }}>
          <TrendingUp size={14} />
          <span>Growing by ~4% weekly</span>
        </div>
      </div>

      {/* Fund Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        <div className="stat-card" style={{ padding: '20px' }}>
          <ShieldCheck size={20} color="var(--sky)" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Safety Responders</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>450+</div>
        </div>
        <div className="stat-card" style={{ padding: '20px' }}>
          <HandHelping size={20} color="var(--emerald)" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Emergency Grants</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>12 Paid</div>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px', background: 'var(--surface-100)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--gold)" /> Ubuntu Governance
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Every trip contributes a **1% Solidarity Levy** to this fund. This pool is owned by the cooperative members and is used for emergency vehicle repairs, medical assistance, and funeral policies for shareholder families.
        </p>
      </div>

      {/* Recent Contributions */}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>Recent Growth</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading pool history...</div>
        ) : transactions.length > 0 ? (
          transactions.map((tx) => (
            <div key={tx.id} className="list-item" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px', background: tx.type === 'levy_credit' ? 'rgba(0,168,107,0.1)' : 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {tx.type === 'levy_credit' ? <ArrowUpRight size={18} color="var(--green-light)" /> : <Users size={18} color="var(--ruby)" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{tx.description}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(tx.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ fontWeight: 700, color: tx.amount >= 0 ? 'var(--green-light)' : 'var(--ruby)', fontFamily: 'var(--font-mono)' }}>
                {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No recent transactions in the community pool.
          </div>
        )}
      </div>

      {/* Action Button */}
      <div style={{ marginTop: '32px' }}>
        <button className="btn btn-secondary" style={{ width: '100%', gap: '8px' }}>
          Propose Emergency Grant <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
