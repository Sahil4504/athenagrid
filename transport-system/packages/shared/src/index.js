"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.room = exports.REALTIME_NAMESPACE = exports.TRIP_TRANSITIONS = exports.TripStatus = exports.BidStatus = exports.JobStatus = exports.VerificationDocType = exports.VerificationStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SHIPPER"] = "SHIPPER";
    UserRole["CARRIER"] = "CARRIER";
    UserRole["DRIVER"] = "DRIVER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["UNVERIFIED"] = "UNVERIFIED";
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["VERIFIED"] = "VERIFIED";
    VerificationStatus["REJECTED"] = "REJECTED";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var VerificationDocType;
(function (VerificationDocType) {
    VerificationDocType["DRIVING_LICENCE"] = "DRIVING_LICENCE";
    VerificationDocType["VEHICLE_REGISTRATION"] = "VEHICLE_REGISTRATION";
    VerificationDocType["INSURANCE"] = "INSURANCE";
    VerificationDocType["COLD_CHAIN_CERT"] = "COLD_CHAIN_CERT";
    VerificationDocType["BUSINESS_LICENCE"] = "BUSINESS_LICENCE";
})(VerificationDocType || (exports.VerificationDocType = VerificationDocType = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["DRAFT"] = "DRAFT";
    JobStatus["OPEN"] = "OPEN";
    JobStatus["AWARDED"] = "AWARDED";
    JobStatus["IN_TRANSIT"] = "IN_TRANSIT";
    JobStatus["DELIVERED"] = "DELIVERED";
    JobStatus["CLOSED"] = "CLOSED";
    JobStatus["EXPIRED"] = "EXPIRED";
    JobStatus["CANCELLED"] = "CANCELLED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var BidStatus;
(function (BidStatus) {
    BidStatus["ACTIVE"] = "ACTIVE";
    BidStatus["WON"] = "WON";
    BidStatus["REJECTED"] = "REJECTED";
    BidStatus["WITHDRAWN"] = "WITHDRAWN";
})(BidStatus || (exports.BidStatus = BidStatus = {}));
var TripStatus;
(function (TripStatus) {
    TripStatus["ASSIGNED"] = "ASSIGNED";
    TripStatus["EN_ROUTE_TO_PICKUP"] = "EN_ROUTE_TO_PICKUP";
    TripStatus["AT_PICKUP"] = "AT_PICKUP";
    TripStatus["LOADED"] = "LOADED";
    TripStatus["IN_TRANSIT"] = "IN_TRANSIT";
    TripStatus["AT_DROPOFF"] = "AT_DROPOFF";
    TripStatus["DELIVERED"] = "DELIVERED";
})(TripStatus || (exports.TripStatus = TripStatus = {}));
exports.TRIP_TRANSITIONS = {
    [TripStatus.ASSIGNED]: [TripStatus.EN_ROUTE_TO_PICKUP],
    [TripStatus.EN_ROUTE_TO_PICKUP]: [TripStatus.AT_PICKUP],
    [TripStatus.AT_PICKUP]: [TripStatus.LOADED],
    [TripStatus.LOADED]: [TripStatus.IN_TRANSIT],
    [TripStatus.IN_TRANSIT]: [TripStatus.AT_DROPOFF],
    [TripStatus.AT_DROPOFF]: [TripStatus.DELIVERED],
    [TripStatus.DELIVERED]: [],
};
exports.REALTIME_NAMESPACE = '/realtime';
exports.room = {
    job: (id) => `job:${id}`,
    trip: (id) => `trip:${id}`,
};
//# sourceMappingURL=index.js.map