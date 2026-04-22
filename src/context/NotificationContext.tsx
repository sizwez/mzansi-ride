'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Bell, X, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { NotificationService } from '@/services/api';
import { IDBManager } from '@/lib/idb-manager';

type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'trip_status' | 'payment' | 'governance' | 'system' | 'verification';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read?: boolean;
  created_at?: string;
}

interface NotificationContextType {
  showNotification: (n: Omit<Notification, 'id'>) => void;
  showToast: (message: string, type?: NotificationType, title?: string) => void;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [persistentNotifications, setPersistentNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback(({ type, title, message }: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type: type as any, title, message }]);
    
    // Auto remove toast after 5s
    setTimeout(() => {
      setToasts(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const showToast = useCallback((message: string, type: NotificationType = 'info', title?: string) => {
    showNotification({
      type,
      title: title || type.toUpperCase(),
      message
    });
  }, [showNotification]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await NotificationService.getNotifications(user.id);
      setPersistentNotifications(data as any);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setPersistentNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

      if (!navigator.onLine) {
        // Queue for background sync
        const sessionStr = localStorage.getItem('sb-yivizlvthptubshgajwi-auth-token');
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        
        await IDBManager.addAction({
          type: 'MARK_NOTIFICATION_READ',
          data: { notificationId: id },
          userId: user?.id || '',
          timestamp: Date.now(),
          authToken: session?.access_token || '',
        });

        // Register sync
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          await (registration as any).sync.register('mzansi-sync');
        }
        return;
      }

      await NotificationService.markAsRead(id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      // Optimistic update
      setPersistentNotifications(prev => prev.map(n => ({ ...n, read: true })));

      if (!navigator.onLine) {
        // For "Mark All", we'll queue individual reads for now to match the SW logic
        const unreadIds = persistentNotifications.filter(n => !n.read).map(n => n.id);
        const sessionStr = localStorage.getItem('sb-yivizlvthptubshgajwi-auth-token');
        const session = sessionStr ? JSON.parse(sessionStr) : null;

        for (const id of unreadIds) {
          await IDBManager.addAction({
            type: 'MARK_NOTIFICATION_READ',
            data: { notificationId: id },
            userId: user.id,
            timestamp: Date.now(),
            authToken: session?.access_token || '',
          });
        }

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          await (registration as any).sync.register('mzansi-sync');
        }
        return;
      }

      await NotificationService.markAllAsRead(user.id);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(n => n.id !== id));
  };

  // GLOBAL REAL-TIME LISTENERS
  useEffect(() => {
    if (!user) {
      setPersistentNotifications([]);
      return;
    }

    fetchNotifications();

    // Listen for NEW notifications in the database
    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotif = payload.new as Notification;
          setPersistentNotifications(prev => [newNotif, ...prev]);
          showNotification({
            type: newNotif.type as any,
            title: newNotif.title,
            message: newNotif.message,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Notification;
          setPersistentNotifications(prev => 
            prev.map(n => n.id === updated.id ? updated : n)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications, showNotification]);

  const unreadCount = persistentNotifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      showToast,
      notifications: persistentNotifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead 
    }}>
      {children}
      
      {/* Toast Render Area */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
        maxWidth: '360px',
        width: 'calc(100% - 48px)',
      }}>
        {toasts.map((n) => (
          <div key={n.id} className="animate-slide-up" style={{
            background: 'var(--surface-100)',
            border: `1px solid var(--border-medium)`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            gap: '12px',
            pointerEvents: 'auto',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
              background: n.type === 'success' || n.type === 'trip_status' ? 'rgba(52,211,153,0.1)' : 
                         n.type === 'warning' ? 'rgba(244,169,0,0.1)' : 
                         'rgba(56,189,248,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {n.type === 'success' || n.type === 'trip_status' ? <CheckCircle size={20} color="var(--emerald)" /> :
               n.type === 'warning' ? <AlertTriangle size={20} color="var(--gold)" /> :
               <Bell size={20} color="var(--sky)" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '2px' }}>{n.title}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
            </div>
            <button 
              onClick={() => removeToast(n.id)}
              style={{
                width: 24, height: 24, borderRadius: '50%', border: 'none',
                background: 'transparent', color: 'var(--text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
