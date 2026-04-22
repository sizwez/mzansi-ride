'use client';

import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { Navigation, MapPin, Car } from 'lucide-react';

/**
 * Custom markers for Mzansi Ride
 */

export const createRiderIcon = () => {
  return L.divIcon({
    html: renderToString(
      <div style={{
        width: '40px', height: '40px', background: 'var(--gradient-gold)',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 20px rgba(244,169,0,0.5)', border: '2px solid white'
      }}>
        <Navigation size={20} color="#0A0E1A" />
      </div>
    ),
    className: 'custom-rider-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export const createDriverIcon = (rotation: number = 0) => {
  return L.divIcon({
    html: renderToString(
      <div style={{
        width: '36px', height: '36px', background: 'var(--surface-100)',
        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 15px rgba(0,0,0,0.4)', border: '1.5px solid var(--gold)',
        transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease'
      }}>
        <Car size={20} color="var(--gold)" />
      </div>
    ),
    className: 'custom-driver-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export const createDestinationIcon = () => {
  return L.divIcon({
    html: renderToString(
      <div style={{
        width: '32px', height: '32px', background: 'white',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 15px rgba(0,0,0,0.3)', border: '2px solid var(--ruby)'
      }}>
        <MapPin size={18} color="var(--ruby)" />
      </div>
    ),
    className: 'custom-dest-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32], // Anchor bottom-center for MapPin
  });
};
