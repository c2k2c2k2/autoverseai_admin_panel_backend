import { applyDecorators, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { LicenseAccessGuard } from '../guards/license-access.guard';

export function LicenseAccess() {
    return applyDecorators(
        UseGuards(ClerkAuthGuard, RolesGuard, LicenseAccessGuard),
    );
}