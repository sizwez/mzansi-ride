'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Shield, Info, Star, Search, Filter, AlertTriangle, Coffee, Wifi, Landmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

const MapView = dynamic(() => import('@/components/map/MapView'), { 
  ssr: false,
  loading: () => <div style={{ height: '400px', background: 'var(--surface-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin className="animate-pulse" /></div>
});

export default function DirectoryPage() {
  const { t } = useLanguage();
  const [ranks, setRanks] = useState<any[]>([]);
  const [selectedRank, setSelectedRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchRanks() {
      const { data, error } = await supabase.from('taxi_ranks').select('*');
      if (!error && data) setRanks(data);
      setLoading(false);
    }
    fetchRanks();
  }, []);

  const filteredRanks = ranks.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-enter" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 16px', background: 'var(--surface-100)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
          {t('directory')}
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem' }}>
          Community verified hubs for safe transit.
        </p>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', marginTop: '20px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            type="text" 
            placeholder="Search by rank name (e.g. Bara)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '14px 14px 14px 48px',
              background: 'var(--surface-200)', border: '1px solid var(--border-subtle)',
              borderRadius: '16px', color: 'white', fontSize: '0.9375rem', outline: 'none'
            }}
          />
        </div>
      </header>

      {/* Map Area */}
      <div style={{ height: '350px', position: 'relative', overflow: 'hidden' }}>
        <MapView 
          center={[-26.2041, 28.0473]} 
          zoom={12} 
          showDriverOverlay={false}
          className="directory-map"
        />
        
        {/* Safety Legend Overlay */}
        <div style={{
          position: 'absolute', bottom: '16px', right: '16px',
          background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(8px)',
          padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)',
          fontSize: '0.625rem', color: 'var(--text-tertiary)', zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-light)' }} /> High Safety
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} /> Use Caution
          </div>
        </div>
      </div>

      {/* Rank List */}
      <div style={{ flex: 1, padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Nearby Hubs</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{filteredRanks.length} found</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading major hubs...</div>
          ) : filteredRanks.map(rank => (
            <div 
              key={rank.id} 
              className="card-glass" 
              onClick={() => setSelectedRank(rank)}
              style={{
                padding: '20px', borderRadius: '20px', cursor: 'pointer',
                border: selectedRank?.id === rank.id ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{rank.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <MapPin size={12} color="var(--text-tertiary)" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Johannesburg, GP
                    </span>
                  </div>
                </div>
                <div className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={12} fill="currentColor" /> {rank.safety_rating}
                </div>
              </div>

              {/* Amenities */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {rank.amenities.map((a: string, i: number) => (
                  <div key={i} style={{ 
                    padding: '4px 10px', background: 'var(--surface-200)', borderRadius: '20px',
                    fontSize: '0.625rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    {a === 'WiFi' && <Wifi size={10} />}
                    {a === 'Security Post' && <Shield size={10} />}
                    {a === 'ATMs' && <Landmark size={10} />}
                    {a}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div style={{ padding: '24px 16px', background: 'var(--surface-100)', borderTop: '1px solid var(--border-subtle)' }}>
        <button className="btn btn-secondary" style={{ width: '100%', gap: '8px' }}>
          <AlertTriangle size={18} /> Report Safety Incident at Rank
        </button>
      </div>
    </div>
  );
}
