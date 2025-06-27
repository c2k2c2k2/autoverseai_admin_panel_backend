import { applyDecorators, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

export function Auth() {
    return applyDecorators(
        UseGuards(ClerkAuthGuard, RolesGuard),
    );
}