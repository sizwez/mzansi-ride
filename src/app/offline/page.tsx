'use client';

import { WifiOff, ShieldCheck, MapPin, PhoneCall } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh', padding: '24px',
      background: 'var(--background)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center'
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '24px',
        background: 'rgba(244,169,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <WifiOff size={40} color="var(--gold)" />
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
        You're Offline
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
        Mzansi Ride is currently disconnected. <br />
        Don't worry, your safety features remain active.
      </p>

      {/* Basic Safety Info (Cached) */}
      <div style={{
        width: '100%', maxWidth: '340px', background: 'var(--surface-100)',
        borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)',
        textAlign: 'left', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <ShieldCheck size={20} color="var(--emerald)" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Emergency Contact</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Call 0800 123 456 for urgent assistance.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <MapPin size={20} color="var(--sunset)" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Last Known Location</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Location is saved locally for emergency services.</div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => window.location.reload()}
        className="btn btn-primary" style={{ width: '100%', maxWidth: '340px', marginBottom: '12px' }}
      >
        Retry Connection
      </button>

      <Link href="/" className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
        Back to Dashboard
      </Link>
    </div>
  );
}
