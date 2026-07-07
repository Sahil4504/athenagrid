import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  AuthTokens,
  CarrierType,
  JwtPayload,
  ShipperType,
  UserRole,
  VerificationStatus,
} from '@athenagrid/shared';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from '../common/password';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = hashPassword(dto.password);
    const carrierType = dto.carrierType ?? CarrierType.COMPANY;
    const isIndividual = dto.role === UserRole.CARRIER && carrierType === CarrierType.INDIVIDUAL;
    // For open test deployments, auto-verify carriers so testers can bid immediately.
    const initialStatus =
      this.config.get('AUTO_VERIFY_CARRIERS') === 'true'
        ? VerificationStatus.VERIFIED
        : VerificationStatus.UNVERIFIED;

    const user = await this.prisma.user.create({
      data: {
        role: dto.role,
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        shipperType:
          dto.role === UserRole.SHIPPER ? (dto.shipperType ?? ShipperType.FARMER) : undefined,
        // Create the role-specific profile in the same write.
        carrierProfile:
          dto.role === UserRole.CARRIER
            ? {
                create: {
                  companyName: dto.companyName ?? dto.fullName,
                  type: carrierType,
                  verificationStatus: initialStatus,
                },
              }
            : undefined,
        driverProfile:
          dto.role === UserRole.DRIVER
            ? { create: { licenceNo: dto.licenceNo ?? 'PENDING' } }
            : undefined,
      },
      include: { carrierProfile: true },
    });

    // Individual = one person who both bids (as carrier) and drives. Give them a
    // driver profile (same user) and a starter vehicle so they can bid right away.
    if (isIndividual && user.carrierProfile) {
      await this.prisma.driverProfile.create({
        data: {
          userId: user.id,
          carrierId: user.carrierProfile.id,
          licenceNo: dto.licenceNo ?? 'PENDING',
          verificationStatus: initialStatus,
        },
      });
      await this.prisma.vehicle.create({
        data: {
          carrierId: user.carrierProfile.id,
          plate: dto.vehiclePlate ?? 'MY-VEHICLE',
          capacityKg: dto.vehicleCapacityKg ?? 3000,
          volumeM3: 15,
          refrigerated: dto.vehicleRefrigerated ?? false,
        },
      });
    }

    // Company carrier: a starter fleet vehicle so they can bid immediately (fleet
    // management UI comes later). The company itself runs its won deliveries.
    if (dto.role === UserRole.CARRIER && !isIndividual && user.carrierProfile) {
      await this.prisma.vehicle.create({
        data: {
          carrierId: user.carrierProfile.id,
          plate: 'FLEET-1',
          capacityKg: 8000,
          volumeM3: 40,
          refrigerated: true,
        },
      });
    }

    return this.issueTokens({ sub: user.id, role: user.role as UserRole, email: user.email });
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = verifyPassword(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens({ sub: user.id, role: user.role as UserRole, email: user.email });
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      return this.issueTokens({ sub: payload.sub, role: payload.role, email: payload.email });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async issueTokens(payload: JwtPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: Number(this.config.get('JWT_ACCESS_TTL', 900)),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: Number(this.config.get('JWT_REFRESH_TTL', 1209600)),
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
