'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Navigation, DollarSign, Users, Car, Bell } from 'lucide-react';
import NotificationInbox from '@/components/NotificationInbox';
import { useNotification } from '@/context/NotificationContext';

const navItems = [
  { href: '/driver', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/driver/earnings', icon: DollarSign, label: 'Earnings' },
  { href: '/driver/cooperative', icon: Users, label: 'Co-Op' },
  { href: '/driver/vehicle', icon: Car, label: 'Vehicle' },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const { unreadCount } = useNotification();

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '70px', background: 'var(--bg-primary)' }}>
      <NotificationInbox isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} />

      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '12px 16px',
        background: 'rgba(10, 14, 26, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '10px',
            background: 'var(--gradient-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Navigation size={17} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--green-light)' }}>
            Co-Mo Driver
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setIsInboxOpen(true)}
            style={{
              background: 'var(--surface-200)', border: 'none', color: 'var(--text-primary)',
              width: 36, height: 36, borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
              transition: 'all 0.2s ease',
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                width: 18, height: 18, borderRadius: '50%',
                background: 'var(--gold)', color: '#000',
                fontSize: '0.625rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--surface-50)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="badge badge-green" style={{ fontSize: '0.7rem' }}>
            Co-Owner
          </div>
        </div>
      </header>

      {children}

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
