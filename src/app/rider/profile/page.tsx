'use client';

import { Shield, MapPin, Star, ChevronRight, Globe, Bell, Lock, LogOut, Heart, Users, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function RiderProfile() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const menuItems = [
    { icon: Shield, label: 'Safety', desc: 'Trusted contacts, emergency settings', color: 'var(--green-light)', href: '/rider/safety' },
    { icon: MapPin, label: 'Saved Locations', desc: 'Home, Work, and more', color: 'var(--gold)', href: '/rider/locations' },
    { icon: Heart, label: 'Favorites', desc: 'Preferred drivers', color: 'var(--ruby)', href: '/rider/favorites' },
    { icon: Globe, label: 'Language', desc: 'English (South Africa)', color: 'var(--sky)', href: '/settings' },
    { icon: Bell, label: 'Notifications', desc: 'Trip updates, promotions', color: 'var(--purple)', href: '/notifications' },
    { icon: Users, label: 'Refer a Friend', desc: 'Earn R50 for each referral', color: 'var(--sunset)', href: '/referral' },
    { icon: Lock, label: 'Privacy & Security', desc: 'Data sovereignty & POPIA', color: 'var(--text-secondary)', href: '/profile/privacy' },
  ];

  return (
    <div className="page-enter" style={{ padding: '16px' }}>
      {/* Profile Card */}
      <div className="card-glass" style={{
        padding: '24px', borderRadius: '20px', marginBottom: '24px',
        textAlign: 'center',
      }}>
        <div className="avatar avatar-xl" style={{ margin: '0 auto 16px', fontSize: '1.5rem', background: 'var(--primary-light)', color: 'black' }}>
          {user.name?.[0] || 'U'}
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
          {user.name}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
          {user.verification_status === 'verified' && (
            <div className="badge badge-green" style={{ fontSize: '0.7rem' }}>
              <Shield size={10} /> Verified Member
            </div>
          )}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
          padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800 }}>
              <Star size={14} style={{ color: 'var(--gold)', display: 'inline', verticalAlign: 'middle' }} /> {user.rating || 5.0}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Rating</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800 }}>{user.total_trips || 0}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Trips</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800 }}>
              {new Date(user.joined_at).getFullYear()}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Member since</div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="card-glass" style={{ padding: '16px', borderRadius: '14px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Phone size={16} style={{ color: 'var(--text-tertiary)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Phone</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.phone || 'Not set'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Mail size={16} style={{ color: 'var(--text-tertiary)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Email</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.email}</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
        {menuItems.map((item: any, i) => (
          <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 16px', borderRadius: '14px',
              background: 'transparent', width: '100%',
              color: 'var(--text-primary)', textAlign: 'left',
              transition: 'background 0.15s ease', border: 'none', cursor: 'pointer'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '11px',
                background: `${item.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.desc}</div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button 
        className="btn btn-ghost" 
        onClick={() => signOut()}
        style={{
          width: '100%', justifyContent: 'center', gap: '8px',
          color: 'var(--ruby)', padding: '14px',
        }}
      >
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
}
