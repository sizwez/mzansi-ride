'use client';

import React from 'react';
import { useNotification } from '@/context/NotificationContext';
import { Bell, Check, Trash2, X, Clock, Info, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationInboxProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationInbox({ isOpen, onClose }: NotificationInboxProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trip_status': return <CheckCircle size={18} color="var(--emerald)" />;
      case 'payment': return <CheckCircle size={18} color="var(--gold)" />;
      case 'governance': return <MessageSquare size={18} color="var(--sky)" />;
      case 'warning': return <AlertTriangle size={18} color="var(--sunset)" />;
      default: return <Info size={18} color="var(--text-tertiary)" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)', zIndex: 1000,
        }} 
      />

      {/* Drawer */}
      <div className="animate-slide-left" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '400px',
        background: 'var(--surface-50)', borderLeft: '1px solid var(--border-subtle)',
        zIndex: 1001, display: 'flex', flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface-100)',
        }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>Notifications</h3>
            {unreadCount > 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>
                {unreadCount} unread messages
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-tertiary)',
                  cursor: 'pointer', padding: '8px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Mark all as read"
              >
                <Check size={20} />
              </button>
            )}
            <button 
              onClick={onClose}
              style={{
                background: 'var(--surface-200)', border: 'none', color: 'var(--text-primary)',
                cursor: 'pointer', padding: '8px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {notifications.length === 0 ? (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)',
              textAlign: 'center', padding: '40px',
            }}>
              <Bell size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p style={{ fontWeight: 600 }}>All caught up!</p>
              <p style={{ fontSize: '0.8125rem' }}>Your notification history will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  style={{
                    padding: '16px', borderRadius: '16px',
                    background: n.read ? 'transparent' : 'rgba(244,169,0,0.05)',
                    border: `1px solid ${n.read ? 'transparent' : 'rgba(244,169,0,0.2)'}`,
                    cursor: 'pointer', position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: 'var(--surface-200)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {getTypeIcon(n.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ 
                          fontSize: '0.875rem', fontWeight: n.read ? 600 : 800, 
                          color: 'var(--text-primary)', marginBottom: '2px' 
                        }}>
                          {n.title}
                        </h4>
                        {!n.read && (
                          <div style={{ 
                            width: 8, height: 8, borderRadius: '50%', 
                            background: 'var(--gold)', marginTop: '6px' 
                          }} />
                        )}
                      </div>
                      <p style={{ 
                        fontSize: '0.8125rem', color: 'var(--text-secondary)',
                        lineHeight: 1.4, marginBottom: '8px'
                      }}>
                        {n.message}
                      </p>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '0.6875rem', color: 'var(--text-tertiary)'
                      }}>
                        <Clock size={12} />
                        {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : 'Recently'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
