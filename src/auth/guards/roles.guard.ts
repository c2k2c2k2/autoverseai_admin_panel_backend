import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
    private readonly logger = new Logger(RolesGuard.name);

    constructor(
        private reflector: Reflector,
        private usersService: UsersService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // If auth is disabled, inject mock dbUser from env variable
        if (process.env.MOCK_ADMIN_USER_ID) {
            const mockUserId = process.env.MOCK_ADMIN_USER_ID;
            try {
                const dbUser = await this.usersService.findByClerkId(mockUserId);

                if (!dbUser) {
                    throw new ForbiddenException('Mock user not found in database');
                }

                if (!dbUser.isActive) {
                    throw new ForbiddenException('Mock user account is not active');
                }

                request.dbUser = dbUser;

                const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
                    ROLES_KEY,
                    [context.getHandler(), context.getClass()],
                );

                if (!requiredRoles) {
                    return true;
                }

                const hasRole = requiredRoles.some((role) => dbUser.role === role);

                if (!hasRole) {
                    throw new ForbiddenException(
                        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
                    );
                }

                return true;
            } catch (error) {
                this.logger.error(`Role verification failed: ${error.message}`);
                throw new ForbiddenException('Access denied');
            }
        }

        // If no mock user id, deny access (since auth is disabled)
        throw new ForbiddenException('User not authenticated');
    }
}