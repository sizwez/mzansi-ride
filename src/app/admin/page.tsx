'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Car, Shield, Banknote, TrendingUp, 
  CheckCircle2, XCircle, Clock, ChevronRight, 
  ArrowUpRight, AlertTriangle, Eye, CreditCard,
  Download
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, 
  Cell 
} from 'recharts';
import { AdminService, formatCurrency } from '@/services/api';

const FUND_DATA = [
  { month: 'Jan', balance: 45000, growth: 12 },
  { month: 'Feb', balance: 52000, growth: 15 },
  { month: 'Mar', balance: 48000, growth: -8 },
  { month: 'Apr', balance: 61000, growth: 22 },
  { month: 'May', balance: 75000, growth: 18 },
  { month: 'Jun', balance: 89000, growth: 25 },
];

const MEMBER_EARNINGS = [
  { category: 'Top 10%', earnings: 450000 },
  { category: 'Avg Driver', earnings: 185000 },
  { category: 'New Member', earnings: 42000 },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'finance' | 'safety'>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, docs] = await Promise.all([
          AdminService.getPlatformMetrics(),
          AdminService.getPendingDocs()
        ]);
        setMetrics(m);
        setPendingDocs(docs);
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVerify = async (docId: string, status: 'verified' | 'rejected') => {
    try {
      await AdminService.verifyDoc(docId, status);
      setPendingDocs(prev => prev.filter(d => d.id !== docId));
      // Refresh metrics
      const m = await AdminService.getPlatformMetrics();
      setMetrics(m);
    } catch (err) {
      alert('Verification failed: ' + (err as Error).message);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Gathering platform data...</div>;

  return (
    <div className="page-enter">
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-subtle)', 
        marginBottom: '32px', paddingBottom: '2px' 
      }}>
        {['overview', 'verifications', 'finance', 'safety'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '12px 4px', background: 'none', border: 'none',
              color: activeTab === tab ? 'var(--gold)' : 'var(--text-tertiary)',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              position: 'relative', textTransform: 'capitalize'
            }}
          >
            {tab}
            {activeTab === tab && (
              <div style={{ 
                position: 'absolute', bottom: -2, left: 0, right: 0, 
                height: 2, background: 'var(--gold)', borderRadius: 2 
              }} />
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="card-glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Banknote color="var(--gold)" />
              <TrendingUp size={16} color="var(--green-light)" />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Community Fund</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>{formatCurrency(metrics.fundBalance)}</div>
          </div>
          <div className="card-glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Car color="var(--sky)" />
              <Users size={16} color="var(--sky)" />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Drivers</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>{metrics.activeDrivers}</div>
          </div>
          <div className="card-glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <TrendingUp color="var(--emerald)" />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Trips</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>{metrics.totalTrips}</div>
          </div>
        </div>
      )}

      {/* VERIFICATIONS TAB */}
      {activeTab === 'verifications' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Pending Driver KYC</h3>
            <span className="badge badge-gold">{pendingDocs.length} Pending</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingDocs.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', background: 'var(--surface-100)', borderRadius: '24px' }}>
                <CheckCircle2 size={48} color="var(--green-light)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                <div style={{ color: 'var(--text-secondary)' }}>All drivers are fully vetted!</div>
              </div>
            ) : pendingDocs.map(doc => (
              <div key={doc.id} className="card-glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--surface-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={24} color="var(--gold)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{doc.profile.full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Type: <span style={{ textTransform: 'uppercase', color: 'var(--text-primary)' }}>{doc.doc_type}</span> • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => window.open(doc.doc_url)} className="btn btn-ghost btn-sm" title="View Document">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => handleVerify(doc.id, 'rejected')} className="btn btn-ghost btn-sm" style={{ color: 'var(--ruby)' }}>
                    <XCircle size={16} /> Reject
                  </button>
                  <button onClick={() => handleVerify(doc.id, 'verified')} className="btn btn-primary btn-sm" style={{ background: 'var(--green-light)', border: 'none' }}>
                    <CheckCircle2 size={16} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FINANCE TAB */}
      {activeTab === 'finance' && (
        <div className="animate-fade-up">
          {/* Financial KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Dividends Distributed', value: 'R142,500', color: 'var(--green-light)' },
              { label: 'Solidarity Levy Yield', value: 'R89,400', color: 'var(--gold)' },
              { label: 'Avg Membership Fee', value: 'R150/mo', color: 'var(--sky)' },
              { label: 'Investment Yield', value: '8.4%', color: 'var(--emerald)' },
            ].map((kpi, i) => (
              <div key={i} className="card-glass" style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>{kpi.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Fund Growth Chart */}
            <div className="card-glass" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Phakamisa Fund Growth</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Cumulative solidarity pool balance (6 Months)</p>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={FUND_DATA}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--gold)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--surface-100)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}
                      itemStyle={{ color: 'var(--gold)' }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="var(--gold)" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Economic Impact Chart */}
            <div className="card-glass" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '24px' }}>Economic Impact</h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MEMBER_EARNINGS} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="category" type="category" stroke="var(--text-tertiary)" fontSize={11} width={80} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--surface-100)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="earnings" radius={[0, 4, 4, 0]} barSize={24}>
                      {MEMBER_EARNINGS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--gold)' : index === 1 ? 'var(--sky)' : 'var(--emerald)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(56,189,248,0.1)', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.2)' }}>
                <div style={{ display: 'flex', gap: '8px', color: 'var(--sky)' }}>
                  <TrendingUp size={14} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Wealth Distributed: R2.4M</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAFETY TAB */}
      {activeTab === 'safety' && (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface-100)', borderRadius: '24px' }}>
          <AlertTriangle size={48} color="var(--ruby)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Incident Command</h3>
          <p style={{ color: 'var(--text-tertiary)', maxWidth: '400px', margin: '0 auto' }}>
            Global SOS monitoring and Taxi Rank incident reports are active in the background. Full command UI arriving soon.
          </p>
        </div>
      )}
    </div>
  );
}
