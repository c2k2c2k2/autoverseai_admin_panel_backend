import { IsOptional, IsEnum } from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';

export class FilterUsersDto extends BaseFilterDto {
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;
}