'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const userId = session.user.id;
        
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (error || !profile) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, role: 'rider' }])
            .select('role')
            .single();
          
          if (createError) {
            console.error('Failed to create profile:', createError);
            router.push('/login');
            return;
          }
          
          profile = newProfile;
        }
        
        if (profile?.role === 'driver') router.push('/driver');
        else if (profile?.role === 'admin') router.push('/admin');
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
