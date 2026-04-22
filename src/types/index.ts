// ============================================================
// Co-Mo Platform — Core Type Definitions
// ============================================================

export type UserRole = 'rider' | 'driver' | 'admin';
export type TripStatus = 'requested' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
export type VehicleType = 'economy' | 'comfort' | 'xl';
export type PaymentMethod = 'wallet' | 'card' | 'cash';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  vehicleType: VehicleType;
  vehicle: Vehicle;
  isOnline: boolean;
  currentLocation: Location;
  verificationStatus: VerificationStatus;
  cooperativeShares: number;
  subscriptionPaid: boolean;
  joinedDate: string;
  earnings: DriverEarnings;
  benefits: DriverBenefits;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  capacity: number;
  healthScore: number;
  nextService: string;
  rentToOwnBalance?: number;
  rentToOwnTotal?: number;
}

export interface DriverEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  subscriptionFee: number;
  nextPayout: string;
  payoutHistory: PayoutRecord[];
}

export interface PayoutRecord {
  id: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'processing';
}

export interface DriverBenefits {
  medicalAid: boolean;
  funeralPolicy: boolean;
  retirementPlan: boolean;
  medicalAidProvider?: string;
  retirementBalance?: number;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  verificationStatus: VerificationStatus;
  walletBalance: number;
  savedLocations: SavedLocation[];
  trustedContacts: TrustedContact[];
  joinedDate: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  icon: string;
  location: Location;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface Trip {
  id: string;
  riderId: string;
  driverId: string;
  riderName: string;
  driverName: string;
  pickup: Location;
  dropoff: Location;
  status: TripStatus;
  vehicleType: VehicleType;
  fare: FareBreakdown;
  distance: number; // km
  duration: number; // minutes
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  paymentMethod: PaymentMethod;
  rating?: number;
  route?: [number, number][];
}

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  total: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'ride_payment' | 'refund';
  amount: number;
  date: string;
  description: string;
  reference?: string;
}

export interface SafetyIncident {
  id: string;
  tripId: string;
  type: 'panic' | 'dispute' | 'accident' | 'report';
  status: 'active' | 'resolved' | 'investigating';
  reportedBy: string;
  reportedAt: string;
  description: string;
  resolvedAt?: string;
}

export interface TaxiAssociation {
  id: string;
  name: string;
  region: string;
  memberCount: number;
  activeDrivers: number;
  status: 'active' | 'pending' | 'suspended';
  contactPerson: string;
  contactPhone: string;
  joinedDate: string;
}

export interface AdminStats {
  totalRiders: number;
  totalDrivers: number;
  activeTrips: number;
  completedTripsToday: number;
  revenueToday: number;
  revenueThisMonth: number;
  safetyIncidents: number;
  averageRating: number;
  onlineDrivers: number;
  growthRate: number;
}

export interface CooperativeInfo {
  totalShares: number;
  sharePrice: number;
  totalMembers: number;
  dividendPool: number;
  lastDividendDate: string;
  nextDividendDate: string;
  votingItems: VotingItem[];
}

export interface VotingItem {
  id: string;
  title: string;
  description: string;
  deadline: string;
  votesFor: number;
  votesAgainst: number;
  totalEligible: number;
  hasVoted: boolean;
}
