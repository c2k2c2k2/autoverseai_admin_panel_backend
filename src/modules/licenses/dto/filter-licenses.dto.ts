import {
    IsOptional,
    IsEnum,
    IsUUID,
    IsBoolean,
    IsNumber,
    Min,
    Max,
    IsDateString,
    Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LicenseStatus } from '../entities/license.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { IsDateAfterConstraint } from '../../../common/dto/base-filter.dto';

export class FilterLicensesDto extends PaginationDto {
    @IsOptional()
    @IsEnum(LicenseStatus)
    status?: LicenseStatus;

    @IsOptional()
    @IsUUID()
    licenseTypeId?: string;

    @IsOptional()
    @IsUUID()
    userId?: string;

    @IsOptional()
    @IsUUID()
    brandId?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isExpired?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(365)
    @Transform(({ value }) => parseInt(value))
    expiringInDays?: number;

    @IsOptional()
    @IsDateString({}, { message: 'createdAfter must be a valid ISO 8601 date string' })
    createdAfter?: string;

    @IsOptional()
    @IsDateString({}, { message: 'createdBefore must be a valid ISO 8601 date string' })
    @Validate(IsDateAfterConstraint, ['createdAfter'])
    createdBefore?: string;

    @IsOptional()
    @IsDateString({}, { message: 'updatedAfter must be a valid ISO 8601 date string' })
    updatedAfter?: string;

    @IsOptional()
    @IsDateString({}, { message: 'updatedBefore must be a valid ISO 8601 date string' })
    @Validate(IsDateAfterConstraint, ['updatedAfter'])
    updatedBefore?: string;
}
