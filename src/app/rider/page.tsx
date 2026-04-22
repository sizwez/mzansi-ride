'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Search, MapPin, ChevronRight, Star, Shield, Clock, Navigation, X, Car, AlertTriangle, Phone, Trophy, Scale, Package } from 'lucide-react';
import { SA_LOCATIONS } from '@/lib/mock-data';
import { calculateFare, formatCurrency, estimateDistance, estimateDuration } from '@/lib/fare-calculator';
import type { VehicleType, Location, Driver } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { RiderService, SafetyService, RewardsService, CallService, WhatsAppService, LogisticsService, SyncService } from '@/services/api';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CallOverlay from '@/components/CallOverlay';
import WelcomeTour from '@/components/onboarding/WelcomeTour';
import { IdentityService, MonitoringService } from '@/services/api';

const VEHICLE_OPTIONS: { type: VehicleType; label: string; icon: string; desc: string }[] = [
  { type: 'economy', label: 'Economy', icon: '🚗', desc: 'Affordable & reliable' },
  { type: 'comfort', label: 'Comfort', icon: '🚙', desc: 'Extra space & comfort' },
  { type: 'xl', label: 'XL', icon: '🚐', desc: 'Groups up to 7' },
];

export default function RiderHome() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [pickup, setPickup] = useState<Location | null>(null);
  const [dropoff, setDropoff] = useState<Location | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('economy');
  const [step, setStep] = useState<'idle' | 'search' | 'confirm' | 'matching' | 'matched'>('idle');
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [matchedDriver, setMatchedDriver] = useState<any | null>(null);
  const [driverPositions, setDriverPositions] = useState<Record<string, any>>({});
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const matchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [rewards, setRewards] = useState<{ balance: number; history: any[] } | null>(null);
  const [serviceType, setServiceType] = useState<'RIDE' | 'PARCEL'>('RIDE');
  const [parcelDetails, setParcelDetails] = useState({ size: 'small', description: '', recipientName: '', recipientPhone: '' });
  const [parcelOtp, setParcelOtp] = useState<string | null>(null);
  const [isSosTriggered, setIsSosTriggered] = useState(false);
  const searchParams = useSearchParams();
  const journeyId = searchParams.get('journeyId');
  const [journey, setJourney] = useState<any>(null);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (user) {
      // Check onboarding status
      if (!user.onboarding_completed) {
        setShowTour(true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      RewardsService.getPoints(user.id).then(setRewards);
    }
  }, [user]);

  useEffect(() => {
    if (journeyId) {
      SyncService.getJourneyStatus(journeyId).then(setJourney);
      // Poll for journey updates
      const interval = setInterval(() => {
        SyncService.getJourneyStatus(journeyId).then(setJourney);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [journeyId]);

  const handlePrivateCall = async () => {
    if (!matchedDriver) return;
    await CallService.initiatePrivateCall(matchedDriver.id);
    setIsCallOpen(true);
  };

  const handleWhatsAppShare = () => {
    if (!matchedDriver || !pickup || !dropoff) return;
    const link = WhatsAppService.generateTripShareLink({
      driverName: matchedDriver.name,
      vehiclePlate: matchedDriver.vehicle.plateNumber,
      destination: dropoff.name,
      liveLocationUrl: 'https://mzansijourney.co.za/track/' + activeTripId,
      shieldStatus: 'ACTIVE (Co-op Verified)'
    });
    window.open(link, '_blank');
  };

  const handleTriggerSOS = async () => {
    if (!user) return;
    try {
      setIsSosTriggered(true);
      const lat = pickup?.lat || -26.2041;
      const lng = pickup?.lng || 28.0473;
      
      await SafetyService.triggerSOS(user.id, activeTripId, lat, lng);
      
      // Fallback fallback: WhatsApp alert
      const route = dropoff?.name || 'Current Trip';
      const link = WhatsAppService.generateSOSAlertLink(route);
      window.open(link, '_blank');
      
      alert('🚨 PANIC ALERT TRIGGERED. The cooperative dispatch and nearby members have been notified.');
    } catch (err) {
      console.error('SOS Trigger failed:', err);
      alert('Emergency signal failed to broadcast. Please use WhatsApp fallback or call 10111.');
    }
  };

  useEffect(() => {
    // REAL-TIME: Listen for live driver location broadcasts
    const channel = supabase.channel('driver_locations')
      .on('broadcast', { event: 'location' }, (payload: any) => {
        const { driverId, lat, lng } = payload.payload;
        setDriverPositions(prev => ({
          ...prev,
          [driverId]: { lat, lng, timestamp: Date.now() }
        }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const [approachingDriverPos, setApproachingDriverPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (step === 'matched' && matchedDriver && pickup) {
      // Simulate driver starting 1km away
      let startLat = pickup.lat + 0.008;
      let startLng = pickup.lng + 0.008;
      setApproachingDriverPos([startLat, startLng]);

      const interval = setInterval(() => {
        setApproachingDriverPos(prev => {
          if (!prev) return null;
          const latDiff = pickup.lat - prev[0];
          const lngDiff = pickup.lng - prev[1];
          if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
            clearInterval(interval);
            return [pickup.lat, pickup.lng];
          }
          return [
            prev[0] + latDiff * 0.05,
            prev[1] + lngDiff * 0.05
          ];
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setApproachingDriverPos(null);
    }
  }, [step, matchedDriver, pickup]);

  const fetchNearbyDrivers = async () => {
    try {
      const drivers = await RiderService.getNearbyDrivers(-26.2041, 28.0473); // Default to Jozi center
      setNearbyDrivers(drivers);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
  };

  useEffect(() => {
    if (!activeTripId) return;

    const subscription = RiderService.subscribeToTrip(activeTripId, async (updatedTrip) => {
      console.log('Trip update:', updatedTrip);
      if (updatedTrip.status === 'accepted' && updatedTrip.driver_id) {
        if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
        
        // Fetch driver details
        const { data: driver } = await supabase
          .from('profiles')
          .select('*, vehicles(*)')
          .eq('id', updatedTrip.driver_id)
          .single();
        
        setMatchedDriver(driver);
        setStep('matched');
      }
    });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeTripId]);

  const places = SA_LOCATIONS.johannesburg.places;
  const filteredPlaces = searchQuery
    ? places.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : places;

  const savedLocations = [
    { name: 'Home', icon: '🏠', location: places[2] },
    { name: 'Work', icon: '💼', location: places[0] },
  ];

  const recentTrips = [
    { dest: 'Sandton City', time: 'Yesterday, 07:15', fare: 'R259.00' },
    { dest: 'Rosebank Mall', time: 'Yesterday, 17:30', fare: 'R73.00' },
    { dest: 'OR Tambo Airport', time: 'Wed, 14:00', fare: 'R385.00' },
  ];

  const handleSelectDestination = useCallback((place: typeof places[0]) => {
    if (!pickup) {
      setPickup({ lat: places[2].lat, lng: places[2].lng, address: places[2].address, name: places[2].name });
    }
    setDropoff({ lat: place.lat, lng: place.lng, address: place.address, name: place.name });
    setStep('confirm');
    setShowSearch(false);
    setSearchQuery('');
  }, [pickup, places]);

  const handleConfirmBooking = useCallback(async () => {
    if (!user || !pickup || !dropoff) return;
    
    setStep('matching');
    
    try {
      const tripFare = calculateFare(
        estimateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng),
        estimateDuration(estimateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)),
        selectedVehicle
      );

      let trip;
      if (serviceType === 'PARCEL') {
        const result = await LogisticsService.createParcelOrder({
          rider_id: user.id,
          pickup,
          dropoff,
          vehicle_type: selectedVehicle,
          fare: tripFare,
          parcel_metadata: parcelDetails
        });
        trip = result;
        setParcelOtp(result.otp);
      } else {
        trip = await RiderService.requestTrip({
          riderId: user.id,
          pickup,
          dropoff,
          vehicleType: selectedVehicle,
          fare: tripFare,
        });
      }

      setActiveTripId(trip.id);

      // FALLBACK for demo: If no real driver accepts in 10s, simulate acceptance
      matchTimeoutRef.current = setTimeout(async () => {
        if (step === 'matching') {
          const { data: randomDriver } = await supabase
            .from('profiles')
            .select('*, vehicles(*)')
            .eq('role', 'driver')
            .limit(1)
            .single();
          
          if (randomDriver) {
            await supabase.from('trips').update({ status: 'accepted', driver_id: randomDriver.id }).eq('id', trip.id);
          }
        }
      }, 8000);

    } catch (err) {
      console.error('Booking error:', err);
      setStep('idle');
    }
  }, [user, pickup, dropoff, selectedVehicle, serviceType, parcelDetails]);

  const handleCancel = useCallback(() => {
    setStep('idle');
    setDropoff(null);
    setMatchedDriver(null);
    setActiveTripId(null);
    if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
  }, []);

  const fare = pickup && dropoff
    ? calculateFare(
        estimateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng),
        estimateDuration(estimateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)),
        selectedVehicle
      )
    : null;

  const distance = pickup && dropoff ? estimateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng) : 0;
  const duration = estimateDuration(distance);

  const [sosActive, setSosActive] = useState(false);
  const sosTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSOSStart = () => {
    sosTimerRef.current = setTimeout(async () => {
      setSosActive(true);
      try {
        await SafetyService.triggerSOS(user!.id, matchedDriver?.tripId || null, mapRiderLoc![0], mapRiderLoc![1]);
        alert('EMERGENCY ALERT SENT: Nearby drivers and the Co-op Security team have been notified.');
      } catch (err) {
        console.error('SOS Error:', err);
      }
    }, 2000); // 2 second hold
  };

  const handleSOSEnd = () => {
    if (sosTimerRef.current) {
      clearTimeout(sosTimerRef.current);
      sosTimerRef.current = null;
    }
  };

  if (!mounted) return null;

  // Prepare map data
  const mapDrivers = approachingDriverPos 
    ? [{ id: matchedDriver?.id || 'matched', lat: approachingDriverPos[0], lng: approachingDriverPos[1], rotation: 0 }]
    : nearbyDrivers.map(d => ({
        id: d.id,
        lat: d.lat || -26.2041,
        lng: d.lng || 28.0473,
        rotation: Math.random() * 360
      }));

  const mapRiderLoc: [number, number] | undefined = pickup ? [pickup.lat, pickup.lng] : [-26.2041, 28.0473];
  const mapDest: [number, number] | undefined = dropoff ? [dropoff.lat, dropoff.lng] : undefined;
  const mapRoute: [number, number][] | undefined = (pickup && dropoff) 
    ? [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]
    : undefined;

  return (
    <div className="page-enter" style={{ position: 'relative' }}>
      {/* Interactive Map */}
      <div style={{
        height: step === 'idle' ? '45vh' : '35vh',
        position: 'relative', overflow: 'hidden',
        transition: 'height 0.4s ease',
        zIndex: 0,
      }}>
        <MapView 
          center={mapRiderLoc}
          drivers={mapDrivers}
          riderLoc={mapRiderLoc}
          destination={mapDest}
          route={mapRoute}
        />

        {/* Online drivers count overlay */}
        <div style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(10,14,26,0.8)', backdropFilter: 'blur(8px)',
          padding: '8px 14px', borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.8125rem',
          zIndex: 10,
        }}>
          <span className="status-dot online" style={{ width: 6, height: 6 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{nearbyDrivers.length} drivers nearby</span>
        </div>

        {/* SOS Panic Button (Active during trips) */}
        {(step === 'matched' || step === 'accepted') && (
          <div style={{
            position: 'absolute', top: '16px', left: '16px', zIndex: 100
          }}>
            <button
              onMouseDown={handleSOSStart}
              onMouseUp={handleSOSEnd}
              onTouchStart={handleSOSStart}
              onTouchEnd={handleSOSEnd}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: sosActive ? 'var(--ruby)' : 'rgba(239,68,68,0.2)',
                border: `2px solid ${sosActive ? 'white' : 'var(--ruby)'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: sosActive ? '0 0 40px var(--ruby)' : '0 4px 20px rgba(0,0,0,0.3)',
                animation: !sosActive ? 'pulse-red 2s infinite' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: 'white',
              }}
            >
              <AlertTriangle size={24} fill={sosActive ? 'white' : 'none'} />
            </button>
            {!sosActive && (
              <div style={{
                position: 'absolute', top: '100%', left: '0', marginTop: '8px',
                background: 'rgba(10,14,26,0.8)', padding: '4px 8px', borderRadius: '8px',
                fontSize: '0.625rem', color: 'var(--ruby)', whiteSpace: 'nowrap',
                border: '1px solid rgba(239,68,68,0.3)'
              }}>
                HOLD 2S FOR SOS
              </div>
            )}
          </div>
        )}

        {/* Current Location Badge */}
        {step === 'idle' && (
          <div style={{
            position: 'absolute', bottom: '24px', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10,14,26,0.8)', padding: '6px 14px',
            borderRadius: '16px', fontSize: '0.75rem', color: 'var(--gold)',
            backdropFilter: 'blur(10px)', border: '1px solid var(--border-gold)',
            zIndex: 10, display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Navigation size={12} />
            📍 Soweto, Johannesburg
          </div>
        )}

        {/* Beta Badge */}
        <div style={{
          position: 'absolute', bottom: '16px', right: '16px',
          background: 'rgba(244,169,0,0.15)', backdropFilter: 'blur(8px)',
          padding: '4px 10px', borderRadius: '10px',
          border: '1px solid var(--border-gold)',
          color: 'var(--gold)', fontSize: '0.625rem', fontWeight: 900,
          letterSpacing: '1px', textTransform: 'uppercase',
          zIndex: 10,
        }}>
          Cooperative Beta
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 16px', marginTop: '-24px', position: 'relative', zIndex: 10 }}>
        {/* Multi-Modal Journey Tracking Overlay */}
        {journey && (
          <div className="animate-fade-up" style={{ marginBottom: '24px' }}>
            <div className="card-glass" style={{ padding: '24px', border: '1px solid var(--border-gold)' }}>
               <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} color="var(--gold)" />
                  Multi-Modal Journey Progress
               </h3>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {journey.segments.map((seg: any, idx: number) => (
                    <div key={seg.id} style={{ display: 'flex', gap: '16px', opacity: seg.status === 'completed' ? 0.5 : 1 }}>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ 
                            width: 24, height: 24, borderRadius: '50%', 
                            background: seg.status === 'completed' ? 'var(--emerald)' : (idx === journey.currentLeg ? 'var(--gold)' : 'rgba(255,255,255,0.1)'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: 'black'
                          }}>
                            {seg.status === 'completed' ? '✓' : idx + 1}
                          </div>
                          {idx < journey.segments.length - 1 && (
                            <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                          )}
                       </div>
                       <div style={{ flex: 1, paddingBottom: idx < journey.segments.length - 1 ? '16px' : '0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{seg.segment_type} Segment</span>
                             <span className={`badge badge-${seg.status === 'completed' ? 'green' : (seg.status === 'accepted' ? 'gold' : 'blue')}`} style={{ fontSize: '0.5rem' }}>
                                {seg.status}
                             </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                             {seg.pickup_address} &rarr; {seg.dropoff_address}
                          </div>
                          {seg.driver && idx === journey.currentLeg && (
                            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                               <div className="avatar avatar-xs">{seg.driver.name[0]}</div>
                               <div style={{ fontSize: '0.75rem' }}>
                                  <div style={{ fontWeight: 600 }}>{seg.driver.name}</div>
                                  <div style={{ color: 'var(--text-tertiary)' }}>{seg.vehicle.plate_number}</div>
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* Rewards Card */}
        {step === 'idle' && (
          <div className="card-glass animate-fade-up" style={{
            padding: '16px', marginBottom: '16px', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(244,169,1,0.15) 0%, rgba(244,169,0,0.05) 100%)',
            border: '1px solid rgba(244,169,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '12px', background: 'var(--gradient-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Trophy size={20} color="var(--bg-primary)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>MZANSI REWARDS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{rewards?.balance || 0} pts</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>
              Redeem <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Search / Where to? */}
        {step === 'idle' && (
          <div className="animate-fade-up">
            <div className="card-glass" style={{
              padding: '16px', marginBottom: '16px', borderRadius: '16px',
              border: '1px solid var(--border-medium)',
            }}>
              <button
                onClick={() => setShowSearch(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  width: '100%', padding: '14px 16px',
                  background: 'var(--surface-200)',
                  borderRadius: '12px', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-tertiary)', fontSize: '1rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Search size={20} style={{ color:'var(--gold)' }}/>
                <span>Where to?</span>
              </button>

              {/* Saved Locations */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {savedLocations.map((loc, i) => (
                  <button key={i} onClick={() => handleSelectDestination(loc.location)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 12px', background: 'var(--surface-200)',
                    borderRadius: '10px', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)', fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                  }}>
                    <span>{loc.icon}</span>
                    <span style={{ fontWeight: 500 }}>{loc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Governance Hub Link */}
            <Link href="/governance" style={{ textDecoration: 'none' }}>
              <div className="card-glass animate-fade-up" style={{
                padding: '16px', marginBottom: '16px', borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(56,189,248,0.02) 100%)',
                border: '1px solid rgba(56,189,248,0.2)',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '12px', background: 'var(--surface-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(56,189,248,0.3)'
                }}>
                  <Scale size={20} color="var(--sky)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Community Governance</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{proposals?.length || 2} active proposals to vote on</div>
                </div>
                <ChevronRight size={16} color="var(--text-tertiary)" />
              </div>
            </Link>

            {/* Recent Trips */}
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', paddingLeft: '4px' }}>
                Recent Trips
              </h3>
              <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentTrips.map((trip, i) => (
                  <div key={i} className="card" style={{
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                    cursor: 'pointer',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: 'rgba(244,169,0,0.1)', border: '1px solid rgba(244,169,0,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Clock size={16} style={{ color: 'var(--gold)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{trip.dest}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{trip.time}</div>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--gold)' }}>
                      {trip.fare}
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Booking */}
        {step === 'confirm' && fare && (
          <div className="animate-slide-up">
            <div className="card-glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Confirm Your {serviceType === 'PARCEL' ? 'Parcel Delivery' : 'Ride'}</h3>
                <button onClick={handleCancel} className="btn btn-ghost btn-icon" style={{ borderRadius: '50%' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Service Toggle */}
              <div className="flex gap-2 mb-4 bg-surface-200 p-1 rounded-xl">
                <button 
                  onClick={() => setServiceType('RIDE')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all ${serviceType === 'RIDE' ? 'bg-bg-primary shadow-sm text-gold border-gold' : 'text-tertiary'}`}
                  style={{ border: serviceType === 'RIDE' ? '1px solid var(--gold)' : '1px solid transparent' }}
                >
                  <Car size={16} /> Ride
                </button>
                <button 
                  onClick={() => setServiceType('PARCEL')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all ${serviceType === 'PARCEL' ? 'bg-bg-primary shadow-sm text-gold border-gold' : 'text-tertiary'}`}
                  style={{ border: serviceType === 'PARCEL' ? '1px solid var(--gold)' : '1px solid transparent' }}
                >
                  <Package size={16} /> Parcel
                </button>
              </div>

              {/* Parcel Details Form */}
              {serviceType === 'PARCEL' && (
                <div className="card-glass p-4 mb-4 animate-fade-in" style={{ background: 'rgba(244,169,0,0.05)', border: '1px solid rgba(244,169,0,0.2)' }}>
                  <div className="text-xs font-bold text-gold mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Package size={14} /> Localized Logistics Metadata
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <input 
                      type="text" 
                      placeholder="Recipient Name" 
                      className="w-100 p-3 bg-surface-100 border-subtle rounded-lg text-sm"
                      value={parcelDetails.recipientName}
                      onChange={(e) => setParcelDetails({...parcelDetails, recipientName: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Recipient Phone (WhatsApp)" 
                      className="w-100 p-3 bg-surface-100 border-subtle rounded-lg text-sm"
                      value={parcelDetails.recipientPhone}
                      onChange={(e) => setParcelDetails({...parcelDetails, recipientPhone: e.target.value})}
                    />
                    <select 
                      className="w-100 p-3 bg-surface-100 border-subtle rounded-lg text-sm"
                      value={parcelDetails.size}
                      onChange={(e) => setParcelDetails({...parcelDetails, size: e.target.value})}
                    >
                      <option value="small">Small (Envelope/Lunch)</option>
                      <option value="medium">Medium (Box/Grocery Bag)</option>
                      <option value="large">Large (Multiple Bags/Crate)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Route */}
              <div style={{
                padding: '14px', background: 'var(--surface-200)', borderRadius: '12px',
                marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Pickup</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{pickup?.name || pickup?.address}</div>
                  </div>
                </div>
                <div style={{ borderLeft: '2px dashed var(--border-medium)', marginLeft: '3px', height: '16px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Dropoff</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{dropoff?.name || dropoff?.address}</div>
                  </div>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {VEHICLE_OPTIONS.map((v) => (
                  <button key={v.type} onClick={() => setSelectedVehicle(v.type)} style={{
                    flex: 1, padding: '12px 8px', borderRadius: '12px',
                    background: selectedVehicle === v.type ? 'rgba(244,169,0,0.1)' : 'var(--surface-200)',
                    border: `1px solid ${selectedVehicle === v.type ? 'var(--border-gold)' : 'var(--border-subtle)'}`,
                    textAlign: 'center', transition: 'all 0.2s ease',
                    color: 'var(--text-primary)',
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>{v.icon}</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '4px' }}>{v.label}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{v.desc}</div>
                  </button>
                ))}
              </div>

              {/* Fare Breakdown */}
              <div style={{
                padding: '14px', background: 'var(--surface-200)', borderRadius: '12px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <span>Base fare</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(fare.baseFare)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <span>Distance ({distance} km)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(fare.distanceCharge)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <span>Time (~{duration} min)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(fare.timeCharge)}</span>
                </div>
                {serviceType === 'PARCEL' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem', color: 'var(--sky)', fontWeight: 600 }}>
                    <span>Solidarity Insurance (Levy)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(5)}</span>
                  </div>
                )}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '8px',
                  display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700,
                }}>
                  <span>Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>
                    {formatCurrency(fare.total + (serviceType === 'PARCEL' ? 5 : 0))}
                  </span>
                </div>
                <div style={{
                  marginTop: '8px', padding: '6px 10px', background: 'rgba(0,168,107,0.1)',
                  borderRadius: '8px', fontSize: '0.75rem', color: 'var(--green-light)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Shield size={12} /> {serviceType === 'PARCEL' ? 'Covered by Phakamisa Insurance' : 'Fixed rate — no surge pricing'}
                </div>
              </div>

              <button onClick={handleConfirmBooking} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Confirm {serviceType === 'PARCEL' ? 'Delivery' : 'Ride'} — {formatCurrency(fare.total + (serviceType === 'PARCEL' ? 5 : 0))}
              </button>
            </div>
          </div>
        )}

        {/* Matching Animation */}
        {step === 'matching' && (
          <div className="animate-scale-in" style={{
            padding: '48px 24px', textAlign: 'center',
          }}>
            <div className="card-glass" style={{ padding: '40px 24px', borderRadius: '20px' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
                background: 'rgba(244,169,0,0.1)', border: '2px solid rgba(244,169,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <Car size={32} style={{ color: 'var(--gold)' }} />
                <div style={{
                  position: 'absolute', inset: -8,
                  border: '2px solid rgba(244,169,0,0.2)', borderRadius: '50%',
                  borderTopColor: 'var(--gold)',
                  animation: 'spin 1.5s linear infinite',
                }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Finding your driver...</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Matching you with the best available Co-Mo driver
              </p>
              <button onClick={handleCancel} className="btn btn-ghost" style={{ marginTop: '24px', color: 'var(--text-tertiary)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Driver Matched */}
        {step === 'matched' && matchedDriver && fare && (
          <div className="animate-slide-up">
            <div className="card-glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '16px' }}>
              <div style={{
                textAlign: 'center', padding: '8px 0 16px',
                borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px',
              }}>
                <div className="badge badge-green" style={{ marginBottom: '12px' }}>
                  ✓ Driver Found
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Arriving in ~3 min
                </p>
                {serviceType === 'PARCEL' && parcelOtp && (
                  <div className="mt-4 p-4 bg-gold-subtle border-gold rounded-xl animate-scale-in">
                    <div className="text-xs font-bold text-gold opacity-80 uppercase tracking-widest mb-1">Pickup Verification OTP</div>
                    <div className="text-3xl font-black tracking-[0.2em] text-gold">{parcelOtp}</div>
                    <p className="text-[10px] text-tertiary mt-2">Give this code to your driver to release the parcel.</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div className="avatar avatar-lg">
                  {matchedDriver.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{matchedDriver.name}</span>
                    {matchedDriver.verificationStatus === 'verified' && (
                      <Shield size={14} style={{ color: 'var(--green-light)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Star size={13} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{matchedDriver.rating}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      • {matchedDriver.totalTrips.toLocaleString()} trips
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '12px', background: 'var(--surface-200)', borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
              }}>
                <div style={{
                  width: 40, height: 40, background: 'rgba(244,169,0,0.1)',
                  borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem',
                }}>
                  🚗
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {matchedDriver.vehicle.color} {matchedDriver.vehicle.make} {matchedDriver.vehicle.model}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {matchedDriver.vehicle.plateNumber}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(fare.total)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Fixed rate</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrivateCall} className="btn btn-secondary" style={{ flex: 1, gap: '8px' }}>
                  <Phone size={16} /> Call
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>
                  💬 Message
                </button>
                <button onClick={handleWhatsAppShare} className="btn btn-secondary" style={{ flex: 1 }}>
                  📤 Share Trip
                </button>
              </div>
            </div>

            {/* Panic Button */}
            <button 
              className={`panic-button ${isSosTriggered ? 'active' : ''}`} 
              title="Emergency SOS"
              onClick={handleTriggerSOS}
            >
              System SOS 🆘
            </button>
          </div>
        )}
      </div>

      {/* Call UI */}
      <CallOverlay 
        isOpen={isCallOpen} 
        onClose={() => setIsCallOpen(false)} 
        calleeName={matchedDriver?.name || 'Driver'} 
      />

      {/* Search Overlay */}
      {showSearch && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'var(--bg-primary)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <button onClick={() => setShowSearch(false)} className="btn btn-ghost btn-icon">
                <X size={20} />
              </button>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }} />
                <input
                  type="text"
                  className="input input-search"
                  placeholder="Search destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            {/* Search Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredPlaces.map((place, i) => (
                <button key={i} onClick={() => handleSelectDestination(place)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 12px', borderRadius: '12px',
                  background: 'transparent', width: '100%',
                  color: 'var(--text-primary)', textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: 'rgba(244,169,0,0.1)', border: '1px solid rgba(244,169,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <MapPin size={16} style={{ color: 'var(--gold)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{place.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{place.address}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Onboarding Tour */}
      {showTour && user && (
        <WelcomeTour 
          userId={user.id} 
          onComplete={() => setShowTour(false)} 
        />
      )}
    </div>
  );
}
