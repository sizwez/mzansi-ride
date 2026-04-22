'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Lock, CheckCircle2, ArrowRight, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

export default function SignupPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [popiaConsent, setPopiaConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popiaConsent) {
      setError('You must accept the POPIA data protection agreement to join the cooperative.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          popia_consent: true,
          popia_consent_at: new Date().toISOString(),
        }
      }
    });

    if (signupError) {
      setError(signupError.message);
    } else {
      alert('Welcome to the Co-op! Please check your email to verify your account.');
    }
    setLoading(false);
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card-glass" style={{ width: '100%', maxWidth: '440px', padding: '40px', borderRadius: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '20px', background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
          }}>
            <UserPlus size={32} color="#0A0E1A" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Join the Co-op</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Create your Mzansi Ride profile.</p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px 16px', background: 'rgba(239,68,68,0.1)', color: 'var(--ruby)', 
            borderRadius: '12px', fontSize: '0.75rem', marginBottom: '24px', border: '1px solid rgba(239,68,68,0.2)' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600 }}>FULL NAME</label>
              <input 
                type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Vuyani M."
                className="input-field" style={{ width: '100%', padding: '14px', background: 'var(--surface-200)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}
              />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600 }}>EMAIL ADDRESS</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vuyani@mzansijourney.co.za"
                className="input-field" style={{ width: '100%', padding: '14px', background: 'var(--surface-200)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}
              />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600 }}>PASSWORD</label>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" style={{ width: '100%', padding: '14px', background: 'var(--surface-200)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'white' }}
              />
            </div>

            {/* POPIA Consent Box */}
            <div style={{
              background: 'rgba(56,189,248,0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(56,189,248,0.2)',
              marginTop: '12px'
            }}>
              <label style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" checked={popiaConsent} onChange={e => setPopiaConsent(e.target.checked)}
                  style={{ width: '20px', height: '20px', borderRadius: '6px', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  I consent to the processing of my personal data according to the **POPIA Compliance Code** of the Mzansi Ride Cooperative. My data is my own and is used only for transport safety.
                </div>
              </label>
            </div>

            <button disabled={loading} className="btn btn-primary" style={{ height: '56px', width: '100%', borderRadius: '16px' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          Already a member? <Link href="/" style={{ color: 'var(--gold)', fontWeight: 600 }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
