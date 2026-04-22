'use client';

import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Car, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      if (role === 'driver') router.push('/driver');
      else if (role === 'admin') router.push('/admin');
      else router.push('/rider');
    }
  }, [user, role, loading, router]);

  return (
    <div className="page-enter" style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      {/* Left side - Visual/Info */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, rgba(244,169,0,0.1) 0%, rgba(0,104,71,0.1) 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        borderRight: '1px solid var(--border-subtle)',
      }} className="hide-mobile">
        <div style={{ maxWidth: '440px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '12px',
            background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-gold)',
          }}>
            <Car size={26} color="#0A0E1A" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em' }}>
            South Africa&apos;s Third Way <span className="text-gradient-gold">Transport</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '40px' }}>
            Experience the mobility platform that treats drivers as co-owners and riders as valued community members.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)' }}>
                <Shield size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Community-first Safety</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Panic buttons and real-time monitoring on every trip.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '40px',
      }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ marginBottom: '32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to Landing
          </Link>
          
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Welcome back</h2>
            <p style={{ color: 'var(--text-tertiary)' }}>Sign in to continue your journey</p>
          </div>

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#F4A900',
                    brandAccent: '#FFD166',
                    inputBackground: 'var(--surface-100)',
                    inputText: 'var(--text-primary)',
                    inputBorder: 'var(--border-subtle)',
                    inputPlaceholder: 'var(--text-tertiary)',
                  },
                  radii: {
                    buttonRadius: '12px',
                    inputRadius: '12px',
                  },
                },
              },
            }}
            providers={['google']}
            theme="dark"
            redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
          />
        </div>
      </div>
    </div>
  );
}
