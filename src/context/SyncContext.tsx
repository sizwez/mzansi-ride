'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { IDBManager, SyncAction } from '@/lib/idb-manager';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

interface SyncContextType {
  enqueueAction: (type: string, data: any) => Promise<void>;
  isSyncing: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const enqueueAction = useCallback(async (type: string, data: any) => {
    if (!user) return;

    // 1. Get the current auth session to include the token
    // Note: In a production app, you might want to fetch it fresh from supabase.auth.getSession()
    const sessionStr = localStorage.getItem('sb-yivizlvthptubshgajwi-auth-token'); 
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    const authToken = session?.access_token || '';

    const action: Omit<SyncAction, 'id'> = {
      type,
      data,
      userId: user.id,
      timestamp: Date.now(),
      authToken,
    };

    try {
      await IDBManager.addAction(action);
      
      // 2. Register for Background Sync if supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('mzansi-sync');
      }

      showToast('Action queued for offline sync', 'info');
      console.log(`[Sync] Action queued: ${type}`);
    } catch (err) {
      console.error('[Sync] Failed to enqueue action:', err);
      showToast('Offline action failed to queue', 'error');
    }
  }, [user, showToast]);

  return (
    <SyncContext.Provider value={{ enqueueAction, isSyncing: false }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
