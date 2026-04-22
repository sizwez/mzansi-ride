'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  MapPin, 
  Check, 
  AlertTriangle,
  FileText,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { IdentityService } from '@/services/api';
import Link from 'next/link';

export default function PrivacyDashboard() {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<any>({
    show_trip_history: true,
    share_location_with_rank: true,
    marketing_consent: false,
    anonymize_older_trips: false
  });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (profile?.privacy_settings) {
      setSettings(profile.privacy_settings);
    }
  }, [profile]);

  const handleToggle = async (key: string) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setSaving(true);
    try {
      await IdentityService.updatePrivacySettings(user!.id, newSettings);
    } catch (err) {
      console.error('Failed to update privacy:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!user) return;
    setDownloading(true);
    try {
      const data = await IdentityService.exportUserData(user.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mzansi-ride-data-${user.id.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Data export failed. Please contact support.');
    } finally {
      setDownloading(false);
    }
  };

  const handleAnonymize = async () => {
    const confirmed = confirm("WARNING: This will permanently redact your personal information and deactivate your account. You will lose access to your cooperative shares and voting power. Proceed?");
    if (confirmed) {
      try {
        await IdentityService.anonymizeAccount(user!.id);
        alert('Account successfully anonymized. Sign out to complete the process.');
      } catch (err) {
        alert('Anonymization failed. Please contact the cooperative admin.');
      }
    }
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
         <Link href="/rider/profile" className="btn-icon">
            <ArrowLeft size={20} />
         </Link>
         <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Privacy Sovereignty</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>Your data, your rules.</p>
         </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
         
         {/* Visibility Toggles */}
         <div className="card-glass" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Eye size={18} color="var(--sky)" /> Visibility Controls
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                     <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Show Trip History</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Allow rank managers to view your past trips</div>
                  </div>
                  <button 
                    onClick={() => handleToggle('show_trip_history')}
                    style={{ 
                      width: 48, height: 26, borderRadius: 13, background: settings.show_trip_history ? 'var(--sky)' : 'rgba(255,255,255,0.1)',
                      position: 'relative', border: 'none', cursor: 'pointer'
                    }}
                  >
                     <div style={{ 
                       width: 20, height: 20, borderRadius: '50%', background: 'white', 
                       position: 'absolute', top: 3, left: settings.show_trip_history ? 25 : 3, transition: 'all 0.2s' 
                     }} />
                  </button>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                     <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Share Location</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Visible to rank marshals for better dispatch</div>
                  </div>
                  <button 
                    onClick={() => handleToggle('share_location_with_rank')}
                    style={{ 
                      width: 48, height: 26, borderRadius: 13, background: settings.share_location_with_rank ? 'var(--sky)' : 'rgba(255,255,255,0.1)',
                      position: 'relative', border: 'none', cursor: 'pointer'
                    }}
                  >
                     <div style={{ 
                       width: 20, height: 20, borderRadius: '50%', background: 'white', 
                       position: 'absolute', top: 3, left: settings.share_location_with_rank ? 25 : 3, transition: 'all 0.2s' 
                     }} />
                  </button>
               </div>
            </div>
         </div>

         {/* Data Portability */}
         <div className="card-glass" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Download size={18} color="var(--gold)" /> Data Portability
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
               Request a machine-readable JSON file containing your profile, ride history, and cooperative financial records.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', background: 'rgba(244,169,0,0.1)', color: 'var(--gold)', border: '1px solid var(--border-gold)' }}
              onClick={handleDownload}
              disabled={downloading}
            >
               <FileText size={18} /> {downloading ? 'Preparing Archive...' : 'Download My Data (.JSON)'}
            </button>
         </div>

         {/* Account Sovereignty */}
         <div className="card-glass" style={{ padding: '20px', border: '1px solid rgba(235, 64, 52, 0.2)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Trash2 size={18} color="var(--ruby)" /> Account Sovereignty
            </h3>
            <div style={{ 
               padding: '12px', background: 'rgba(235,64,52,0.05)', borderRadius: '10px', 
               border: '1px solid rgba(235,64,52,0.1)', display: 'flex', gap: '12px', marginBottom: '20px' 
            }}>
               <AlertTriangle size={24} color="var(--ruby)" />
               <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Anonymizing your account will redact your PII but keep non-identifying transaction data for collective audits. **This action is permanent.**
               </div>
            </div>
            <button 
              className="btn btn-ghost" 
              style={{ width: '100%', color: 'var(--ruby)', background: 'rgba(235,64,52,0.05)' }}
              onClick={handleAnonymize}
            >
               Deactivate & Anonymize My Profile
            </button>
         </div>

         {/* Policy Footer */}
         <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
               Cooperative Compliance
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.75rem' }}>
               <Link href="/legal/popia" style={{ color: 'var(--sky)' }}>POPIA Notice</Link>
               <Link href="/legal/gdpr" style={{ color: 'var(--sky)' }}>GDPR Compliance</Link>
            </div>
         </div>

      </div>
    </div>
  );
}
