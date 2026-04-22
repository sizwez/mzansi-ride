'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Star, Shield, MapPin, Phone, MoreVertical, CheckCircle, AlertTriangle, XCircle, Car, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/fare-calculator';
import { supabase } from '@/lib/supabase';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDrivers() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*, vehicles(*)')
          .eq('role', 'driver')
          .order('name', { ascending: true });
        
        if (error) throw error;
        setDrivers(data || []);
      } catch (err) {
        console.error('Error fetching admin drivers:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDrivers();

    // REAL-TIME SYNC: Listen for profile changes (verification, etc.)
    const channel = supabase
      .channel('admin_drivers_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.driver' },
        () => fetchDrivers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredDrivers = drivers.filter(d => {
    const name = d.name || d.email;
    const plate = d.vehicles?.[0]?.plate_number || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plate.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'verified' && d.verification_status === 'verified') ||
      (filterStatus === 'pending' && d.verification_status === 'pending');
      
    return matchesSearch && matchesFilter;
  });

  const verificationIcons: Record<string, React.ReactNode> = {
    verified: <CheckCircle size={14} style={{ color: 'var(--emerald)' }} />,
    pending: <AlertTriangle size={14} style={{ color: 'var(--sunset)' }} />,
    rejected: <XCircle size={14} style={{ color: 'var(--ruby)' }} />,
  };

  if (isLoading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--gold)" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Header Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Drivers', value: drivers.length, color: 'var(--sky)' },
          { label: 'Active Fleet', value: drivers.filter(d => d.verification_status === 'verified').length, color: 'var(--emerald)' },
          { label: 'Pending Review', value: drivers.filter(d => d.verification_status === 'pending').length, color: 'var(--sunset)' },
          { label: 'Avg Rating', value: drivers.length > 0 ? (drivers.reduce((s, d) => s + (d.rating || 0), 0) / drivers.length).toFixed(1) : '5.0', color: 'var(--gold)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-value" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
          }} />
          <input
            className="input input-search"
            placeholder="Search drivers by name or plate number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'verified', 'pending'].map((f) => (
            <button key={f} onClick={() => setFilterStatus(f)} style={{
              padding: '8px 16px', borderRadius: '8px',
              background: filterStatus === f ? 'rgba(244,169,0,0.15)' : 'var(--surface-200)',
              border: `1px solid ${filterStatus === f ? 'var(--border-gold)' : 'var(--border-subtle)'}`,
              color: filterStatus === f ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: '0.8125rem', fontWeight: 500,
              textTransform: 'capitalize', transition: 'all 0.2s',
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Driver Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              background: 'var(--surface-200)', borderBottom: '1px solid var(--border-subtle)',
            }}>
              {['Driver', 'Vehicle', 'Status', 'Rating', 'Trips', 'Shares', ''].map((header, i) => (
                <th key={i} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(filteredDrivers.length === 0) ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  No drivers matching your criteria.
                </td>
              </tr>
            ) : filteredDrivers.map((driver) => (
              <tr key={driver.id} style={{
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ position: 'relative' }}>
                      {(driver.name || driver.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{driver.name || driver.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {verificationIcons[driver.verification_status || 'pending']}
                          {driver.verification_status || 'pending'}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {driver.vehicles?.[0]?.make} {driver.vehicles?.[0]?.model || 'No vehicle'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {driver.vehicles?.[0]?.plate_number}
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${driver.verification_status === 'verified' ? 'badge-green' : 'badge-ruby'}`} style={{ fontSize: '0.6875rem' }}>
                    {driver.verification_status === 'verified' ? 'Active' : 'Restricted'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={14} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{driver.rating || '5.0'}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                  {(driver.total_trips || 0).toLocaleString()}
                </td>
                <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--gold)' }}>
                  {driver.shares || 1}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button style={{
                    width: 32, height: 32, borderRadius: '8px',
                    background: 'var(--surface-300)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-tertiary)', transition: 'all 0.2s',
                  }}>
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
