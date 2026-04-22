'use client';

import { useState } from 'react';
import { 
  Book, 
  Search, 
  HelpCircle, 
  ShieldCheck, 
  TrendingUp, 
  Scale, 
  Heart,
  ChevronRight,
  ArrowLeft,
  LifeBuoy
} from 'lucide-react';
import Link from 'next/link';

const SECTIONS = [
  {
    id: 'ownership',
    title: 'Shared Ownership',
    icon: TrendingUp,
    color: 'var(--gold)',
    content: 'Mzansi Ride is not just a platform; it is your business. Every trip contributes to your "Member Equity." As you drive or ride, you earn a stake in the cooperative. For drivers, this means a path to owning your vehicle 100% through our Rent-to-Own equity engine.'
  },
  {
    id: 'democracy',
    title: 'Liquid Democracy',
    icon: Scale,
    color: 'var(--sky)',
    content: 'We use Liquid Democracy to make decisions. You can vote directly on cooperative proposals or delegate your vote to a trusted member (a Delegate) who has expertise in finance, safety, or operations. You can revoke your delegation at any time.'
  },
  {
    id: 'safety',
    title: 'Zero-Distance Safety',
    icon: ShieldCheck,
    color: 'var(--emerald)',
    content: 'Our safety protocol is community-led. The SOS button triggers alerts to nearby members and the regional dispatch. All disputes are handled by the Community Court—a panel of your peers who ensure justice is fair and cultural context is respected.'
  },
  {
    id: 'stokvel',
    title: 'Phakamisa Fund',
    icon: Heart,
    color: 'var(--ruby)',
    content: 'Members contribute to the Phakamisa Fund, our modern digital Stokvel. This fund provides a safety net for medical emergencies, funeral policies, and educational support for members families. It is your collective insurance policy.'
  }
];

export default function MemberHandbook() {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<typeof SECTIONS[0] | null>(null);

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
         <Link href="/rider" className="btn-icon">
            <ArrowLeft size={20} />
         </Link>
         <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Member Handbook</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>The Constitution of the Cooperative</p>
         </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '32px' }}>
         <Search style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-tertiary)' }} size={18} />
         <input 
            type="text" 
            placeholder="Search our principles, rules or guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
               width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', 
               background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' 
            }}
         />
      </div>

      {/* Grid of Knowledge */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
         {SECTIONS.filter(s => s.title.toLowerCase().includes(search.toLowerCase())).map((section) => (
            <div 
              key={section.id} 
              className="card-glass hover-scale" 
              style={{ padding: '24px', cursor: 'pointer' }}
              onClick={() => setActiveSection(section)}
            >
               <div style={{ 
                 width: 48, height: 48, borderRadius: '16px', background: `${section.color}15`, 
                 display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' 
               }}>
                  <section.icon size={24} color={section.color} />
               </div>
               <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '12px' }}>{section.title}</h3>
               <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {section.content}
               </p>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '16px', color: section.color, fontSize: '0.75rem', fontWeight: 700 }}>
                  Read Chapter <ChevronRight size={14} />
               </div>
            </div>
         ))}
      </div>

      {/* Support Section */}
      <div className="card-glass" style={{ padding: '32px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
         <LifeBuoy size={32} color="var(--sky)" style={{ margin: '0 auto 16px' }} />
         <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>Need more clarity?</h4>
         <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
            Our regional marshals are available 24/7 to explain any part of the cooperative bylaws.
         </p>
         <button className="btn btn-primary" style={{ padding: '12px 32px' }}>
            Speak to a Marshal
         </button>
      </div>

      {/* Section Modal (Simplified for demo) */}
      {activeSection && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' 
        }}>
           <div className="card-glass" style={{ maxWidth: '500px', padding: '40px', position: 'relative' }}>
              <button 
                onClick={() => setActiveSection(null)} 
                style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                 <ArrowLeft size={24} />
              </button>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '20px' }}>{activeSection.title}</h2>
              <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>{activeSection.content}</p>
           </div>
        </div>
      )}

    </div>
  );
}
