'use client';

import { useState, useEffect } from 'react';
import { Car, Wrench, Gauge, Calendar, AlertTriangle, Shield, Fuel, CheckCircle, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/fare-calculator';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function DriverVehicle() {
  const { user, loading: authLoading } = useAuth();
  const [vehicle, setVehicle] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setIsLoading(true);
        const [profileRes, vehicleRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('vehicles').select('*').eq('owner_id', user.id).single()
        ]);
        
        setProfile(profileRes.data);
        setVehicle(vehicleRes.data);
      } catch (err) {
        console.error('Error fetching vehicle data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    let profileChannel: any;
    let vehicleChannel: any;

    if (user && !authLoading) {
      fetchData();

      // REAL-TIME: Listen for profile (earnings/trips) and vehicle (balance/health) updates
      profileChannel = supabase
        .channel('driver_profile_sync')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
          setProfile(payload.new);
        })
        .subscribe();

      vehicleChannel = supabase
        .channel('driver_vehicle_sync')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vehicles', filter: `owner_id=eq.${user.id}` }, (payload) => {
          setVehicle(payload.new);
        })
        .subscribe();
    }

    return () => {
      if (profileChannel) supabase.removeChannel(profileChannel);
      if (vehicleChannel) supabase.removeChannel(vehicleChannel);
    };
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--gold)" />
      </div>
    );
  }

  // Fallback if no vehicle is found
  if (!vehicle) {
    return (
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <Car size={48} color="var(--text-tertiary)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>No Vehicle Assigned</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Your driver vehicle registration is pending or not found. Please contact support.</p>
      </div>
    );
  }

  const rentToOwnPercent = vehicle.rent_to_own_balance && vehicle.rent_to_own_total
    ? ((vehicle.rent_to_own_total - vehicle.rent_to_own_balance) / vehicle.rent_to_own_total) * 100
    : null;

  const healthColor = (vehicle.health_score || 100) >= 90 ? 'var(--emerald)' :
    (vehicle.health_score || 100) >= 70 ? 'var(--gold)' : 'var(--ruby)';

  const daysUntilService = vehicle.next_service ? Math.ceil(
    (new Date(vehicle.next_service).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ) : 0;

  const checklistItems = [
    { label: 'License Disc', status: 'valid', expiry: '2026-12-31' },
    { label: 'Insurance', status: 'valid', expiry: '2026-08-15' },
    { label: 'Roadworthy Certificate', status: 'valid', expiry: '2026-06-20' },
    { label: 'PrDP (Professional Driving Permit)', status: 'valid', expiry: '2027-01-10' },
  ];

  return (
    <div className="page-enter" style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>My Vehicle</h2>

      {/* Vehicle Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(167,139,250,0.06) 100%)',
        border: '1px solid rgba(56,189,248,0.2)',
        borderRadius: '20px', padding: '24px', marginBottom: '20px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-30px', right: '-10px', opacity: 0.06,
          fontSize: '8rem',
        }}>
          🚗
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              {vehicle.make} {vehicle.model}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {vehicle.year} • {vehicle.color} • {vehicle.capacity} seats
            </div>
          </div>
          <div style={{
            padding: '8px 14px', borderRadius: '10px',
            background: 'var(--surface-200)', border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9375rem',
            letterSpacing: '0.05em',
          }}>
            {vehicle.plate_number}
          </div>
        </div>

        {/* Health Score Gauge */}
        <div style={{
          background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '16px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `conic-gradient(${healthColor} ${(vehicle.health_score || 100) * 3.6}deg, var(--surface-300) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: 'var(--surface-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem',
              color: healthColor,
            }}>
              {vehicle.health_score || 100}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Vehicle Health</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {(vehicle.health_score || 100) >= 90 ? 'Excellent condition' :
                (vehicle.health_score || 100) >= 70 ? 'Good — service soon' : 'Needs attention'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <div className="stat-card" style={{ padding: '16px' }}>
          <Wrench size={18} style={{ color: 'var(--sunset)' }} />
          <div className="stat-value" style={{ fontSize: '1.125rem' }}>
            {daysUntilService > 0 ? `${daysUntilService} days` : 'Check Date'}
          </div>
          <div className="stat-label">Next Service</div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <Gauge size={18} style={{ color: 'var(--sky)' }} />
          <div className="stat-value" style={{ fontSize: '1.125rem' }}>{(profile?.total_trips || 0).toLocaleString()}</div>
          <div className="stat-label">Total Trips</div>
        </div>
      </div>

      {/* Rent-to-Own Progress */}
      {rentToOwnPercent !== null && (
        <div className="card" style={{
          padding: '20px', marginBottom: '20px',
          background: 'linear-gradient(135deg, rgba(244,169,0,0.08) 0%, transparent 100%)',
          border: '1px solid rgba(244,169,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <TrendingUp size={18} style={{ color: 'var(--gold)' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Ownership Progress</h3>
          </div>

          <div className="progress-bar" style={{ marginBottom: '12px' }}>
            <div className="progress-bar-fill" style={{
              width: `${rentToOwnPercent}%`,
              background: 'var(--gradient-gold)',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>Paid: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--emerald)' }}>
                {formatCurrency(vehicle.rent_to_own_total! - vehicle.rent_to_own_balance!)}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>Remaining: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--gold)' }}>
                {formatCurrency(vehicle.rent_to_own_balance!)}
              </span>
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            {rentToOwnPercent.toFixed(0)}% paid — of {formatCurrency(vehicle.rent_to_own_total!)} total
          </div>
        </div>
      )}

      {/* Compliance Checklist */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Shield size={18} style={{ color: 'var(--green-light)' }} />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Compliance Checklist</h3>
        </div>

        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {checklistItems.map((item, i) => {
            const daysToExpiry = Math.ceil(
              (new Date(item.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isWarning = daysToExpiry < 30;

            return (
              <div key={i} className="card" style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                borderColor: isWarning ? 'rgba(249,115,22,0.3)' : undefined,
              }}>
                {isWarning ? (
                  <AlertTriangle size={18} style={{ color: 'var(--sunset)'}} />
                ) : (
                  <CheckCircle size={18} style={{ color: 'var(--emerald)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: isWarning ? 'var(--sunset)' : 'var(--text-tertiary)' }}>
                    {isWarning ? `Expires in ${daysToExpiry} days!` :
                      `Valid until ${new Date(item.expiry).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </div>
                </div>
                <span className={`badge ${isWarning ? 'badge-sunset' : 'badge-green'}`} style={{ fontSize: '0.625rem' }}>
                  {isWarning ? 'Expiring' : 'Valid'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Schedule */}
      {vehicle.next_service && (
        <div className="card" style={{
          padding: '16px',
          background: daysUntilService <= 7
            ? 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, transparent 100%)'
            : undefined,
          borderColor: daysUntilService <= 7 ? 'rgba(239,68,68,0.3)' : undefined,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Calendar size={16} style={{ color: daysUntilService <= 7 ? 'var(--ruby)' : 'var(--sky)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Upcoming Service</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Scheduled Date</div>
              <div style={{ fontWeight: 600 }}>
                {new Date(vehicle.next_service).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
            <button className="btn btn-primary btn-sm">Book Now</button>
          </div>
        </div>
      )}
    </div>
  );
}
