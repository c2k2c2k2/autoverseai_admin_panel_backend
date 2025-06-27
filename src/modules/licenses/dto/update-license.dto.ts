import {
    IsOptional,
    IsEnum,
    IsDateString,
    IsString,
    IsNumber,
    Min,
    Max,
    MaxLength,
} from 'class-validator';
import { LicenseStatus } from '../entities/license.entity';

export class UpdateLicenseDto {
    @IsOptional()
    @IsEnum(LicenseStatus)
    status?: LicenseStatus;

    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxAccessCount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    maxDevices?: number;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;
}