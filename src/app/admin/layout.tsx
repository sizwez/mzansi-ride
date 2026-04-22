'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Car, Shield, TrendingUp, Settings, Globe, Bell, LogOut, Banknote, ShieldAlert, Navigation } from 'lucide-react';
import NotificationInbox from '@/components/NotificationInbox';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

const sidebarItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/drivers', icon: Car, label: 'Drivers' },
  { href: '/admin/riders', icon: Users, label: 'Riders' },
  { href: '/admin/safety', icon: Shield, label: 'Safety' },
  { href: '/admin/financials', icon: Banknote, label: 'Financials' },
  { href: '/admin/cooperative', icon: Globe, label: 'Cooperative' },
  { href: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { unreadCount } = useNotification();

  useEffect(() => {
    if (!loading) {
      if (!user || role !== 'admin') {
        setIsAuthorized(false);
        setTimeout(() => router.push('/'), 3000);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, role, loading, router]);

  if (loading || isAuthorized === null) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', color: 'var(--gold)'
      }}>
        <Navigation className="animate-pulse" size={48} />
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '24px', background: 'var(--bg-primary)'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
        }}>
          <ShieldAlert size={40} color="var(--ruby)" />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
          Restricted Access
        </h1>
        <p style={{ color: 'var(--text-tertiary)', maxWidth: '300px' }}>
          This zone is reserved for Cooperative Administrators only. Redirecting you home...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <NotificationInbox isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} />
      
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '32px', textDecoration: 'none',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-inverse)',
          }}>
            C
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Co-Mo Admin
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Management Portal</div>
          </div>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link href="#" className="sidebar-link">
            <Settings size={18} /> Settings
          </Link>
          <button className="sidebar-link" style={{ width: '100%', color: 'var(--ruby)' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        {/* Top Bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              {sidebarItems.find(i => i.href === pathname)?.label || 'Admin'}
            </h1>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setIsInboxOpen(true)}
              style={{
                position: 'relative', width: 40, height: 40, borderRadius: '10px',
                background: 'var(--surface-200)', border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', transition: 'all 0.2s',
                cursor: 'pointer',
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-3px', right: '-3px',
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--ruby)', border: '2px solid var(--bg-primary)',
                  fontSize: '0.5625rem', fontWeight: 700, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="avatar" style={{ background: 'var(--gradient-gold)', color: 'var(--text-inverse)', fontWeight: 700 }}>
              AD
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
