// ============================================================
// Co-Mo Fixed-Rate Fare Calculator
// No surge pricing — transparent, predictable fares
// ============================================================

import { FareBreakdown, VehicleType } from '@/types';

const RATE_CARD: Record<VehicleType, { baseFare: number; perKm: number; perMin: number }> = {
  economy:  { baseFare: 15, perKm: 7.50, perMin: 1.20 },
  comfort:  { baseFare: 25, perKm: 10.00, perMin: 1.50 },
  xl:       { baseFare: 35, perKm: 12.50, perMin: 2.00 },
};

export function calculateFare(
  distanceKm: number,
  durationMin: number,
  vehicleType: VehicleType = 'economy'
): FareBreakdown {
  const rates = RATE_CARD[vehicleType];
  const distanceCharge = Math.round(distanceKm * rates.perKm * 100) / 100;
  const timeCharge = Math.round(durationMin * rates.perMin * 100) / 100;
  const total = Math.round((rates.baseFare + distanceCharge + timeCharge) * 100) / 100;

  return {
    baseFare: rates.baseFare,
    distanceCharge,
    timeCharge,
    total,
    currency: 'ZAR',
  };
}

export function formatCurrency(amount: number, currencyCode: string = 'ZAR'): string {
  switch (currencyCode) {
    case 'USD': return `$${amount.toFixed(2)}`;
    case 'BWP': return `P${amount.toFixed(2)}`;
    case 'SZL': return `L${amount.toFixed(2)}`;
    case 'LSL': return `M${amount.toFixed(2)}`;
    case 'ZAR':
    default: return `R${amount.toFixed(2)}`;
  }
}

export function estimateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  // Haversine formula
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Multiply by 1.3 to approximate road distance vs straight line
  return Math.round(R * c * 1.3 * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function estimateDuration(distanceKm: number): number {
  // Average speed ~30 km/h in urban SA
  return Math.round((distanceKm / 30) * 60);
}
