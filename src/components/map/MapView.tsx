'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createRiderIcon, createDriverIcon, createDestinationIcon } from './MapMarkers';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  drivers?: { id: string; lat: number; lng: number; rotation?: number }[];
  riderLoc?: [number, number];
  destination?: [number, number];
  route?: [number, number][];
}

// Helper to auto-fit bounds when route changes
function Recenter({ bounds }: { bounds: any }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  return null;
}

export default function MapView({ 
  center = [-26.2041, 28.0473], 
  zoom = 13, 
  drivers = [], 
  riderLoc, 
  destination,
  route 
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ height: '100%', background: '#0A0E1A' }} />;

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      zoomControl={false}
      style={{ height: '100%', width: '100%', zIndex: 1 }}
    >
      {/* Premium Dark Theme Tiles */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />

      {/* Driver Markers */}
      {drivers.map((d) => (
        <Marker 
          key={d.id} 
          position={[d.lat, d.lng]} 
          icon={createDriverIcon(d.rotation)}
        />
      ))}

      {/* Rider Marker */}
      {riderLoc && (
        <Marker position={riderLoc} icon={createRiderIcon()} />
      )}

      {/* Destination Marker */}
      {destination && (
        <Marker position={destination} icon={createDestinationIcon()} />
      )}

      {/* Route Polyline */}
      {route && (
        <Polyline 
          positions={route} 
          pathOptions={{ 
            color: 'var(--gold)', 
            weight: 4, 
            opacity: 0.6,
            dashArray: '10, 10'
          }} 
        />
      )}

      {/* Auto-recenter if we have a route */}
      {route && <Recenter bounds={route} />}
    </MapContainer>
  );
}
