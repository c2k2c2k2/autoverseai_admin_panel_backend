import { IsOptional, IsEnum, IsISO31661Alpha3, IsString, Length, IsDateString, Validate } from 'class-validator';
import { BrandStatus } from '../entities/brand.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { IsDateAfterConstraint } from '../../../common/dto/base-filter.dto';

export class FilterBrandsDto extends PaginationDto {
    @IsOptional()
    @IsEnum(BrandStatus, { message: 'Invalid brand status' })
    status?: BrandStatus;

    @IsOptional()
    @IsString({ message: 'Country code must be a string' })
    @Length(3, 3, { message: 'Country code must be exactly 3 characters' })
    @IsISO31661Alpha3({ message: 'Country code must be a valid ISO 3166-1 alpha-3 code' })
    countryCode?: string;

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
