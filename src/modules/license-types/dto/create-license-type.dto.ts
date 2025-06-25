import {
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
    IsBoolean,
    IsNumber,
    IsUrl,
    MinLength,
    MaxLength,
    Min,
    Max,
    IsObject,
    ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LicenseTypeStatus, PlatformType } from '../entities/license-type.entity';

export class CreateLicenseTypeDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    name: string;

    @IsString()
    @MinLength(1)
    @MaxLength(50)
    @Transform(({ value }) => value?.trim().toUpperCase())
    code: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    @Transform(({ value }) => value?.trim())
    description?: string;

    @IsOptional()
    @IsEnum(LicenseTypeStatus)
    status?: LicenseTypeStatus;

    @IsOptional()
    @IsArray()
    @IsEnum(PlatformType, { each: true })
    supportedPlatforms?: PlatformType[];

    @IsOptional()
    @IsUrl()
    downloadUrl?: string;

    @IsOptional()
    @IsUrl()
    iconUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    version?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    maxUsers?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(3650) // Max 10 years
    validityDays?: number;

    @IsOptional()
    @IsBoolean()
    requiresActivation?: boolean;

    @IsOptional()
    @IsBoolean()
    allowMultipleDevices?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    maxDevices?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(3)
    currency?: string;

    @IsOptional()
    @IsObject()
    systemRequirements?: Record<string, any>;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    features?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}