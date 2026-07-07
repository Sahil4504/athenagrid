import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { VerificationDocType } from '@athenagrid/shared';

export class RequestUploadDto {
  @IsEnum(VerificationDocType)
  type!: VerificationDocType;

  @IsString()
  contentType!: string; // e.g. image/jpeg, application/pdf
}

export class ReviewDecisionDto {
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  note?: string;
}
