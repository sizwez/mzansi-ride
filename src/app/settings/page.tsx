'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, 
  ChevronRight, 
  Check, 
  MapPin, 
  Coins, 
  Bell, 
  Shield, 
  Languages, 
  LogOut,
  User as UserIcon,
  HelpCircle,
  Flag
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GlobalService } from '@/services/api';
import { translations, Language as LangType } from '@/lib/translations';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'zu', name: 'isiZulu', flag: '🇿🇦' },
  { code: 'xh', name: 'isiXhosa', flag: '🇿🇦' },
  { code: 'sn', name: 'chiShona', flag: '🇿🇼' },
  { code: 'st', name: 'Sesotho', flag: '🇱🇸' },
];

const REGIONS = [
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD', flag: '🇿🇼' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', flag: '🇿🇼' },
  { code: 'LS', name: 'Lesotho', currency: 'LSL', flag: '🇱🇸' },
  { code: 'SZ', name: 'Eswatini', currency: 'SZL', flag: '🇸🇿' },
];

export default function SettingsPortal() {
  const { user, profile, signOut } = useAuth();
  const [lang, setLang] = useState<LangType>('en');
  const [region, setRegion] = useState('ZA');
  const [currency, setCurrency] = useState('ZAR');
  const [saving, setSaving] = useState(false);

  const t = translations[lang] || translations.en;

  useEffect(() => {
    if (profile) {
      setLang((profile.preferred_language || 'en') as LangType);
      setRegion(profile.region_code || 'ZA');
      setCurrency(profile.currency || 'ZAR');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await GlobalService.updateRegionalPreferences(user.id, currency, region);
      alert('Preferences updated globally across the SADC network.');
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t.settings}</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Global & Regional Preferences</p>
      </div>

      {/* Profile Section */}
      <div className="card-glass" style={{ padding: '20px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
         <div className="avatar avatar-lg">
            {profile?.name?.[0] || 'U'}
         </div>
         <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{profile?.name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{user?.email}</div>
         </div>
         <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
            {profile?.role?.toUpperCase()}
         </div>
      </div>

      {/* Expandable Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
         
         {/* Language Section */}
         <div className="card-glass" style={{ padding: '0' }}>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               <Languages size={20} color="var(--gold)" />
               <div style={{ flex: 1, fontWeight: 700 }}>Language Accessibility</div>
            </div>
            <div style={{ padding: '12px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '4px' }}>
                  {LANGUAGES.map(l => (
                     <button 
                       key={l.code}
                       onClick={() => setLang(l.code as LangType)}
                       style={{ 
                         display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '10px', 
                         background: lang === l.code ? 'rgba(244,169,0,0.1)' : 'transparent',
                         border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.2s'
                       }}
                     >
                        <span style={{ fontSize: '1.25rem', marginRight: '12px' }}>{l.flag}</span>
                        <span style={{ flex: 1, textAlign: 'left', fontWeight: lang === l.code ? 700 : 400 }}>{l.name}</span>
                        {lang === l.code && <Check size={16} color="var(--gold)" />}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Region & Currency */}
         <div className="card-glass" style={{ padding: '0' }}>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               <Globe size={20} color="var(--sky)" />
               <div style={{ flex: 1, fontWeight: 700 }}>Regional Treasury</div>
            </div>
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                   <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'block' }}>OPERATIONAL REGION</label>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                      {REGIONS.map(r => (
                         <button 
                           key={r.code}
                           onClick={() => { setRegion(r.code); setCurrency(r.currency); }}
                           style={{ 
                             padding: '12px 8px', borderRadius: '10px', background: region === r.code ? 'var(--sky)' : 'rgba(255,255,255,0.03)',
                             border: 'none', color: region === r.code ? 'black' : 'white', cursor: 'pointer', textAlign: 'center'
                           }}
                         >
                            <div style={{ fontSize: '1.25rem' }}>{r.flag}</div>
                            <div style={{ fontSize: '0.625rem', fontWeight: 800, marginTop: '4px' }}>{r.code}</div>
                         </button>
                      ))}
                   </div>
                </div>

                <div>
                   <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'block' }}>CLEARING CURRENCY</label>
                   <select 
                     className="input" 
                     style={{ width: '100%', height: '48px' }}
                     value={currency}
                     onChange={(e) => setCurrency(e.target.value)}
                   >
                      <option value="ZAR">South African Rand (ZAR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="BWP">Botswana Pula (BWP)</option>
                      <option value="LSL">Lesotho Loti (LSL)</option>
                      <option value="SZL">Swazi Lilangeni (SZL)</option>
                   </select>
                </div>
            </div>
         </div>

         {/* Common Actions */}
         <div className="card-glass" style={{ padding: '8px' }}>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', padding: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Bell size={18} /> Push Notifications
               </div>
               <ChevronRight size={16} color="var(--text-tertiary)" />
            </button>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', padding: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Shield size={18} /> Privacy & Shield Settings
               </div>
               <ChevronRight size={16} color="var(--text-tertiary)" />
            </button>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', padding: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <HelpCircle size={18} /> Global Support Center
               </div>
               <ChevronRight size={16} color="var(--text-tertiary)" />
            </button>
         </div>

         {/* Save / Sign Out */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', height: '56px', background: 'var(--gold)', color: 'black', fontWeight: 800 }}
              onClick={handleSave}
              disabled={saving}
            >
               {saving ? 'Syncing Globally...' : 'Update Preferences'}
            </button>
            <button 
              className="btn btn-ghost" 
              style={{ width: '100%', color: 'var(--ruby)', gap: '12px' }}
              onClick={() => signOut()}
            >
               <LogOut size={18} /> Sign Out of Cooperative
            </button>
         </div>

      </div>
    </div>
  );
}
