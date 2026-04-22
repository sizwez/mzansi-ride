'use client';

import { DollarSign, PieChart, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, Banknote, ShieldCheck, Download, Calendar } from 'lucide-react';
import { mockAdminStats, mockCooperativeInfo, weeklyRideData } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/fare-calculator';

export default function AdminFinancials() {
  const stats = mockAdminStats;
  const coop = mockCooperativeInfo;

  return (
    <div className="page-enter">
      {/* High-level Revenue Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Gross Volume', value: formatCurrency(stats.revenueThisMonth), sub: 'This Month', icon: TrendingUp, color: 'var(--emerald)' },
          { label: 'Co-op Dividend Pool', value: formatCurrency(coop.dividendPool), sub: 'Accrued', icon: PieChart, color: 'var(--gold)' },
          { label: 'Platform Fees', value: formatCurrency(stats.revenueThisMonth * 0.15), sub: '15% Commission', icon: ShieldCheck, color: 'var(--sky)' },
          { label: 'Pending Payouts', value: formatCurrency(125400), sub: 'To be settled', icon: Banknote, color: 'var(--sunset)' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ background: `${item.color}20`, padding: '8px', borderRadius: '10px' }}>
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 600 }}>
                <ArrowUpRight size={14} /> 12%
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{item.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Revenue Breakdown */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Revenue Breakdown</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>System wide financial performance</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                <Calendar size={14} /> Last 30 Days
              </button>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'Economy Rides', amount: stats.revenueThisMonth * 0.45, pct: 45, color: 'var(--emerald)' },
              { label: 'Comfort Rides', amount: stats.revenueThisMonth * 0.35, pct: 35, color: 'var(--gold)' },
              { label: 'XL Rides', amount: stats.revenueThisMonth * 0.15, pct: 15, color: 'var(--sky)' },
              { label: 'Partner Services', amount: stats.revenueThisMonth * 0.05, pct: 5, color: 'var(--purple)' },
            ].map((row, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(row.amount)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${row.pct}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Settlements */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Recent Settlements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { id: 'SET-991', desc: 'Driver Weekly Payouts', date: 'Today', amount: 84500, type: 'out' },
              { id: 'SET-990', desc: 'Wallet Top-ups (Net)', date: 'Today', amount: 32000, type: 'in' },
              { id: 'SET-989', desc: 'Insurance Premium', date: 'Yesterday', amount: 15000, type: 'out' },
              { id: 'SET-988', desc: 'Co-op Dividend Accrual', date: 'Yesterday', amount: 4500, type: 'out' },
            ].map((txn, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--surface-300)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {txn.type === 'in' ? <CreditCard size={18} style={{ color: 'var(--emerald)' }} /> : <Banknote size={18} style={{ color: 'var(--sunset)' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{txn.desc}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{txn.id} • {txn.date}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: txn.type === 'in' ? 'var(--emerald)' : 'var(--text-primary)' }}>
                  {txn.type === 'in' ? '+' : '-'}{formatCurrency(txn.amount)}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '24px', fontSize: '0.8125rem' }}>View All Transactions</button>
        </div>
      </div>

      {/* Tax & Compliance Notice */}
      <div style={{
        padding: '16px', borderRadius: '12px',
        backgroundColor: 'rgba(56,189,248,0.05)',
        border: '1px solid rgba(56,189,248,0.2)',
        display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <div style={{ background: 'var(--sky)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <ShieldCheck size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>SARS Compliance Certificate is Active</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Next audit scheduled for June 2026. All VAT and tax withholding for drivers are processed automatically.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.75rem' }}>View Compliance Hub</button>
      </div>
    </div>
  );
}
