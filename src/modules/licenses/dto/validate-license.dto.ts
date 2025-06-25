import {
    IsString,
    IsOptional,
    IsObject,
    MinLength,
    MaxLength,
} from 'class-validator';

export class ValidateLicenseDto {
    @IsString()
    @MinLength(1)
    licenseKey: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    password: string;

    @IsOptional()
    @IsObject()
    deviceFingerprint?: Record<string, any>;
}