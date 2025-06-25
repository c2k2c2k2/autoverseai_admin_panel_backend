import { applyDecorators, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';

export function AdminOnly() {
    return applyDecorators(
        Roles(UserRole.ADMIN),
        UseGuards(ClerkAuthGuard, RolesGuard),
    );
}