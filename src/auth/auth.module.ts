import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkService } from './clerk.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../modules/users/users.module';

@Module({
    imports: [
        ConfigModule,
        UsersModule
    ],
    providers: [ClerkService, ClerkAuthGuard, RolesGuard],
    exports: [ClerkService, ClerkAuthGuard, RolesGuard],
})
export class AuthModule { }
