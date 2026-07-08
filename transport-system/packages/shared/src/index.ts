/**
 * @athenagrid/shared
 * Single source of truth for enums, DTO shapes and realtime event contracts.
 * Imported by BOTH the NestJS API and the Next.js web app so the two never drift.
 */

// ----------------------------- Enums -----------------------------

export enum UserRole {
  SHIPPER = 'SHIPPER', // farmer / industry / restaurant posting a job
  CARRIER = 'CARRIER', // transport company that bids and owns a fleet
  DRIVER = 'DRIVER', // driver who executes a trip
  ADMIN = 'ADMIN',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum CarrierType {
  COMPANY = 'COMPANY',
  INDIVIDUAL = 'INDIVIDUAL',
}

export enum ShipperType {
  FARMER = 'FARMER',
  INDUSTRY = 'INDUSTRY',
}

export enum ProductCategory {
  SEEDS = 'SEEDS',
  PESTICIDES = 'PESTICIDES',
  FERTILIZER = 'FERTILIZER',
  TOOLS = 'TOOLS',
}

export enum OrderStatus {
  PLACED = 'PLACED', // order created, transport job posted, awaiting award
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/** Marketplace platform fee on the goods total (added to the farmer's bill). */
export const DEFAULT_MARKETPLACE_FEE_RATE = 0.05;

export interface GeoLocation {
  address?: string;
  postalCode?: string;
  lat: number;
  lng: number;
}

export enum VerificationDocType {
  DRIVING_LICENCE = 'DRIVING_LICENCE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  INSURANCE = 'INSURANCE',
  COLD_CHAIN_CERT = 'COLD_CHAIN_CERT',
  BUSINESS_LICENCE = 'BUSINESS_LICENCE',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  AWARDED = 'AWARDED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum BidStatus {
  ACTIVE = 'ACTIVE',
  WON = 'WON',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum TripStatus {
  ASSIGNED = 'ASSIGNED',
  EN_ROUTE_TO_PICKUP = 'EN_ROUTE_TO_PICKUP',
  AT_PICKUP = 'AT_PICKUP',
  LOADED = 'LOADED',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_DROPOFF = 'AT_DROPOFF',
  DELIVERED = 'DELIVERED',
}

// Valid forward transitions for the trip state machine (enforced server-side).
export const TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  [TripStatus.ASSIGNED]: [TripStatus.EN_ROUTE_TO_PICKUP],
  [TripStatus.EN_ROUTE_TO_PICKUP]: [TripStatus.AT_PICKUP],
  [TripStatus.AT_PICKUP]: [TripStatus.LOADED],
  [TripStatus.LOADED]: [TripStatus.IN_TRANSIT],
  [TripStatus.IN_TRANSIT]: [TripStatus.AT_DROPOFF],
  [TripStatus.AT_DROPOFF]: [TripStatus.DELIVERED],
  [TripStatus.DELIVERED]: [],
};

// ----------------------------- Value objects -----------------------------

export interface GeoPoint {
  lat: number;
  lng: number;
  address?: string;
}

export interface CargoProfile {
  cropType: string;
  weightKg: number;
  volumeM3: number;
  /** 0..1 decay rate — sourced from ML YieldSegmenter; > 0.6 implies cold-chain. */
  perishabilityIndex: number;
  coldChainRequired: boolean;
}

// ----------------------------- DTO contracts -----------------------------

export interface CreateJobDto {
  pickup: GeoPoint;
  dropoff: GeoPoint;
  cargo: CargoProfile;
  pickupWindowStart: string; // ISO
  pickupWindowEnd: string; // ISO
  biddingClosesAt: string; // ISO
  budgetCeiling?: number;
}

export interface PlaceBidDto {
  amount: number;
  etaMinutes: number;
  vehicleId: string;
  message?: string;
}

export interface JobSearchQuery {
  status?: JobStatus;
  nearLat?: number;
  nearLng?: number;
  radiusKm?: number;
  coldChainOnly?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string; // user id
  role: UserRole;
  email: string;
}

// ----------------------------- Realtime events -----------------------------

export const REALTIME_NAMESPACE = '/realtime';

export type RealtimeEvent =
  | { type: 'bid:new'; jobId: string; bidId: string; amount: number; etaMinutes: number; carrierId: string }
  | { type: 'bid:awarded'; jobId: string; bidId: string; carrierId: string }
  | { type: 'trip:location'; tripId: string; lat: number; lng: number; at: string }
  | { type: 'trip:status'; tripId: string; status: TripStatus; at: string };

export const room = {
  job: (id: string) => `job:${id}`,
  trip: (id: string) => `trip:${id}`,
};

// ----------------------------- Pricing & settlement -----------------------------

/** A fair-price band computed for a job — anchors the auction. */
export interface FairBand {
  reference: number;
  floor: number;
  ceiling: number;
}

/** Platform take-rate defaults (12% total: 8% carrier commission + 4% shipper fee). */
export const DEFAULT_CARRIER_COMMISSION_RATE = 0.08;
export const DEFAULT_SHIPPER_FEE_RATE = 0.04;

export interface Settlement {
  transportPrice: number; // the winning bid
  carrierCommissionRate: number;
  shipperFeeRate: number;
  carrierCommission: number; // deducted from carrier payout
  shipperFee: number; // added to farmer bill
  farmerTotal: number; // what the shipper pays
  driverPayout: number; // what the carrier/driver nets
  platformRevenue: number; // platform take
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Single source of truth for the money split. Used by the API (stored) and UI (preview). */
export function computeSettlement(
  amount: number,
  carrierRate: number = DEFAULT_CARRIER_COMMISSION_RATE,
  shipperRate: number = DEFAULT_SHIPPER_FEE_RATE,
): Settlement {
  const transportPrice = round2(amount);
  const carrierCommission = round2(transportPrice * carrierRate);
  const shipperFee = round2(transportPrice * shipperRate);
  return {
    transportPrice,
    carrierCommissionRate: carrierRate,
    shipperFeeRate: shipperRate,
    carrierCommission,
    shipperFee,
    farmerTotal: round2(transportPrice + shipperFee),
    driverPayout: round2(transportPrice - carrierCommission),
    platformRevenue: round2(carrierCommission + shipperFee),
  };
}

export interface BidAssessment {
  score: number; // 0..1
  recommended: boolean;
  withinBand: boolean;
  note: string;
}
