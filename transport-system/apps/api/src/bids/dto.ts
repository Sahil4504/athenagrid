import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PlaceBidDto {
  @IsNumber() @Min(0) amount!: number;
  @IsInt() @Min(1) etaMinutes!: number;
  @IsString() vehicleId!: string;
  @IsOptional() @IsString() message?: string;
}

export class AwardDto {
  @IsString() bidId!: string;
  @IsOptional() @IsString() driverId?: string;
}
