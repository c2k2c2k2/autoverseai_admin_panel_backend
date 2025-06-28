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
        // TODO: TESTING MODE - Remove this return statement to restore auth
        return true;

        /* ORIGINAL AUTH LOGIC - COMMENTED OUT FOR TESTING
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        try {
            // Get user from database to check role
            const dbUser = await this.usersService.findByClerkId(user.id);

            if (!dbUser) {
                throw new ForbiddenException('User not found in database');
            }

            if (!dbUser.isActive) {
                throw new ForbiddenException('User account is not active');
            }

            // Attach database user to request
            request.dbUser = dbUser;

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
        */
    }
}