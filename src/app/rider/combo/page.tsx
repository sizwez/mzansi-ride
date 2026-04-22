'use client';

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Car, 
  Bus, 
  Package, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { SyncService } from '@/services/api';
import { formatCurrency } from '@/lib/fare-calculator';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ComboBooking() {
  const router = useRouter();
  const { user } = useAuth();
  const [legs, setLegs] = useState([
    { id: 1, type: 'TAXI', pickup_address: 'Home (Soweto)', pickup_lat: -26.2, pickup_lng: 27.8, dropoff_address: 'Bree Street Rank', dropoff_lat: -26.2007, dropoff_lng: 28.0374, fare: 25, vehicle_type: 'economy' },
    { id: 2, type: 'RIDE', pickup_address: 'Bree Street Rank', pickup_lat: -26.2007, pickup_lng: 28.0374, dropoff_address: 'Sandton City', dropoff_lat: -26.1076, dropoff_lng: 28.0567, fare: 120, vehicle_type: 'comfort' }
  ]);

  const [booking, setBooking] = useState(false);

  const totalFare = legs.reduce((sum, leg) => sum + leg.fare, 0);
  const bundleDiscount = totalFare * 0.1; // 10% Bundle Discount

  const handleBook = async () => {
    if (!user) return;
    setBooking(true);
    try {
      const result = await SyncService.createComboBooking(user.id, legs);
      router.push(`/rider?journeyId=${result.parent.id}`);
    } catch (err) {
      console.error('Booking failed:', err);
      alert('Failed to coordinate your multi-modal journey. Please check your wallet balance.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '16px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap color="black" size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Multi-Modal Sync</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Coordinate your entire journey in one sync.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 1fr', gap: '32px' }}>
        {/* Journey Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Journey Timeline</h2>
             <button className="btn btn-ghost" style={{ fontSize: '0.875rem', color: 'var(--gold)', gap: '8px' }}>
               <Plus size={16} /> Add Leg
             </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
             {/* The vertical line connectiing stops */}
             <div style={{ position: 'absolute', left: '23px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(255,255,255,0.05)' }} />

             {legs.map((leg, index) => (
                <div key={leg.id} className="card-glass" style={{ marginBottom: '16px', marginLeft: '0px', padding: '20px', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
                   {/* Stop Indicator */}
                   <div style={{ position: 'absolute', left: '-25px', top: '24px', width: '12px', height: '12px', borderRadius: '50%', background: index === 0 ? 'var(--gold)' : 'white', border: '4px solid #0a0a0b', zIndex: 1 }} />
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                         <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {leg.type === 'TAXI' ? <Bus size={20} /> : <Car size={20} />}
                         </div>
                         <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Leg {index + 1}: {leg.type === 'TAXI' ? 'Taxi Rank Transfer' : 'Private Ride Sync'}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <MapPin size={12} /> {leg.pickup_address} &rarr; {leg.dropoff_address}
                            </div>
                         </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontWeight: 700 }}>{formatCurrency(leg.fare)}</div>
                         <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{leg.vehicle_type}</div>
                      </div>
                   </div>

                   {index < legs.length - 1 && (
                      <div style={{ margin: '16px 0 0 56px', padding: '12px', background: 'rgba(244,169,0,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <TrendingUp size={14} color="var(--gold)" />
                         <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>Sync Point: {leg.dropoff_address}</span>
                      </div>
                   )}
                </div>
             ))}
          </div>
        </div>

        {/* Pricing & Booking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           <div className="card-glass" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '24px' }}>Journey Summary</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Standard Fares</span>
                    <span>{formatCurrency(totalFare)}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--emerald)' }}>
                    <span>Multi-modal Bundle (10%)</span>
                    <span>-{formatCurrency(bundleDiscount)}</span>
                 </div>
                 <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                    <span>Total Fare</span>
                    <span style={{ color: 'var(--gold)' }}>{formatCurrency(totalFare - bundleDiscount)}</span>
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <ShieldCheck size={14} color="var(--emerald)" /> 
                    Seamless hand-off guaranteed at Rank
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <ShieldCheck size={14} color="var(--emerald)" /> 
                    Integrated parcel sync included
                 </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', height: '56px', fontSize: '1.125rem', fontWeight: 800, background: 'var(--gold)', color: 'black', gap: '12px' }}
                onClick={handleBook}
                disabled={booking}
              >
                {booking ? 'Synchronizing...' : 'Book Multi-Modal Journey'}
                {!booking && <ArrowRight size={20} />}
              </button>
           </div>

           {/* Safety Note */}
           <div style={{ padding: '20px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                 <Zap size={16} color="var(--emerald)" />
                 <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--emerald)' }}>Smart Hand-off</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your next driver will be notified 5 minutes before you arrive at the transition rank. No waiting, just sync.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
