import { IsOptional, IsEnum, IsDateString, Validate } from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { IsDateAfterConstraint } from '../../../common/dto/base-filter.dto';

export class FilterUsersDto extends PaginationDto {
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

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
