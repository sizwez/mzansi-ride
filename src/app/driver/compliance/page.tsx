'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Map as MapIcon, 
  FileText, 
  AlertCircle,
  Building2,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/fare-calculator';
import { AssociationService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function DriverCompliance() {
  const { user, associationId } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!associationId) {
       setLoading(false);
       return;
    }
    try {
      const [s, r] = await Promise.all([
        AssociationService.getAssociationStats(associationId),
        AssociationService.getAuthorizedRoutes(associationId)
      ]);
      setStats(s);
      setRoutes(r);
    } catch (err) {
      console.error('Error fetching compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  if (loading) return <div className="loading-state">...</div>;

  if (!associationId) {
    return (
      <div className="page-enter" style={{ padding: '24px', textAlign: 'center' }}>
         <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(244,169,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Building2 color="var(--gold)" size={32} />
         </div>
         <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>Association Required</h2>
         <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
           To operate on official cooperative routes, you must be linked to a registered Taxi Association.
         </p>
         <button className="btn btn-primary" style={{ width: '100%', background: 'var(--gold)', color: 'black' }}>
           Search Local Associations
         </button>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck color="var(--emerald)" size={24} />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Route Compliance</h1>
      </div>

      {/* Association Info Card */}
      <div className="card-glass" style={{ padding: '20px', marginBottom: '24px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
               <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Association</div>
               <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{stats?.name}</div>
            </div>
            <div className="badge badge-green">VERIFIED</div>
         </div>
         <div style={{ display: 'flex', gap: '20px' }}>
            <div>
               <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>MONTHLY LEVY</div>
               <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{formatCurrency(stats?.monthlyLevy || 0)}</div>
            </div>
            <div>
               <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>PERMIT EXPIRY</div>
               <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>31 Dec 2026</div>
            </div>
         </div>
      </div>

      {/* Authorized Routes */}
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '16px' }}>My Authorized Routes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {routes.length === 0 ? (
          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '0.875rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            No routes currently assigned to you.
          </div>
        ) : (
          routes.map(r => (
            <div key={r.id} className="card" style={{ padding: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                 <MapIcon size={18} color="var(--gold)" />
                 <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{r.name}</div>
               </div>
               <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <MapPin size={14} /> {r.start_rank?.name} &bull; {r.end_rank?.name}
               </div>
            </div>
          ))
        )}
      </div>

      {/* Compliance History / Alerts */}
      <div className="card" style={{ padding: '20px', background: 'rgba(244,169,0,0.05)', border: '1px solid rgba(244,169,0,0.2)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <TrendingUp size={16} color="var(--gold)" />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Performance Rating</h3>
         </div>
         <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
           Maintain high route compliance to stay eligible for cooperative dividends and association benefits.
         </p>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
               <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>COMPLIANCE score</div>
               <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--emerald)' }}>98%</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
               <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>ROUTE TIME</div>
               <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>4.8h <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>avg</span></div>
            </div>
         </div>
      </div>

      {/* Document Link */}
      <div style={{ marginTop: '32px' }}>
         <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <FileText size={18} />
               <span style={{ fontSize: '0.875rem' }}>View Association Constitution</span>
            </div>
            <ChevronRight size={16} />
         </button>
      </div>
    </div>
  );
}
