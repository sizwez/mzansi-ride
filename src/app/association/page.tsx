'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Car, 
  Map as MapIcon, 
  History, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  MapPin,
  Settings
} from 'lucide-react';
import { formatCurrency } from '@/lib/fare-calculator';
import { AssociationService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function AssociationPortal() {
  const { user, associationId: contextAssocId } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app, the associationId would be derived from the leader's profile
  // For the demo, we use a seed ID or fallback
  const assocId = contextAssocId || 'sts-soweto-id-placeholder';

  const fetchData = async () => {
    try {
      const [s, m, r] = await Promise.all([
        AssociationService.getAssociationStats(assocId),
        AssociationService.getMembers(assocId),
        AssociationService.getAuthorizedRoutes(assocId)
      ]);
      setStats(s);
      setMembers(m);
      setRoutes(r);
    } catch (err) {
      console.error('Error fetching association data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b' }}>
       <Building2 className="animate-pulse" color="var(--gold)" size={40} />
    </div>
  );

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 color="black" size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats?.name || 'Association Portal'}</h1>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{stats?.region} &bull; Institutional Dashboard</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ gap: '8px' }}>
            <Settings size={18} /> Settings
          </button>
          <button className="btn btn-primary" style={{ background: 'var(--gold)', color: 'black' }}>
            Official Proclamation
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
        {[
          { label: 'Registered Drivers', value: stats?.driverCount, icon: Users, color: 'var(--sky)' },
          { label: 'Active Fleet', value: stats?.activeFleet, icon: Car, color: 'var(--emerald)' },
          { label: 'Compliance Rate', value: '94%', icon: ShieldCheck, color: 'var(--gold)' },
          { label: 'Monthly Levy', value: formatCurrency(stats?.monthlyLevy || 500), icon: TrendingUp, color: 'var(--purple)' },
        ].map((kpi, i) => (
          <div key={i} className="card-glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
               <kpi.icon size={20} color={kpi.color} />
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800 }}>{kpi.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Fleet & Compliance Management */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Fleet Management</h2>
             <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Search driver or plate..." 
                  className="input" 
                  style={{ width: '240px', height: '36px', fontSize: '0.75rem' }} 
                />
             </div>
          </div>

          <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  <th style={{ padding: '16px 24px' }}>DRIVER & VEHICLE</th>
                  <th style={{ padding: '16px 24px' }}>PERMIT STATUS</th>
                  <th style={{ padding: '16px 24px' }}>COMPLIANCE</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                   <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                     <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {m.vehicles?.[0]?.plate_number || 'No Vehicle'} &bull; {m.vehicles?.[0]?.make}
                        </div>
                     </td>
                     <td style={{ padding: '20px 24px' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.625rem' }}>Active</span>
                     </td>
                     <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', width: '60px' }}>
                              <div style={{ width: '95%', height: '100%', background: 'var(--emerald)', borderRadius: '2px' }} />
                           </div>
                           <span style={{ fontSize: '0.75rem' }}>95%</span>
                        </div>
                     </td>
                     <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }}><ChevronRight size={16} /></button>
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Association Routes & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
           <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Authorized Routes</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {routes.map(route => (
                   <div key={route.id} className="card-glass" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(244,169,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MapIcon size={16} color="var(--gold)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{route.name}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                            {route.start_rank?.name} &rarr; {route.end_rank?.name}
                          </div>
                        </div>
                        <span className="badge badge-gold" style={{ fontSize: '0.6rem' }}>Authorized</span>
                      </div>
                   </div>
                ))}
              </div>
           </div>

           <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Regional Alerts</h2>
              <div className="card-glass" style={{ padding: '20px', border: '1px solid rgba(248,113,113,0.2)' }}>
                 <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <AlertTriangle color="#f87171" size={20} />
                    <div>
                       <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f87171' }}>Route Obstruction</div>
                       <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                         Construction on M1 North near Bree Rank. Advise drivers to use alternative throughways for the next 4 hours.
                       </p>
                       <button className="btn btn-sm" style={{ marginTop: '12px', background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', color: '#f87171' }}>
                         Broadcast to Fleet
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
