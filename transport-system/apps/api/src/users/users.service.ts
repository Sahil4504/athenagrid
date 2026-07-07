import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        carrierProfile: { include: { vehicles: true } },
        driverProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  /** Resolve the CarrierProfile id for a CARRIER user (used by bids/verification). */
  async carrierProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Carrier profile not found');
    return profile.id;
  }
}
