'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, Star, ChevronRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/fare-calculator';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function RiderActivity() {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrips() {
      if (!user) return;
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('trips')
          .select('*, profiles!trips_driver_id_fkey(name)')
          .eq('rider_id', user.id)
          .order('requested_at', { ascending: false });
        
        if (error) throw error;
        setTrips(data || []);
      } catch (err) {
        console.error('Error fetching rider activity:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (user && !authLoading) {
      fetchTrips();
    }
  }, [user, authLoading]);

  const statusColors: Record<string, string> = {
    completed: 'var(--emerald)',
    in_progress: 'var(--sky)',
    requested: 'var(--gold)',
    cancelled: 'var(--ruby)',
  };

  const statusLabels: Record<string, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    requested: 'Requested',
    cancelled: 'Cancelled',
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--gold)" />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Activity</h2>

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {trips.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No trips found. Start your first ride!
          </div>
        ) : trips.map((trip) => (
          <div key={trip.id} className="card" style={{ padding: '16px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: statusColors[trip.status] || 'var(--text-tertiary)',
                    display: 'inline-block',
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColors[trip.status] }}>
                    {statusLabels[trip.status] || trip.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {new Date(trip.requested_at).toLocaleDateString('en-ZA', { 
                    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                  })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)' }}>
                  {formatCurrency((trip.fare?.total || trip.fare) || 0)}
                </div>
                {trip.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <Star size={12} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{trip.rating}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '8px',
              padding: '12px', background: 'var(--surface-200)', borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{trip.pickup_name || trip.pickup_address}</span>
              </div>
              <div style={{ borderLeft: '1px dashed var(--border-medium)', marginLeft: '2px', height: '8px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{trip.dropoff_name || trip.dropoff_address}</span>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="avatar avatar-sm">{(trip.profiles?.name || 'D')[0]}</div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{trip.profiles?.name || 'Driver Assigned'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <MapPin size={12} /> {trip.distance || 0} km
                <Clock size={12} style={{ marginLeft: '8px' }} /> {trip.duration || 0} min
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
