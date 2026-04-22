'use client';

import { useState, useEffect } from 'react';
import { 
  Rocket, 
  ShieldCheck, 
  Coins, 
  Wifi, 
  Globe, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Activity,
  BarChart
} from 'lucide-react';
import { MonitoringService } from '@/services/api';

const CHECKLIST = [
  { id: 'sec', label: 'Security RLS Audit', status: 'PASS', icon: ShieldCheck, color: 'var(--emerald)' },
  { id: 'res', label: 'Treasury Safety Reserve', status: 'PASS', icon: Coins, color: 'var(--gold)' },
  { id: 'sync', label: 'Offline Sync Engine', status: 'READY', icon: Wifi, color: 'var(--sky)' },
  { id: 'gov', label: 'Democratic Quorum', status: 'READY', icon: Globe, color: 'var(--purple)' }
];

export default function LaunchCenter() {
  const [regions, setRegions] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock loading launch metadata
    setLoading(false);
    setRegions({
      "GP_NORTH": { active: true, name: "Gauteng North / Rank Alpha", load: "High" },
      "WC_METRO": { active: false, name: "Western Cape Metro", load: "N/A" },
      "KZN_DURBAN": { active: false, name: "KZN Durban", load: "N/A" }
    });
  }, []);

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
         <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>Mission Launch Center</h1>
            <p style={{ color: 'var(--text-tertiary)' }}>Final readiness and regional deployment control.</p>
         </div>
         <button className="btn btn-primary" style={{ height: 56, padding: '0 40px', background: 'var(--gradient-gold)', border: 'none', color: 'black', fontWeight: 800 }}>
            <Rocket size={20} /> INITIATE FULL DEPLOYMENT
         </button>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Checklist */}
            <div className="card-glass" style={{ padding: '32px' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px' }}>Production Readiness Checklist</h3>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {CHECKLIST.map(item => (
                     <div key={item.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <item.icon size={20} color={item.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                           <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{item.label}</div>
                           <div style={{ fontSize: '0.7rem', color: item.color, fontWeight: 800 }}>{item.status}</div>
                        </div>
                        <CheckCircle2 color={item.color} size={18} />
                     </div>
                  ))}
               </div>
            </div>

            {/* Regional Nodes */}
            <div className="card-glass" style={{ padding: '32px' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px' }}>Active Regional Nodes</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries<any>(regions).map(([id, reg]) => (
                     <div key={id} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                           <div style={{ width: 10, height: 10, borderRadius: '50%', background: reg.active ? 'var(--emerald)' : 'var(--text-tertiary)' }} />
                           <div>
                              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{reg.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>ID: {id} • Load: {reg.load}</div>
                           </div>
                        </div>
                        <button className={`btn btn-sm ${reg.active ? 'btn-ghost' : 'btn-primary'}`} style={{ fontSize: '0.7rem', padding: '6px 16px' }}>
                           {reg.active ? 'MAINTENANCE' : 'ACTIVATE'}
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Sidebar: Health & Analytics */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card-glass" style={{ padding: '24px' }}>
               <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="var(--sky)" /> Live Network Health
               </h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <HealthBar label="Database" value={98.2} color="var(--emerald)" />
                  <HealthBar label="Sync Engine" value={100} color="var(--sky)" />
                  <HealthBar label="Treasury API" value={99.4} color="var(--gold)" />
               </div>
            </div>

            <div className="card-glass" style={{ padding: '24px', border: '1px solid rgba(255,165,0,0.2)', background: 'rgba(255,165,0,0.05)' }}>
               <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="var(--gold)" /> Pre-Launch Warning
               </h4>
               <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Global deployment will trigger 12,000+ member notifications. Ensure the regional marshal nodes are staffed and ready for coordination.
               </p>
            </div>
         </div>

      </div>
    </div>
  );
}

function HealthBar({ label, value, color }: any) {
  return (
    <div>
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontWeight: 700 }}>{value}%</span>
       </div>
       <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${value}%`, height: '100%', background: color }} />
       </div>
    </div>
  );
}
