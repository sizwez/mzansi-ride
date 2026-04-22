// ============================================================
// Co-Mo Platform — Comprehensive Mock Data
// Realistic South African locations, drivers, and riders
// ============================================================

import { Driver, Rider, Trip, AdminStats, CooperativeInfo, TaxiAssociation, WalletTransaction, SafetyIncident } from '@/types';

// ============================================================
// SA Locations
// ============================================================
export const SA_LOCATIONS = {
  johannesburg: {
    center: { lat: -26.2041, lng: 28.0473 },
    places: [
      { name: 'Sandton City', lat: -26.1076, lng: 28.0567, address: 'Sandton Dr, Sandton, Johannesburg' },
      { name: 'OR Tambo Airport', lat: -26.1392, lng: 28.2460, address: 'O.R. Tambo International Airport' },
      { name: 'Soweto (Orlando)', lat: -26.2485, lng: 27.9085, address: 'Orlando West, Soweto' },
      { name: 'Rosebank Mall', lat: -26.1455, lng: 28.0434, address: 'Bath Ave, Rosebank' },
      { name: 'Johannesburg CBD', lat: -26.2041, lng: 28.0473, address: 'Commissioner St, Johannesburg' },
      { name: 'Fourways Mall', lat: -26.0145, lng: 28.0126, address: 'William Nicol Dr, Fourways' },
      { name: 'Alexandra Township', lat: -26.1066, lng: 28.0989, address: 'Far East Bank, Alexandra' },
      { name: 'Melville', lat: -26.1773, lng: 28.0118, address: '7th Street, Melville' },
      { name: 'Braamfontein', lat: -26.1929, lng: 28.0338, address: 'Juta St, Braamfontein' },
      { name: 'Maboneng Precinct', lat: -26.2023, lng: 28.0590, address: 'Fox St, Maboneng' },
    ]
  },
  capeTown: {
    center: { lat: -33.9249, lng: 18.4241 },
    places: [
      { name: 'V&A Waterfront', lat: -33.9036, lng: 18.4207, address: 'V&A Waterfront, Cape Town' },
      { name: 'Cape Town CBD', lat: -33.9249, lng: 18.4241, address: 'Long St, Cape Town' },
      { name: 'Khayelitsha', lat: -34.0388, lng: 18.6747, address: 'Khayelitsha, Cape Town' },
      { name: 'Constantia', lat: -34.0289, lng: 18.4264, address: 'Constantia Main Rd' },
      { name: 'Bellville', lat: -33.9012, lng: 18.6292, address: 'Voortrekker Rd, Bellville' },
    ]
  },
  durban: {
    center: { lat: -29.8587, lng: 31.0218 },
    places: [
      { name: 'uShaka Marine World', lat: -29.8679, lng: 31.0450, address: '1 Bell St, Durban' },
      { name: 'Gateway Mall', lat: -29.7341, lng: 31.0690, address: 'Palm Blvd, Umhlanga' },
      { name: 'Durban CBD', lat: -29.8587, lng: 31.0218, address: 'West St, Durban' },
      { name: 'KwaMashu', lat: -29.7478, lng: 30.9754, address: 'KwaMashu, Durban' },
      { name: 'Pinetown', lat: -29.8167, lng: 30.8667, address: 'Old Main Rd, Pinetown' },
    ]
  }
};

// ============================================================
// Mock Drivers
// ============================================================
export const mockDrivers: Driver[] = [
  {
    id: 'drv-001',
    name: 'Thabo Mokoena',
    phone: '+27 71 234 5678',
    email: 'thabo.m@como.co.za',
    avatar: '/drivers/thabo.jpg',
    rating: 4.9,
    totalTrips: 2847,
    vehicleType: 'comfort',
    vehicle: {
      make: 'Toyota', model: 'Corolla', year: 2023, color: 'Silver',
      plateNumber: 'GP 123 ABC', capacity: 4, healthScore: 92,
      nextService: '2026-05-15', rentToOwnBalance: 45000, rentToOwnTotal: 180000
    },
    isOnline: true,
    currentLocation: { lat: -26.1100, lng: 28.0550, address: 'Near Sandton' },
    verificationStatus: 'verified',
    cooperativeShares: 5,
    subscriptionPaid: true,
    joinedDate: '2024-06-15',
    earnings: {
      today: 1250, thisWeek: 6800, thisMonth: 28500,
      subscriptionFee: 1500,
      nextPayout: '2026-04-25',
      payoutHistory: [
        { id: 'pay-001', amount: 6200, date: '2026-04-18', status: 'completed' },
        { id: 'pay-002', amount: 5800, date: '2026-04-11', status: 'completed' },
        { id: 'pay-003', amount: 7100, date: '2026-04-04', status: 'completed' },
      ]
    },
    benefits: {
      medicalAid: true, funeralPolicy: true, retirementPlan: true,
      medicalAidProvider: 'Discovery Health', retirementBalance: 34500
    }
  },
  {
    id: 'drv-002',
    name: 'Nomvula Dlamini',
    phone: '+27 82 345 6789',
    email: 'nomvula.d@como.co.za',
    avatar: '/drivers/nomvula.jpg',
    rating: 4.8,
    totalTrips: 1523,
    vehicleType: 'economy',
    vehicle: {
      make: 'Volkswagen', model: 'Polo Vivo', year: 2022, color: 'White',
      plateNumber: 'GP 456 DEF', capacity: 4, healthScore: 88,
      nextService: '2026-05-01'
    },
    isOnline: true,
    currentLocation: { lat: -26.2000, lng: 28.0400, address: 'Near CBD' },
    verificationStatus: 'verified',
    cooperativeShares: 3,
    subscriptionPaid: true,
    joinedDate: '2024-09-20',
    earnings: {
      today: 980, thisWeek: 5200, thisMonth: 22100,
      subscriptionFee: 1200,
      nextPayout: '2026-04-25',
      payoutHistory: [
        { id: 'pay-004', amount: 4900, date: '2026-04-18', status: 'completed' },
        { id: 'pay-005', amount: 5100, date: '2026-04-11', status: 'completed' },
      ]
    },
    benefits: {
      medicalAid: true, funeralPolicy: true, retirementPlan: false,
      medicalAidProvider: 'Bonitas'
    }
  },
  {
    id: 'drv-003',
    name: 'Sipho Ndlovu',
    phone: '+27 73 456 7890',
    email: 'sipho.n@como.co.za',
    avatar: '/drivers/sipho.jpg',
    rating: 4.7,
    totalTrips: 3201,
    vehicleType: 'xl',
    vehicle: {
      make: 'Toyota', model: 'Quantum', year: 2021, color: 'White',
      plateNumber: 'GP 789 GHI', capacity: 7, healthScore: 78,
      nextService: '2026-04-28', rentToOwnBalance: 120000, rentToOwnTotal: 350000
    },
    isOnline: false,
    currentLocation: { lat: -26.2485, lng: 27.9085, address: 'Soweto' },
    verificationStatus: 'verified',
    cooperativeShares: 8,
    subscriptionPaid: true,
    joinedDate: '2024-03-10',
    earnings: {
      today: 0, thisWeek: 8200, thisMonth: 35600,
      subscriptionFee: 1800,
      nextPayout: '2026-04-25',
      payoutHistory: [
        { id: 'pay-006', amount: 7800, date: '2026-04-18', status: 'completed' },
        { id: 'pay-007', amount: 8500, date: '2026-04-11', status: 'completed' },
        { id: 'pay-008', amount: 7200, date: '2026-04-04', status: 'completed' },
      ]
    },
    benefits: {
      medicalAid: true, funeralPolicy: true, retirementPlan: true,
      medicalAidProvider: 'Discovery Health', retirementBalance: 62000
    }
  },
  {
    id: 'drv-004',
    name: 'Zanele Mbeki',
    phone: '+27 84 567 8901',
    email: 'zanele.m@como.co.za',
    avatar: '/drivers/zanele.jpg',
    rating: 4.9,
    totalTrips: 890,
    vehicleType: 'comfort',
    vehicle: {
      make: 'Hyundai', model: 'i20', year: 2024, color: 'Blue',
      plateNumber: 'GP 012 JKL', capacity: 4, healthScore: 97,
      nextService: '2026-06-01'
    },
    isOnline: true,
    currentLocation: { lat: -26.1455, lng: 28.0434, address: 'Near Rosebank' },
    verificationStatus: 'verified',
    cooperativeShares: 2,
    subscriptionPaid: true,
    joinedDate: '2025-01-15',
    earnings: {
      today: 1100, thisWeek: 5900, thisMonth: 24300,
      subscriptionFee: 1500,
      nextPayout: '2026-04-25',
      payoutHistory: [
        { id: 'pay-009', amount: 5500, date: '2026-04-18', status: 'completed' },
      ]
    },
    benefits: {
      medicalAid: false, funeralPolicy: true, retirementPlan: false,
    }
  },
  {
    id: 'drv-005',
    name: 'Bongani Zulu',
    phone: '+27 76 678 9012',
    email: 'bongani.z@como.co.za',
    avatar: '/drivers/bongani.jpg',
    rating: 4.6,
    totalTrips: 567,
    vehicleType: 'economy',
    vehicle: {
      make: 'Suzuki', model: 'Swift', year: 2023, color: 'Red',
      plateNumber: 'GP 345 MNO', capacity: 4, healthScore: 85,
      nextService: '2026-05-20'
    },
    isOnline: true,
    currentLocation: { lat: -26.0145, lng: 28.0126, address: 'Near Fourways' },
    verificationStatus: 'pending',
    cooperativeShares: 1,
    subscriptionPaid: false,
    joinedDate: '2025-11-01',
    earnings: {
      today: 450, thisWeek: 3200, thisMonth: 14800,
      subscriptionFee: 1200,
      nextPayout: '2026-04-25',
      payoutHistory: []
    },
    benefits: {
      medicalAid: false, funeralPolicy: false, retirementPlan: false,
    }
  }
];

// ============================================================
// Mock Riders
// ============================================================
export const mockRiders: Rider[] = [
  {
    id: 'rdr-001',
    name: 'Lerato Khumalo',
    phone: '+27 81 111 2222',
    email: 'lerato.k@gmail.com',
    avatar: '/riders/lerato.jpg',
    rating: 4.8,
    totalTrips: 156,
    verificationStatus: 'verified',
    walletBalance: 350.00,
    savedLocations: [
      { id: 'loc-1', name: 'Home', icon: '🏠', location: { lat: -26.2485, lng: 27.9085, address: 'Orlando West, Soweto' } },
      { id: 'loc-2', name: 'Work', icon: '💼', location: { lat: -26.1076, lng: 28.0567, address: 'Sandton City' } },
    ],
    trustedContacts: [
      { id: 'tc-1', name: 'Mama', phone: '+27 82 333 4444', relationship: 'Mother' },
      { id: 'tc-2', name: 'Tshepo', phone: '+27 73 555 6666', relationship: 'Brother' },
    ],
    joinedDate: '2025-02-14'
  },
  {
    id: 'rdr-002',
    name: 'Andile Nkosi',
    phone: '+27 72 222 3333',
    email: 'andile.n@outlook.com',
    avatar: '/riders/andile.jpg',
    rating: 4.5,
    totalTrips: 89,
    verificationStatus: 'verified',
    walletBalance: 125.50,
    savedLocations: [
      { id: 'loc-3', name: 'Home', icon: '🏠', location: { lat: -26.1066, lng: 28.0989, address: 'Alexandra Township' } },
      { id: 'loc-4', name: 'Gym', icon: '💪', location: { lat: -26.1455, lng: 28.0434, address: 'Rosebank' } },
    ],
    trustedContacts: [
      { id: 'tc-3', name: 'Sihle', phone: '+27 84 777 8888', relationship: 'Friend' },
    ],
    joinedDate: '2025-05-20'
  }
];

// ============================================================
// Mock Trips
// ============================================================
export const mockTrips: Trip[] = [
  {
    id: 'trip-001',
    riderId: 'rdr-001', driverId: 'drv-001',
    riderName: 'Lerato Khumalo', driverName: 'Thabo Mokoena',
    pickup: { lat: -26.2485, lng: 27.9085, address: 'Orlando West, Soweto', name: 'Home' },
    dropoff: { lat: -26.1076, lng: 28.0567, address: 'Sandton City', name: 'Work' },
    status: 'in_progress',
    vehicleType: 'comfort',
    fare: { baseFare: 25, distanceCharge: 180, timeCharge: 54, total: 259, currency: 'ZAR' },
    distance: 18.0, duration: 36,
    requestedAt: '2026-04-20T07:15:00Z',
    startedAt: '2026-04-20T07:22:00Z',
    paymentMethod: 'wallet',
    route: [
      [-26.2485, 27.9085], [-26.2300, 27.9200], [-26.2100, 27.9400],
      [-26.1900, 27.9600], [-26.1700, 27.9800], [-26.1500, 28.0000],
      [-26.1300, 28.0200], [-26.1200, 28.0400], [-26.1076, 28.0567]
    ]
  },
  {
    id: 'trip-002',
    riderId: 'rdr-002', driverId: 'drv-002',
    riderName: 'Andile Nkosi', driverName: 'Nomvula Dlamini',
    pickup: { lat: -26.1066, lng: 28.0989, address: 'Alexandra Township' },
    dropoff: { lat: -26.2041, lng: 28.0473, address: 'Johannesburg CBD' },
    status: 'completed',
    vehicleType: 'economy',
    fare: { baseFare: 15, distanceCharge: 82.50, timeCharge: 24, total: 121.50, currency: 'ZAR' },
    distance: 11.0, duration: 20,
    requestedAt: '2026-04-20T06:30:00Z',
    startedAt: '2026-04-20T06:38:00Z',
    completedAt: '2026-04-20T06:58:00Z',
    paymentMethod: 'card',
    rating: 5
  },
  {
    id: 'trip-003',
    riderId: 'rdr-001', driverId: 'drv-004',
    riderName: 'Lerato Khumalo', driverName: 'Zanele Mbeki',
    pickup: { lat: -26.1076, lng: 28.0567, address: 'Sandton City' },
    dropoff: { lat: -26.1455, lng: 28.0434, address: 'Rosebank Mall' },
    status: 'completed',
    vehicleType: 'comfort',
    fare: { baseFare: 25, distanceCharge: 37.50, timeCharge: 10.50, total: 73, currency: 'ZAR' },
    distance: 3.75, duration: 7,
    requestedAt: '2026-04-19T17:30:00Z',
    startedAt: '2026-04-19T17:35:00Z',
    completedAt: '2026-04-19T17:42:00Z',
    paymentMethod: 'wallet',
    rating: 5
  }
];

// ============================================================
// Mock Wallet Transactions
// ============================================================
export const mockTransactions: WalletTransaction[] = [
  { id: 'txn-001', type: 'topup', amount: 500, date: '2026-04-19T10:00:00Z', description: 'Card Top-Up', reference: 'REF-001' },
  { id: 'txn-002', type: 'ride_payment', amount: -73, date: '2026-04-19T17:42:00Z', description: 'Trip to Rosebank Mall' },
  { id: 'txn-003', type: 'ride_payment', amount: -121.50, date: '2026-04-18T12:30:00Z', description: 'Trip to Johannesburg CBD' },
  { id: 'txn-004', type: 'topup', amount: 200, date: '2026-04-17T09:00:00Z', description: 'Cash Agent Top-Up (Spar Soweto)', reference: 'CASH-002' },
  { id: 'txn-005', type: 'refund', amount: 45, date: '2026-04-16T14:00:00Z', description: 'Trip cancellation refund' },
];

// ============================================================
// Mock Safety Incidents
// ============================================================
export const mockIncidents: SafetyIncident[] = [
  {
    id: 'inc-001', tripId: 'trip-050', type: 'panic',
    status: 'resolved', reportedBy: 'rdr-010',
    reportedAt: '2026-04-19T22:15:00Z',
    description: 'Rider triggered panic button — false alarm, resolved with driver confirmation.',
    resolvedAt: '2026-04-19T22:25:00Z'
  },
  {
    id: 'inc-002', tripId: 'trip-051', type: 'dispute',
    status: 'investigating', reportedBy: 'rdr-015',
    reportedAt: '2026-04-20T08:10:00Z',
    description: 'Rider disputes fare amount — claims shorter route was available.'
  },
  {
    id: 'inc-003', tripId: 'trip-052', type: 'report',
    status: 'active', reportedBy: 'drv-003',
    reportedAt: '2026-04-20T09:30:00Z',
    description: 'Driver reports aggressive passenger behavior during pickup.'
  },
];

// ============================================================
// Mock Taxi Associations
// ============================================================
export const mockAssociations: TaxiAssociation[] = [
  {
    id: 'assoc-001', name: 'Gauteng Taxi Alliance',
    region: 'Gauteng', memberCount: 450, activeDrivers: 312,
    status: 'active', contactPerson: 'Mr. Johannes Mahlangu',
    contactPhone: '+27 11 234 5678', joinedDate: '2024-08-01'
  },
  {
    id: 'assoc-002', name: 'Soweto United Taxi Association',
    region: 'Soweto, Gauteng', memberCount: 180, activeDrivers: 145,
    status: 'active', contactPerson: 'Mrs. Grace Sithole',
    contactPhone: '+27 11 345 6789', joinedDate: '2024-10-15'
  },
  {
    id: 'assoc-003', name: 'Cape Metro Taxi Forum',
    region: 'Western Cape', memberCount: 320, activeDrivers: 210,
    status: 'pending', contactPerson: 'Mr. Xolani Adams',
    contactPhone: '+27 21 456 7890', joinedDate: '2025-01-20'
  },
];

// ============================================================
// Mock Admin Stats
// ============================================================
export const mockAdminStats: AdminStats = {
  totalRiders: 15420,
  totalDrivers: 1847,
  activeTrips: 234,
  completedTripsToday: 1892,
  revenueToday: 412500,
  revenueThisMonth: 8750000,
  safetyIncidents: 3,
  averageRating: 4.7,
  onlineDrivers: 623,
  growthRate: 12.5,
};

// ============================================================
// Mock Cooperative Info
// ============================================================
export const mockCooperativeInfo: CooperativeInfo = {
  totalShares: 10000,
  sharePrice: 500,
  totalMembers: 1847,
  dividendPool: 2500000,
  lastDividendDate: '2026-03-31',
  nextDividendDate: '2026-06-30',
  votingItems: [
    {
      id: 'vote-001',
      title: 'Expand to Pretoria Region',
      description: 'Proposal to launch Co-Mo operations in the Pretoria/Tshwane metropolitan area, requiring an investment of R500,000 for marketing and driver onboarding.',
      deadline: '2026-05-15',
      votesFor: 892, votesAgainst: 234, totalEligible: 1847,
      hasVoted: false
    },
    {
      id: 'vote-002',
      title: 'Increase Funeral Policy Coverage',
      description: 'Proposal to upgrade the cooperative funeral policy from R50,000 to R100,000 coverage, with a monthly increase of R15 per member.',
      deadline: '2026-05-01',
      votesFor: 1205, votesAgainst: 89, totalEligible: 1847,
      hasVoted: true
    },
  ]
};

// ============================================================
// Chart data for admin dashboards
// ============================================================
export const weeklyRideData = [
  { day: 'Mon', rides: 1842, revenue: 385000 },
  { day: 'Tue', rides: 2104, revenue: 441000 },
  { day: 'Wed', rides: 1956, revenue: 410000 },
  { day: 'Thu', rides: 2251, revenue: 472000 },
  { day: 'Fri', rides: 2890, revenue: 606000 },
  { day: 'Sat', rides: 3120, revenue: 655000 },
  { day: 'Sun', rides: 1680, revenue: 352000 },
];

export const monthlyGrowthData = [
  { month: 'Nov', riders: 8200, drivers: 980 },
  { month: 'Dec', riders: 9800, drivers: 1120 },
  { month: 'Jan', riders: 11200, drivers: 1350 },
  { month: 'Feb', riders: 12800, drivers: 1520 },
  { month: 'Mar', riders: 14100, drivers: 1690 },
  { month: 'Apr', riders: 15420, drivers: 1847 },
];

export const demandHeatmapData = [
  { hour: '06:00', demand: 45 },
  { hour: '07:00', demand: 85 },
  { hour: '08:00', demand: 95 },
  { hour: '09:00', demand: 70 },
  { hour: '10:00', demand: 40 },
  { hour: '11:00', demand: 35 },
  { hour: '12:00', demand: 55 },
  { hour: '13:00', demand: 60 },
  { hour: '14:00', demand: 45 },
  { hour: '15:00', demand: 50 },
  { hour: '16:00', demand: 75 },
  { hour: '17:00', demand: 92 },
  { hour: '18:00', demand: 88 },
  { hour: '19:00', demand: 65 },
  { hour: '20:00', demand: 40 },
  { hour: '21:00', demand: 30 },
];
