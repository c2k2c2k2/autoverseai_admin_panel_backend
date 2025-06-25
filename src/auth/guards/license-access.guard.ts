import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { LicensesService } from '../../modules/licenses/licenses.service';

@Injectable()
export class LicenseAccessGuard implements CanActivate {
    private readonly logger = new Logger(LicenseAccessGuard.name);

    constructor(private licensesService: LicensesService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.dbUser || request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Admin users bypass license checks
        if (user.isAdmin) {
            return true;
        }

        const licenseId = request.params.licenseId || request.body.licenseId;

        if (!licenseId) {
            throw new ForbiddenException('License ID required');
        }

        try {
            const license = await this.licensesService.findOne(licenseId);

            if (!license) {
                throw new ForbiddenException('License not found');
            }

            if (license.userId !== user.id) {
                throw new ForbiddenException('Access denied to this license');
            }

            if (!license.canAccess) {
                throw new ForbiddenException('License access not allowed');
            }

            // Attach license to request
            request.license = license;

            return true;
        } catch (error) {
            this.logger.error(`License access verification failed: ${error.message}`);
            throw new ForbiddenException('License access denied');
        }
    }
}