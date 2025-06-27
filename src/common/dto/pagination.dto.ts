import { IsOptional, IsPositive, Min, Max, IsEnum, IsString, MinLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC'
}

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9\s]*$/, {
        message: 'Search term can only contain letters, numbers and spaces'
    })
    search?: string;

    @IsOptional()
    @IsString()
    @Matches(/^([a-zA-Z][a-zA-Z0-9]*)?$/, {
        message: 'Sort column must start with a letter and contain only letters and numbers'
    })
    sortBy?: string;

    @IsOptional()
    @IsEnum(SortOrder, {
        message: 'Sort order must be either ASC or DESC'
    })
    sortOrder?: SortOrder = SortOrder.DESC;
}