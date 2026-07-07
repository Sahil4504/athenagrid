import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CarrierType, ShipperType, UserRole } from '@athenagrid/shared';

export class RegisterDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // SHIPPER: FARMER or INDUSTRY
  @IsOptional()
  @IsEnum(ShipperType)
  shipperType?: ShipperType;

  // CARRIER: COMPANY (a fleet operator) or INDIVIDUAL (owner-operator driver).
  @IsOptional()
  @IsEnum(CarrierType)
  carrierType?: CarrierType;

  // CARRIER (company) name
  @IsOptional()
  @IsString()
  companyName?: string;

  // DRIVER / INDIVIDUAL licence
  @IsOptional()
  @IsString()
  licenceNo?: string;

  // INDIVIDUAL starter vehicle (so they can bid immediately)
  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsNumber()
  vehicleCapacityKg?: number;

  @IsOptional()
  @IsBoolean()
  vehicleRefrigerated?: boolean;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
