import {
    IsString,
    IsOptional,
    IsEnum,
    MinLength,
    MaxLength,
    IsUrl,
    Matches,
    IsISO31661Alpha3,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BrandStatus } from '../entities/brand.entity';

export class CreateBrandDto {
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
    @IsUrl()
    logoUrl?: string;

    @IsOptional()
    @IsUrl()
    websiteUrl?: string;

    @IsOptional()
    @IsEnum(BrandStatus)
    status?: BrandStatus;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'Primary color must be a valid hex color code (e.g., #FF0000)',
    })
    primaryColor?: string;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'Secondary color must be a valid hex color code (e.g., #00FF00)',
    })
    secondaryColor?: string;

    @IsOptional()
    @IsISO31661Alpha3()
    countryCode?: string;
}
