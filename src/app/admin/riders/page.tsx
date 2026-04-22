'use client';

import { useState, useEffect } from 'react';
import { Search, Star, Shield, MapPin, Phone, MoreVertical, Wallet, Calendar, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/fare-calculator';
import { supabase } from '@/lib/supabase';

export default function AdminRiders() {
  const [riders, setRiders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRiders() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'rider')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setRiders(data || []);
      } catch (err) {
        console.error('Error fetching admin riders:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRiders();

    // REAL-TIME SYNC: Listen for profile changes (ratings, new riders, etc.)
    const channel = supabase
      .channel('admin_riders_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.rider' },
        () => fetchRiders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredRiders = riders.filter(r => {
    const name = r.name || r.email;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--gold)" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Riders', value: riders.length.toLocaleString(), color: 'var(--sky)' },
          { label: 'Active Status', value: 'System Live', color: 'var(--emerald)' },
          { label: 'Verified Accounts', value: riders.filter(r => r.verification_status === 'verified').length.toLocaleString(), color: 'var(--gold)' },
          { label: 'Platform Avg Rating', value: riders.length > 0 ? (riders.reduce((s, r) => s + (r.rating || 0), 0) / riders.length).toFixed(1) : '5.0', color: 'var(--purple)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '16px' }}>
            <div className="stat-value" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{
          position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-tertiary)',
        }} />
        <input
          className="input input-search"
          placeholder="Search riders by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Riders List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-200)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Rider', 'Status', 'Rating', 'Trips', 'Joined', ''].map((h, i) => (
                <th key={i} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRiders.map((rider) => (
              <tr key={rider.id} style={{
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar">{(rider.name || rider.email)[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rider.name || 'Anonymous User'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{rider.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${rider.verification_status === 'verified' ? 'badge-green' : 'badge-sunset'}`} style={{ fontSize: '0.6875rem' }}>
                    <Shield size={10} /> {rider.verification_status || 'unverified'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={14} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{rider.rating || '5.0'}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                  {rider.total_trips || 0}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {new Date(rider.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button style={{
                    width: 32, height: 32, borderRadius: '8px',
                    background: 'var(--surface-300)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-tertiary)',
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
