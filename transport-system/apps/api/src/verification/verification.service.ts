import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { VerificationStatus } from '@athenagrid/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { StorageService } from './storage.service';
import { RequestUploadDto, ReviewDecisionDto } from './dto';

// Documents a carrier must have APPROVED before they are considered VERIFIED.
const REQUIRED_DOCS = ['DRIVING_LICENCE', 'VEHICLE_REGISTRATION', 'INSURANCE'];

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private storage: StorageService,
  ) {}

  /** Carrier requests a signed URL, uploads to S3, and we register the doc as PENDING. */
  async requestUpload(userId: string, dto: RequestUploadDto) {
    const carrierId = await this.users.carrierProfileId(userId);
    const key = `carriers/${carrierId}/${dto.type}/${randomUUID()}`;
    const uploadUrl = await this.storage.presignUpload(key, dto.contentType);

    const doc = await this.prisma.verificationDocument.create({
      data: { carrierId, type: dto.type as any, s3Key: key },
    });

    // Requesting a new doc moves the profile into PENDING review.
    await this.prisma.carrierProfile.update({
      where: { id: carrierId },
      data: { verificationStatus: VerificationStatus.PENDING },
    });

    return { documentId: doc.id, uploadUrl, key };
  }

  async myStatus(userId: string) {
    const carrierId = await this.users.carrierProfileId(userId);
    const profile = await this.prisma.carrierProfile.findUniqueOrThrow({
      where: { id: carrierId },
      include: { documents: true },
    });
    return {
      verificationStatus: profile.verificationStatus,
      documents: profile.documents.map((d) => ({
        id: d.id,
        type: d.type,
        status: d.status,
        reviewNote: d.reviewNote,
      })),
      requiredDocs: REQUIRED_DOCS,
    };
  }

  // ---- Admin ----

  async queue() {
    return this.prisma.verificationDocument.findMany({
      where: { status: 'PENDING' },
      include: { carrier: { select: { id: true, companyName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async decide(adminId: string, documentId: string, dto: ReviewDecisionDto) {
    const doc = await this.prisma.verificationDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.verificationDocument.update({
      where: { id: documentId },
      data: {
        status: dto.decision,
        reviewedBy: adminId,
        reviewNote: dto.note,
        reviewedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: `verification.${dto.decision.toLowerCase()}`,
        entity: 'VerificationDocument',
        entityId: documentId,
        metadata: { note: dto.note ?? null },
      },
    });

    // Recompute the carrier's overall verification status.
    return this.recomputeCarrierStatus(doc.carrierId);
  }

  /** Carrier is VERIFIED only when every REQUIRED_DOC has an APPROVED document. */
  private async recomputeCarrierStatus(carrierId: string) {
    const docs = await this.prisma.verificationDocument.findMany({ where: { carrierId } });

    const anyRejected = docs.some((d) => d.status === 'REJECTED');
    const approvedTypes = new Set(docs.filter((d) => d.status === 'APPROVED').map((d) => d.type));
    const allApproved = REQUIRED_DOCS.every((t) => approvedTypes.has(t as any));

    const status = anyRejected
      ? VerificationStatus.REJECTED
      : allApproved
        ? VerificationStatus.VERIFIED
        : VerificationStatus.PENDING;

    await this.prisma.carrierProfile.update({
      where: { id: carrierId },
      data: { verificationStatus: status },
    });
    return { carrierId, verificationStatus: status };
  }
}
