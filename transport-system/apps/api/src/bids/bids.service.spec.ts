import { ForbiddenException } from '@nestjs/common';
import { VerificationStatus } from '@athenagrid/shared';
import { BidsService } from './bids.service';

describe('BidsService — verification gate', () => {
  const makeService = (verificationStatus: VerificationStatus) => {
    const prisma: any = {
      carrierProfile: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'car_1', verificationStatus }),
      },
      vehicle: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    const users: any = { carrierProfileId: jest.fn().mockResolvedValue('car_1') };
    const realtime: any = { emitToJob: jest.fn() };
    const pricing: any = { settle: jest.fn(), rankBids: jest.fn(), computeBand: jest.fn() };
    return { service: new BidsService(prisma, users, realtime, pricing), prisma };
  };

  it('rejects a bid from an UNVERIFIED carrier before touching the auction', async () => {
    const { service, prisma } = makeService(VerificationStatus.UNVERIFIED);
    await expect(
      service.placeBid('user_1', 'job_1', { amount: 900, etaMinutes: 120, vehicleId: 'veh_1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    // Should never reach the transactional auction path.
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('lets a VERIFIED carrier proceed past the verification gate', async () => {
    const { service, prisma } = makeService(VerificationStatus.VERIFIED);
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'veh_1',
      carrierId: 'car_1',
      refrigerated: true,
      capacityKg: 10000,
    });
    prisma.$transaction.mockResolvedValue({ id: 'bid_1', etaMinutes: 120, amount: 900 });

    const bid = await service.placeBid('user_1', 'job_1', {
      amount: 900,
      etaMinutes: 120,
      vehicleId: 'veh_1',
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(bid).toHaveProperty('id', 'bid_1');
  });
});
