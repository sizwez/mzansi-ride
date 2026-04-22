'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudSync, CheckCircle2 } from 'lucide-react';
import { IDBManager } from '@/lib/idb-manager';

export default function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      setShowStatus(true);
      
      // Give the SW a moment to start processing
      setTimeout(async () => {
        const actions = await IDBManager.getActions();
        setPendingCount(actions.length);
        if (actions.length === 0) setIsSyncing(false);
      }, 2000);

      // Hide after 5 seconds of being online
      setTimeout(() => setShowStatus(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for pending items
    IDBManager.getActions().then(actions => {
      setPendingCount(actions.length);
      if (actions.length > 0) setShowStatus(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus && pendingCount === 0 && isOnline) return null;

  return (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 20px',
        borderRadius: '30px',
        background: isOnline ? (isSyncing ? 'var(--sky)' : 'var(--emerald)') : 'var(--ruby)',
        color: isOnline ? 'black' : 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        fontSize: '0.8125rem',
        fontWeight: 700,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {!isOnline ? (
        <>
          <WifiOff size={16} />
          <span>Offline Mode. 100% Reliable Local Storage Active.</span>
        </>
      ) : isSyncing ? (
        <>
          <CloudSync size={16} className="animate-spin" />
          <span>Syncing {pendingCount} offline actions...</span>
        </>
      ) : (
        <>
          <CheckCircle2 size={16} />
          <span>Network Restored. All actions synced.</span>
        </>
      )}
    </div>
  );
}
