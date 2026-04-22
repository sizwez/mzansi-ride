'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, Users, Shield, TrendingUp, ChevronRight, Star, MapPin, Wallet, Heart, ArrowRight, Zap, Globe, Lock, Languages } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState(0);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const metrics = [
    { value: '15,420+', label: 'Active Riders', icon: Users },
    { value: '1,847', label: 'Driver-Owners', icon: Car },
    { value: '4.7★', label: 'Average Rating', icon: Star },
    { value: 'R0', label: 'Surge Pricing', icon: Zap },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Identity',
      desc: 'Blockchain-backed digital credentials for every driver and rider. Know who you\'re riding with.',
      color: 'var(--green-light)',
    },
    {
      icon: Wallet,
      title: 'Fair, Fixed Fares',
      desc: 'No surge pricing, ever. Transparent rates calculated upfront — what you see is what you pay.',
      color: 'var(--gold)',
    },
    {
      icon: Heart,
      title: 'Driver Ownership',
      desc: 'Drivers are co-owners with shares, benefits, medical aid, funeral policies, and retirement plans.',
      color: 'var(--ruby)',
    },
    {
      icon: Globe,
      title: 'Community Powered',
      desc: 'Partnered with taxi associations and local communities. Profits stay in South Africa.',
      color: 'var(--sky)',
    },
    {
      icon: Lock,
      title: 'Safety First',
      desc: 'Panic buttons, trip sharing, real-time monitoring, and community oversight for every trip.',
      color: 'var(--purple)',
    },
    {
      icon: MapPin,
      title: 'Multi-Modal Travel',
      desc: 'Seamlessly combine Co-Mo rides with public transport for the most efficient journey.',
      color: 'var(--sunset)',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMetric(prev => (prev + 1) % metrics.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [metrics.length]);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(244,169,0,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(0,104,71,0.06) 0%, transparent 50%)',
      }} />

      {/* Navigation */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 24px',
        background: 'rgba(10, 14, 26, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-gold)',
          }}>
            <Car size={22} color="#0A0E1A" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span className="text-gradient-gold">Co-Mo</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="btn btn-ghost btn-sm" style={{ gap: '6px', textTransform: 'uppercase', fontSize: '0.75rem' }}
            >
              <Languages size={14} /> {language}
            </button>
            {showLanguageDropdown && (
              <div className="card-glass" style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                padding: '8px', minWidth: '120px', zIndex: 1000,
                display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                {[
                  { code: 'en', label: 'English' },
                  { code: 'zu', label: 'isiZulu' },
                  { code: 'xh', label: 'isiXhosa' },
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code as any); setShowLanguageDropdown(false); }}
                    style={{
                      padding: '8px 12px', background: language === l.code ? 'rgba(244,169,0,0.1)' : 'transparent',
                      border: 'none', borderRadius: '8px', color: 'white', textAlign: 'left',
                      fontSize: '0.8125rem', cursor: 'pointer'
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/rider" className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
            {t('home')}
          </Link>
          <Link href="/directory" className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
            {t('directory')}
          </Link>
          <Link href="/admin" className="btn btn-primary btn-sm">
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <div className="animate-fade-up" style={{ maxWidth: '800px' }}>
          <div className="badge badge-gold" style={{ marginBottom: '24px', fontSize: '0.8125rem', padding: '6px 16px' }}>
            🇿🇦 South Africa&apos;s Third Way Transport
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 800, lineHeight: 1.1, marginBottom: '24px',
            letterSpacing: '-0.03em',
          }}>
            {language === 'zu' ? 'Hamba Kangcono.' : language === 'xh' ? 'Hamba Ngcono.' : 'Ride Better.'}<br />
            <span className="text-gradient-gold">
              {language === 'zu' ? 'Yiba Ngumnikazi.' : language === 'xh' ? 'Vula Ubunini.' : 'Own the Platform.'}
            </span>
          </h1>
          <p style={{
            fontSize: '1.125rem', color: 'var(--text-secondary)',
            maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.7,
          }}>
            {language === 'zu' 
              ? 'I-Co-Mo iyinkundla yokuhamba lapho abashayeli bengabanikazi, imali yokugibela ilungile, kanti ukuphepha kwakhiwe phezu kokwethenjwa.' 
              : language === 'xh'
              ? 'I-Co-Mo liqonga lokuhamba apho abaqhubi bangabanini, imali yokuhamba ilungile, kwaye ukhuseleko lwakhelwe phezu kwentembeko.'
              : 'Co-Mo is the cooperative mobility platform where drivers are owners, fares are fair, and safety is built on trust — not just technology.'}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/rider" className="btn btn-primary btn-lg" style={{ minWidth: '180px' }}>
              {t('bookNow')} <ArrowRight size={18} />
            </Link>
            <Link href="/auth/signup" className="btn btn-secondary btn-lg" style={{ minWidth: '180px' }}>
              {t('verify')} <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="animate-fade-up" style={{
          marginTop: '80px', display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
          maxWidth: '800px', width: '100%',
        }}>
          {metrics.map((m, i) => (
            <div key={i} className="card" style={{
              textAlign: 'center', padding: '20px 16px',
              borderColor: activeMetric === i ? 'var(--border-gold)' : undefined,
              transition: 'all 0.3s ease',
              transform: activeMetric === i ? 'translateY(-4px)' : undefined,
              boxShadow: activeMetric === i ? 'var(--shadow-gold)' : undefined,
            }}>
              <m.icon size={20} style={{ color: 'var(--gold)', margin: '0 auto 8px' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
                {m.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '80px 24px', position: 'relative', zIndex: 1,
        background: 'linear-gradient(180deg, transparent 0%, rgba(244,169,0,0.02) 50%, transparent 100%)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="badge badge-green" style={{ marginBottom: '16px' }}>Why Co-Mo</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '16px' }}>
              Better Than Both
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
              Not a taxi. Not an Uber. Something better — built by the community, for the community.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
          }}>
            {features.map((f, i) => (
              <div key={i} className="card stagger-children" style={{
                padding: '32px', cursor: 'default',
                animationDelay: `${i * 0.1}s`,
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: `${f.color}15`, border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '20px',
                }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Selector Section */}
      <section style={{ padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
              Get Started
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Choose your journey</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              {
                href: '/rider', icon: MapPin, title: 'Rider App',
                desc: 'Book rides, manage your wallet, and travel safely.',
                gradient: 'linear-gradient(135deg, rgba(244,169,0,0.1) 0%, rgba(244,169,0,0.02) 100%)',
                borderColor: 'rgba(244,169,0,0.3)',
                iconColor: 'var(--gold)',
              },
              {
                href: '/driver', icon: Car, title: 'Driver App',
                desc: 'Earn fair income, manage your cooperative membership.',
                gradient: 'linear-gradient(135deg, rgba(0,168,107,0.1) 0%, rgba(0,168,107,0.02) 100%)',
                borderColor: 'rgba(0,168,107,0.3)',
                iconColor: 'var(--green-light)',
              },
              {
                href: '/admin', icon: TrendingUp, title: 'Admin Portal',
                desc: 'Monitor operations, manage drivers, and view analytics.',
                gradient: 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(56,189,248,0.02) 100%)',
                borderColor: 'rgba(56,189,248,0.3)',
                iconColor: 'var(--sky)',
              },
            ].map((item, i) => (
              <Link key={i} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{
                  padding: '40px 32px', textAlign: 'center',
                  background: item.gradient, borderColor: item.borderColor,
                  cursor: 'pointer', height: '100%',
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '20px',
                    background: `${item.iconColor}15`, border: `1px solid ${item.iconColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}>
                    <item.icon size={28} style={{ color: item.iconColor }} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>{item.desc}</p>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    color: item.iconColor, fontSize: '0.875rem', fontWeight: 600,
                  }}>
                    Enter <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px', borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '8px',
            background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Car size={16} color="#0A0E1A" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }} className="text-gradient-gold">Co-Mo</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          Cooperative Mobility © 2026 — Built with ❤️ in South Africa
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Empowering drivers. Connecting communities. Moving forward together.
        </p>
      </footer>
    </div>
  );
}
