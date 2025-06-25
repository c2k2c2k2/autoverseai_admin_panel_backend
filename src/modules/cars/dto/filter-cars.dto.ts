import {
    IsOptional,
    IsEnum,
    IsUUID,
    IsNumber,
    Min,
    Max,
    Validate,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CarStatus, CarType, FuelType } from '../entities/car.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { IsDateAfterConstraint } from '../../../common/dto/base-filter.dto';

@ValidatorConstraint({ name: 'isPriceRangeValid', async: false })
export class IsPriceRangeValidConstraint implements ValidatorConstraintInterface {
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

export class FilterCarsDto extends PaginationDto {
    @IsOptional()
    @IsUUID('4', { message: 'brandId must be a valid UUID v4' })
    brandId?: string;

    @IsOptional()
    @IsEnum(CarStatus, { message: 'Invalid car status' })
    status?: CarStatus;

    @IsOptional()
    @IsEnum(CarType, { message: 'Invalid car type' })
    type?: CarType;

    @IsOptional()
    @IsEnum(FuelType, { message: 'Invalid fuel type' })
    fuelType?: FuelType;

    @IsOptional()
    @Transform(({ value }) => {
        const parsed = parseInt(value);
        return isNaN(parsed) ? value : parsed;
    })
    @IsNumber({}, { message: 'Launch year must be a number' })
    @Min(1900, { message: 'Launch year must be 1900 or later' })
    @Max(new Date().getFullYear() + 5, { message: 'Launch year cannot be more than 5 years in the future' })
    launchYear?: number;

    @IsOptional()
    @Transform(({ value }) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed;
    })
    @IsNumber({}, { message: 'Minimum price must be a number' })
    @Min(0, { message: 'Minimum price cannot be negative' })
    minPrice?: number;

    @IsOptional()
    @Transform(({ value }) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed;
    })
    @IsNumber({}, { message: 'Maximum price must be a number' })
    @Min(0, { message: 'Maximum price cannot be negative' })
    @Validate(IsPriceRangeValidConstraint)
    maxPrice?: number;

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
