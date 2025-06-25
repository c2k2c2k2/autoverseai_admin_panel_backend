import {
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
    IsNumber,
    IsUrl,
    IsObject,
    MinLength,
    MaxLength,
    Min,
    Max,
    IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CarStatus, CarType, FuelType } from '../entities/car.entity';

export class CreateCarDto {
    @IsUUID()
    brandId: string;

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
    @IsEnum(CarStatus)
    status?: CarStatus;

    @IsOptional()
    @IsEnum(CarType)
    type?: CarType;

    @IsOptional()
    @IsArray()
    @IsEnum(FuelType, { each: true })
    fuelTypes?: FuelType[];

    @IsOptional()
    @IsNumber()
    @Min(1900)
    @Max(2100)
    launchYear?: number;

    @IsOptional()
    @IsNumber()
    @Min(1900)
    @Max(2100)
    discontinuedYear?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    startingPrice?: number;

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(3)
    currency?: string;

    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true })
    imageUrls?: string[];

    @IsOptional()
    @IsObject()
    specifications?: Record<string, any>;

    @IsOptional()
    @IsObject()
    features?: Record<string, any>;
}
