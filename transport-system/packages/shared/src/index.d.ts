export declare enum UserRole {
    SHIPPER = "SHIPPER",
    CARRIER = "CARRIER",
    DRIVER = "DRIVER",
    ADMIN = "ADMIN"
}
export declare enum VerificationStatus {
    UNVERIFIED = "UNVERIFIED",
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED"
}
export declare enum VerificationDocType {
    DRIVING_LICENCE = "DRIVING_LICENCE",
    VEHICLE_REGISTRATION = "VEHICLE_REGISTRATION",
    INSURANCE = "INSURANCE",
    COLD_CHAIN_CERT = "COLD_CHAIN_CERT",
    BUSINESS_LICENCE = "BUSINESS_LICENCE"
}
export declare enum JobStatus {
    DRAFT = "DRAFT",
    OPEN = "OPEN",
    AWARDED = "AWARDED",
    IN_TRANSIT = "IN_TRANSIT",
    DELIVERED = "DELIVERED",
    CLOSED = "CLOSED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
export declare enum BidStatus {
    ACTIVE = "ACTIVE",
    WON = "WON",
    REJECTED = "REJECTED",
    WITHDRAWN = "WITHDRAWN"
}
export declare enum TripStatus {
    ASSIGNED = "ASSIGNED",
    EN_ROUTE_TO_PICKUP = "EN_ROUTE_TO_PICKUP",
    AT_PICKUP = "AT_PICKUP",
    LOADED = "LOADED",
    IN_TRANSIT = "IN_TRANSIT",
    AT_DROPOFF = "AT_DROPOFF",
    DELIVERED = "DELIVERED"
}
export declare const TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]>;
export interface GeoPoint {
    lat: number;
    lng: number;
    address?: string;
}
export interface CargoProfile {
    cropType: string;
    weightKg: number;
    volumeM3: number;
    perishabilityIndex: number;
    coldChainRequired: boolean;
}
export interface CreateJobDto {
    pickup: GeoPoint;
    dropoff: GeoPoint;
    cargo: CargoProfile;
    pickupWindowStart: string;
    pickupWindowEnd: string;
    biddingClosesAt: string;
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
    sub: string;
    role: UserRole;
    email: string;
}
export declare const REALTIME_NAMESPACE = "/realtime";
export type RealtimeEvent = {
    type: 'bid:new';
    jobId: string;
    bidId: string;
    amount: number;
    etaMinutes: number;
    carrierId: string;
} | {
    type: 'bid:awarded';
    jobId: string;
    bidId: string;
    carrierId: string;
} | {
    type: 'trip:location';
    tripId: string;
    lat: number;
    lng: number;
    at: string;
} | {
    type: 'trip:status';
    tripId: string;
    status: TripStatus;
    at: string;
};
export declare const room: {
    job: (id: string) => string;
    trip: (id: string) => string;
};
