"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const password_1 = require("../src/common/password");
const prisma = new client_1.PrismaClient();
async function main() {
    const pw = (0, password_1.hashPassword)('password123');
    const shipper = await prisma.user.upsert({
        where: { email: 'farmer@athenagrid.dev' },
        update: {},
        create: { role: 'SHIPPER', email: 'farmer@athenagrid.dev', passwordHash: pw, fullName: 'Fresno Farm Co' },
    });
    await prisma.user.upsert({
        where: { email: 'admin@athenagrid.dev' },
        update: {},
        create: { role: 'ADMIN', email: 'admin@athenagrid.dev', passwordHash: pw, fullName: 'Ops Admin' },
    });
    const carrierUser = await prisma.user.upsert({
        where: { email: 'carrier@athenagrid.dev' },
        update: {},
        create: {
            role: 'CARRIER',
            email: 'carrier@athenagrid.dev',
            passwordHash: pw,
            fullName: 'ColdHaul Logistics',
            carrierProfile: {
                create: { companyName: 'ColdHaul Logistics', fleetSize: 3, verificationStatus: 'VERIFIED' },
            },
        },
        include: { carrierProfile: true },
    });
    const carrierId = carrierUser.carrierProfile.id;
    await prisma.vehicle.createMany({
        data: [
            { carrierId, plate: 'CA-COLD-1', capacityKg: 5000, volumeM3: 30, refrigerated: true },
            { carrierId, plate: 'CA-DRY-2', capacityKg: 8000, volumeM3: 40, refrigerated: false },
        ],
        skipDuplicates: true,
    });
    await prisma.job.create({
        data: {
            shipperId: shipper.id,
            status: 'OPEN',
            pickupLat: 36.7378,
            pickupLng: -119.7871,
            pickupAddress: 'Fresno, CA',
            dropoffLat: 34.0522,
            dropoffLng: -118.2437,
            dropoffAddress: 'Los Angeles, CA',
            cropType: 'Strawberries',
            weightKg: 4200,
            volumeM3: 22,
            perishabilityIndex: 0.82,
            coldChainRequired: true,
            pickupWindowStart: new Date(Date.now() + 6 * 3600_000),
            pickupWindowEnd: new Date(Date.now() + 12 * 3600_000),
            biddingClosesAt: new Date(Date.now() + 3 * 3600_000),
            budgetCeiling: 1200,
        },
    });
    console.log('Seed complete. Login with password123 for farmer@/carrier@/admin@athenagrid.dev');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map