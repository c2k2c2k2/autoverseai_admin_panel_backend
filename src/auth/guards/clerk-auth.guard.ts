import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClerkService } from '../clerk.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
    private readonly logger = new Logger(ClerkAuthGuard.name);

    constructor(
        private clerkService: ClerkService,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // TODO: TESTING MODE - Remove this return statement to restore auth
        return true;

        /* ORIGINAL AUTH LOGIC - COMMENTED OUT FOR TESTING
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No valid authorization header found');
        }

        const token = authHeader.substring(7);

        try {
            const payload = await this.clerkService.verifyToken(token);

            // Attach user info to request
            request.user = {
                id: payload.sub,
                email: payload.email,
                firstName: payload.first_name,
                lastName: payload.last_name,
                imageUrl: payload.image_url,
                ...payload,
            };

            return true;
        } catch (error) {
            this.logger.error(`Token verification failed: ${error.message}`);
            throw new UnauthorizedException('Invalid or expired token');
        }
        */
    }
}