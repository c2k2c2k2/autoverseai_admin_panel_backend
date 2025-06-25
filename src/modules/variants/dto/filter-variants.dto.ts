import {
    IsOptional,
    IsEnum,
    IsUUID,
    IsNumber,
    IsBoolean,
    Min,
    Validate,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VariantStatus, TransmissionType, DriveType } from '../entities/variant.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { IsDateAfterConstraint } from '../../../common/dto/base-filter.dto';

@ValidatorConstraint({ name: 'isVariantPriceRangeValid', async: false })
export class IsVariantPriceRangeValidConstraint implements ValidatorConstraintInterface {
    validate(maxPrice: number, args: ValidationArguments) {
        const minPrice = (args.object as any).minPrice;
        
        if (maxPrice === undefined || minPrice === undefined) {
            return true; // Skip validation if either price is not provided
        }
        
        return maxPrice > minPrice;
    }

    defaultMessage(args: ValidationArguments) {
        return 'maxPrice must be greater than minPrice';
    }
}

export class FilterVariantsDto extends PaginationDto {
    @IsOptional()
    @IsUUID('4', { message: 'brandId must be a valid UUID v4' })
    brandId?: string;

    @IsOptional()
    @IsUUID('4', { message: 'carId must be a valid UUID v4' })
    carId?: string;

    @IsOptional()
    @IsEnum(VariantStatus, { message: 'Invalid variant status' })
    status?: VariantStatus;

    @IsOptional()
    @IsEnum(TransmissionType, { message: 'Invalid transmission type' })
    transmission?: TransmissionType;

    @IsOptional()
    @IsEnum(DriveType, { message: 'Invalid drive type' })
    driveType?: DriveType;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === null || value === undefined || value === '') {
            return undefined;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed;
    })
    @IsNumber({}, { message: 'Minimum price must be a number' })
    @Min(0, { message: 'Minimum price cannot be negative' })
    minPrice?: number;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === null || value === undefined || value === '') {
            return undefined;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed;
    })
    @IsNumber({}, { message: 'Maximum price must be a number' })
    @Min(0, { message: 'Maximum price cannot be negative' })
    @Validate(IsVariantPriceRangeValidConstraint)
    maxPrice?: number;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === null || value === undefined || value === '') {
            return undefined;
        }
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            if (lowerValue === 'true' || lowerValue === '1') return true;
            if (lowerValue === 'false' || lowerValue === '0') return false;
        }
        return value;
    })
    @IsBoolean({ message: 'isAvailable must be a boolean value (true/false)' })
    isAvailable?: boolean;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === null || value === undefined || value === '') {
            return undefined;
        }
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            if (lowerValue === 'true' || lowerValue === '1') return true;
            if (lowerValue === 'false' || lowerValue === '0') return false;
        }
        return value;
    })
    @IsBoolean({ message: 'inStock must be a boolean value (true/false)' })
    inStock?: boolean;

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
