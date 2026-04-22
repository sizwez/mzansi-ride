'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Fetch role to redirect correctly
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (data?.role === 'driver') router.push('/driver');
        else if (data?.role === 'admin') router.push('/admin');
        else router.push('/rider');
      } else {
        router.push('/login');
      }
    });
  }, [router]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--gold)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <div style={{ fontWeight: 600 }}>Finalizing authentication...</div>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
