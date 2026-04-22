'use client';

import { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  Shield, 
  Coins, 
  Scale, 
  Home,
  CheckCircle2
} from 'lucide-react';
import { IdentityService } from '@/services/api';

const STEPS = [
  {
    title: "Welcome to Mzansi Ride",
    desc: "You are now a co-owner of this mobility ecosystem. We've built this together to ensure wealth stays within our community.",
    icon: Home,
    color: 'var(--sky)'
  },
  {
    title: "Zero-Distance Safety",
    desc: "The SOS button is your direct link to nearby members. In an emergency, our community is the first to arrive. Safety is everyone's business.",
    icon: Shield,
    color: 'var(--emerald)'
  },
  {
    title: "The Phakamisa Fund",
    desc: "Your wallet is linked to the cooperative fund. We pool resources to provide medical, funeral, and educational support for all members.",
    icon: Coins,
    color: 'var(--gold)'
  },
  {
    title: "Democratic Power",
    desc: "You have an equal vote in how this cooperative is run. Use your voting power to decide on new investments or policy changes.",
    icon: Scale,
    color: 'var(--purple)'
  }
];

export default function WelcomeTour({ userId, onComplete }: { userId: string, onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        await IdentityService.updatePrivacySettings(userId, { onboarding_completed: true });
        onComplete();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const current = STEPS[step];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div className="card-glass page-enter" style={{ maxWidth: '440px', padding: '40px', borderRadius: '32px', textAlign: 'center' }}>
         <div style={{ 
           width: 64, height: 64, borderRadius: '22px', background: `${current.color}15`, 
           display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
         }}>
            <current.icon size={32} color={current.color} />
         </div>

         <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '16px' }}>{current.title}</h2>
         <p style={{ fontSize: '0.9375rem', color: 'var(--text-tertiary)', lineHeight: 1.6, marginBottom: '40px' }}>
            {current.desc}
         </p>

         {/* Pagination dots */}
         <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '40px' }}>
            {STEPS.map((_, i) => (
               <div key={i} style={{ 
                 width: i === step ? 20 : 6, height: 6, borderRadius: 3, 
                 background: i === step ? current.color : 'rgba(255,255,255,0.1)',
                 transition: 'all 0.3s ease'
               }} />
            ))}
         </div>

         <button 
           onClick={handleNext}
           disabled={loading}
           className="btn btn-primary"
           style={{ width: '100%', justifyContent: 'center', gap: '10px', height: '56px', background: current.color, border: 'none' }}
         >
            {step === STEPS.length - 1 ? (
               <>Ready to Start <CheckCircle2 size={20} /></>
            ) : (
               <>Next <ChevronRight size={20} /></>
            )}
         </button>

         {step < STEPS.length - 1 && (
           <button onClick={onComplete} style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '0.8125rem', cursor: 'pointer' }}>
              Skip for now
           </button>
         )}
      </div>
    </div>
  );
}
