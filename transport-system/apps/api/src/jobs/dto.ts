import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class GeoPointDto {
  @IsNumber() @Min(-90) @Max(90) lat!: number;
  @IsNumber() @Min(-180) @Max(180) lng!: number;
  @IsOptional() @IsString() address?: string;
}

class CargoDto {
  @IsString() cropType!: string;
  @IsNumber() @Min(0) weightKg!: number;
  @IsNumber() @Min(0) volumeM3!: number;
  @IsNumber() @Min(0) @Max(1) perishabilityIndex!: number;
  @IsBoolean() coldChainRequired!: boolean;
}

export class CreateJobDto {
  @ValidateNested() @Type(() => GeoPointDto) pickup!: GeoPointDto;
  @ValidateNested() @Type(() => GeoPointDto) dropoff!: GeoPointDto;
  @ValidateNested() @Type(() => CargoDto) cargo!: CargoDto;

  @IsDateString() pickupWindowStart!: string;
  @IsDateString() pickupWindowEnd!: string;
  @IsDateString() biddingClosesAt!: string;

  @IsOptional() @IsNumber() @Min(0) budgetCeiling?: number;
}

export class SearchJobsDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) @IsNumber() nearLat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() nearLng?: number;
  @IsOptional() @Type(() => Number) @IsNumber() radiusKm?: number;
  @IsOptional() @Type(() => Boolean) @IsBoolean() coldChainOnly?: boolean;
}
