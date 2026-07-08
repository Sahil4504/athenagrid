import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/common/password';

const prisma = new PrismaClient();

async function main() {
  const pw = hashPassword('password123');

  // Shipper (a farmer) — located in Fresno, CA for marketplace proximity
  const farmerLoc = { address: '123 Orchard Rd, Fresno, CA', postalCode: '93721', lat: 36.7378, lng: -119.7871 };
  const shipper = await prisma.user.upsert({
    where: { email: 'farmer@athenagrid.dev' },
    update: { shipperType: 'FARMER', ...farmerLoc },
    create: { role: 'SHIPPER', email: 'farmer@athenagrid.dev', passwordHash: pw, fullName: 'Fresno Farm Co', shipperType: 'FARMER', ...farmerLoc },
  });

  // Shipper (an industry — sells essentials / buys crops)
  await prisma.user.upsert({
    where: { email: 'industry@athenagrid.dev' },
    update: { shipperType: 'INDUSTRY' },
    create: { role: 'SHIPPER', email: 'industry@athenagrid.dev', passwordHash: pw, fullName: 'AgriSupply Co', shipperType: 'INDUSTRY' },
  });

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@athenagrid.dev' },
    update: {},
    create: { role: 'ADMIN', email: 'admin@athenagrid.dev', passwordHash: pw, fullName: 'Ops Admin' },
  });

  // Verified carrier with a refrigerated vehicle
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

  const carrierId = carrierUser.carrierProfile!.id;
  await prisma.vehicle.createMany({
    data: [
      { carrierId, plate: 'CA-COLD-1', capacityKg: 5000, volumeM3: 30, refrigerated: true },
      { carrierId, plate: 'CA-DRY-2', capacityKg: 8000, volumeM3: 40, refrigerated: false },
    ],
    skipDuplicates: true,
  });

  // A driver employed by the carrier — auto-assigned to trips this carrier wins.
  await prisma.user.upsert({
    where: { email: 'driver@athenagrid.dev' },
    update: {},
    create: {
      role: 'DRIVER',
      email: 'driver@athenagrid.dev',
      passwordHash: pw,
      fullName: 'Danny Driver',
      driverProfile: { create: { licenceNo: 'DL-99-2211', carrierId, verificationStatus: 'VERIFIED' } },
    },
  });

  // A SECOND competing company carrier (+ its own driver), so the shipper gets
  // multiple bids and can still track the delivery whichever carrier wins.
  if (!(await prisma.user.findUnique({ where: { email: 'carrier2@athenagrid.dev' } }))) {
    const carrier2 = await prisma.user.create({
      data: {
        role: 'CARRIER',
        email: 'carrier2@athenagrid.dev',
        passwordHash: pw,
        fullName: 'ValleyFreight Inc',
        carrierProfile: {
          create: { companyName: 'ValleyFreight Inc', type: 'COMPANY', fleetSize: 5, verificationStatus: 'VERIFIED' },
        },
      },
      include: { carrierProfile: true },
    });
    const carrier2Id = carrier2.carrierProfile!.id;
    await prisma.vehicle.create({
      data: { carrierId: carrier2Id, plate: 'CA-COLD-9', capacityKg: 6000, volumeM3: 34, refrigerated: true },
    });
    await prisma.user.create({
      data: {
        role: 'DRIVER',
        email: 'driver2@athenagrid.dev',
        passwordHash: pw,
        fullName: 'Val Driver',
        driverProfile: { create: { licenceNo: 'DL-77-8899', carrierId: carrier2Id, verificationStatus: 'VERIFIED' } },
      },
    });
  }

  // An INDIVIDUAL owner-operator — one person who bids AND drives.
  if (!(await prisma.user.findUnique({ where: { email: 'indie@athenagrid.dev' } }))) {
    const indie = await prisma.user.create({
      data: {
        role: 'CARRIER',
        email: 'indie@athenagrid.dev',
        passwordHash: pw,
        fullName: 'Ravi Owner-Operator',
        carrierProfile: {
          create: { companyName: 'Ravi Owner-Operator', type: 'INDIVIDUAL', fleetSize: 1, verificationStatus: 'VERIFIED' },
        },
      },
      include: { carrierProfile: true },
    });
    const indieCarrierId = indie.carrierProfile!.id;
    await prisma.vehicle.create({
      data: { carrierId: indieCarrierId, plate: 'CA-IND-7', capacityKg: 4500, volumeM3: 20, refrigerated: true },
    });
    await prisma.driverProfile.create({
      data: { userId: indie.id, carrierId: indieCarrierId, licenceNo: 'DL-IND-01', verificationStatus: 'VERIFIED' },
    });
  }

  // An open, cold-chain job near Fresno, CA (only seed once)
  const existingJobs = await prisma.job.count();
  if (existingJobs === 0)
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

  // Backfill a fair-price band on any job created before pricing existed.
  const hav = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const R = 6371, dLat = ((bLat - aLat) * Math.PI) / 180, dLng = ((bLng - aLng) * Math.PI) / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  };
  const r2 = (n: number) => Math.round(n * 100) / 100;
  for (const j of await prisma.job.findMany({ where: { referencePrice: null } })) {
    const d = hav(j.pickupLat, j.pickupLng, j.dropoffLat, j.dropoffLng);
    let ref = 40 + 1.1 * d + 0.35 * (j.weightKg / 1000) * d;
    if (j.coldChainRequired) ref *= 1.18;
    ref *= 1 + 0.1 * Math.min(1, Math.max(0, j.perishabilityIndex));
    await prisma.job.update({
      where: { id: j.id },
      data: { referencePrice: r2(ref), floorPrice: r2(ref * 0.8), ceilingPrice: r2(ref * 1.25) },
    });
  }

  // Backfill shipperType on any older shipper rows.
  await prisma.user.updateMany({
    where: { role: 'SHIPPER', shipperType: null },
    data: { shipperType: 'FARMER' },
  });

  // Dummy industries (vendors of farming essentials) with catalogs — seed once.
  if ((await prisma.industry.count()) === 0) {
    // NOTE: no emojis stored in the DB (local embedded Postgres uses WIN1252 which
    // can't hold them). The UI renders an icon by category instead.
    const industries = [
      {
        name: 'Fresno AgriSupply', address: '900 Ag Way', city: 'Fresno', state: 'CA', postalCode: '93721', lat: 36.7378, lng: -119.7871,
        items: [
          { name: 'Tomato Seeds', category: 'SEEDS', unit: 'bag', pricePerUnit: 45, weightKgPerUnit: 1 },
          { name: 'Organic Pesticide', category: 'PESTICIDES', unit: 'litre', pricePerUnit: 30, weightKgPerUnit: 1.2 },
          { name: 'NPK Fertilizer', category: 'FERTILIZER', unit: 'bag', pricePerUnit: 60, weightKgPerUnit: 50 },
          { name: 'Hand Trowel', category: 'TOOLS', unit: 'piece', pricePerUnit: 12, weightKgPerUnit: 0.5 },
        ],
      },
      {
        name: 'Salinas Farm Depot', address: '210 Valley Blvd', city: 'Salinas', state: 'CA', postalCode: '93901', lat: 36.6777, lng: -121.6555,
        items: [
          { name: 'Tomato Seeds', category: 'SEEDS', unit: 'bag', pricePerUnit: 42, weightKgPerUnit: 1 },
          { name: 'Corn Seeds', category: 'SEEDS', unit: 'bag', pricePerUnit: 38, weightKgPerUnit: 1 },
          { name: 'Fungicide', category: 'PESTICIDES', unit: 'litre', pricePerUnit: 34, weightKgPerUnit: 1.2 },
          { name: 'Pruning Shears', category: 'TOOLS', unit: 'piece', pricePerUnit: 18, weightKgPerUnit: 0.4 },
        ],
      },
      {
        name: 'Bakersfield Growers Mart', address: '55 Harvest St', city: 'Bakersfield', state: 'CA', postalCode: '93301', lat: 35.3733, lng: -119.0187,
        items: [
          { name: 'NPK Fertilizer', category: 'FERTILIZER', unit: 'bag', pricePerUnit: 55, weightKgPerUnit: 50 },
          { name: 'Compost', category: 'FERTILIZER', unit: 'bag', pricePerUnit: 25, weightKgPerUnit: 40 },
          { name: 'Organic Pesticide', category: 'PESTICIDES', unit: 'litre', pricePerUnit: 28, weightKgPerUnit: 1.2 },
          { name: 'Hand Trowel', category: 'TOOLS', unit: 'piece', pricePerUnit: 10, weightKgPerUnit: 0.5 },
        ],
      },
    ];
    for (const ind of industries) {
      const { items, ...data } = ind;
      await prisma.industry.create({
        data: { ...data, catalog: { create: items as any } },
      });
    }
  }

  console.log(
    'Seed complete (password123): farmer@ + industry@ (shippers), carrier@ + carrier2@ ' +
      '(transport companies), indie@ (individual driver), admin@ — all @athenagrid.dev',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
