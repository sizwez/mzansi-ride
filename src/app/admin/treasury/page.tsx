'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  BarChart3, 
  ShieldCheck, 
  Briefcase, 
  Coins, 
  ArrowRight,
  RefreshCw,
  Zap,
  Building2,
  PieChart,
  Check
} from 'lucide-react';
import { TreasuryService, AdminService } from '@/services/api';

export default function TreasuryPortal() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTreasury();
  }, []);

  const loadTreasury = async () => {
    setLoading(true);
    try {
      const data = await TreasuryService.getTreasuryState();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b' }}>
       <RefreshCw className="animate-spin" color="var(--sky)" size={42} />
    </div>
  );

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
         <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Institutional Treasury</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Portfolio management & cooperative asset health.</p>
         </div>
         <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={loadTreasury}>
               <RefreshCw size={18} />
            </button>
            <button className="btn btn-primary" style={{ background: 'var(--emerald)', border: 'none' }}>
               <Zap size={18} /> Run Batch Settlement
            </button>
         </div>
      </div>

      {/* Primary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
         <MetricCard 
            title="Total Assets Under Mgmt" 
            value={`R${(metrics.totalAssets / 1000000).toFixed(2)}M`} 
            desc="+4.2% this month" 
            icon={Briefcase} 
            color="var(--sky)" 
         />
         <MetricCard 
            title="Fleet Net Value" 
            value={`R${(metrics.fleetValue / 1000000).toFixed(2)}M`} 
            desc={`${metrics.runnerEquity > 0 ? ((metrics.runnerEquity/metrics.fleetValue)*100).toFixed(1) : 0}% Member Owned`} 
            icon={TrendingUp} 
            color="var(--gold)" 
         />
         <MetricCard 
            title="Liquid Reserves" 
            value={`R${(metrics.cashReserve / 1000).toFixed(1)}k`} 
            desc="15.2% Safety Buffer Lock" 
            icon={Coins} 
            color="var(--emerald)" 
         />
         <MetricCard 
            title="Equity Velocity" 
            value="8.4%" 
            desc="Buyout acceleration" 
            icon={BarChart3} 
            color="var(--purple)" 
         />
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Asset Progress Panel */}
            <div className="card-glass" style={{ padding: '32px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Asset Equity Structure</h3>
                  <div className="badge badge-sky">Updated Live</div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                  <div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Member Buyout Equity</span>
                        <span style={{ fontWeight: 700 }}>R{metrics.runnerEquity.toLocaleString()}</span>
                     </div>
                     <div style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${(metrics.runnerEquity / metrics.fleetValue) * 100}%`, height: '100%', background: 'var(--gold)' }} />
                     </div>
                  </div>
                  <div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Cooperative Retained Interest</span>
                        <span style={{ fontWeight: 700 }}>R{metrics.coopEquity.toLocaleString()}</span>
                     </div>
                     <div style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${(metrics.coopEquity / metrics.fleetValue) * 100}%`, height: '100%', background: 'var(--sky)' }} />
                     </div>
                  </div>
               </div>

               <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                  Our rent-to-own philosophy ensures that the cooperative's role is to seed ownership, not to extract rent. As members complete more trips, the global equity balance shifts from the institutional treasury to individual member accounts.
               </p>
            </div>

            {/* Performance Multipliers */}
            <div className="card-glass" style={{ padding: '32px' }}>
               <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '20px' }}>Rank Performance Weights</h3>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <RankStat label="Gauteng North" safety={1.05} efficiency={1.12} />
                  <RankStat label="Western Cape" safety={1.08} efficiency={1.05} />
                  <RankStat label="KZN Metro" safety={1.02} efficiency={1.08} />
               </div>
            </div>
         </div>

         {/* Sidebar: Treasury Compliance */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card-glass" style={{ padding: '24px', border: '1px solid var(--border-emerald)' }}>
               <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--emerald)" /> Compliance Seal
               </h4>
               <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Treasury protocol requires 2/3 Multi-Sig approval for dividend payouts exceeding R100k.
               </p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <SigIndicator name="Chairman" signed={true} />
                  <SigIndicator name="Treasury Secretary" signed={true} />
                  <SigIndicator name="Audit Committee" signed={false} />
               </div>
            </div>

            <div className="card-glass" style={{ padding: '24px' }}>
               <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '16px' }}>Forex Exposure</h4>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem' }}>
                  <span>ZAR / MZN</span>
                  <span style={{ color: 'var(--ruby)' }}>-1.2% Risk</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>ZAR / BWP</span>
                  <span style={{ color: 'var(--emerald)' }}>+0.5% Stable</span>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, desc, icon: Icon, color }: any) {
  return (
    <div className="card-glass" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ 
        position: 'absolute', top: '-10px', right: '-10px', width: 60, height: 60, 
        background: `${color}08`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}>
         <Icon size={24} style={{ opacity: 0.2, color }} />
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, margin: '8px 0', fontFamily: 'var(--font-display)' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
         {desc}
      </div>
    </div>
  );
}

function RankStat({ label, safety, efficiency }: any) {
  return (
    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
       <div style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '8px' }}>{label}</div>
       <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Safety: {safety}x</div>
       <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Efficiency: {efficiency}x</div>
    </div>
  );
}

function SigIndicator({ name, signed }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '12px', opacity: signed ? 1 : 0.4 }}>
       <div style={{ width: 8, height: 8, borderRadius: '50%', background: signed ? 'var(--emerald)' : 'var(--text-tertiary)' }} />
       <span style={{ fontSize: '0.8125rem', flex: 1 }}>{name}</span>
       {signed && <Check size={12} color="var(--emerald)" />}
    </div>
  );
}
