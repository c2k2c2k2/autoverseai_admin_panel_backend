import {
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
    IsNumber,
    IsBoolean,
    IsUrl,
    IsObject,
    MinLength,
    MaxLength,
    Min,
    IsUUID,
    Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VariantStatus, TransmissionType, DriveType } from '../entities/variant.entity';

export class CreateVariantDto {
    @IsUUID()
    brandId: string;

    @IsUUID()
    carId: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    @Transform(({ value }) => value?.trim())
    description?: string;

    @IsOptional()
    @IsEnum(VariantStatus)
    status?: VariantStatus;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(3)
    currency?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discountedPrice?: number;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    engineCapacity?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    horsePower?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    torque?: number;

    @IsOptional()
    @IsEnum(TransmissionType)
    transmission?: TransmissionType;

    @IsOptional()
    @IsEnum(DriveType)
    driveType?: DriveType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    fuelEfficiency?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    seatingCapacity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    bootSpace?: number;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    color?: string;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'Color code must be a valid hex color code (e.g., #FF0000)',
    })
    colorCode?: string;

    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true })
    imageUrls?: string[];

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    stockQuantity?: number;

    @IsOptional()
    @IsObject()
    specifications?: Record<string, any>;

    @IsOptional()
    @IsObject()
    features?: Record<string, any>;
}