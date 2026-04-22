'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Smartphone, WifiOff, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          background: '#0a0a0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div className="card-glass" style={{ maxWidth: '400px', padding: '40px', borderRadius: '32px' }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: '20px', background: 'rgba(235,64,52,0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
            }}>
               <AlertCircle size={32} color="var(--ruby)" />
            </div>
            
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px' }}>Platform Disruption</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '32px' }}>
              Mzansi Ride encountered an unexpected operational error. Your data is safe and stored locally on your device.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <button 
                 onClick={() => window.location.reload()}
                 className="btn btn-primary"
                 style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
               >
                  <RefreshCw size={18} /> Retry Connection
               </button>
               
               <button 
                 onClick={() => window.location.href = '/'}
                 className="btn btn-ghost"
                 style={{ width: '100%', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)' }}
               >
                  <Home size={18} /> Return Home (Offline)
               </button>
            </div>

            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
               <WifiOff size={20} color="var(--text-tertiary)" />
               <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Our offline-first engine is active. You can still access your wallet and safety tools.
               </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
