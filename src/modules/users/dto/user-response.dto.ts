import { Exclude, Expose, Type } from 'class-transformer';
import { UserRole, UserStatus } from '../entities/user.entity';

export class UserResponseDto {
    @Expose()
    id: string;

    @Expose()
    email: string;

    @Expose()
    firstName?: string;

    @Expose()
    lastName?: string;

    @Expose()
    phone?: string;

    @Expose()
    role: UserRole;

    @Expose()
    status: UserStatus;

    @Expose()
    profileImageUrl?: string;

    @Expose()
    lastLoginAt?: Date;

    @Expose()
    emailVerifiedAt?: Date;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Expose()
    get fullName(): string {
        return [this.firstName, this.lastName].filter(Boolean).join(' ');
    }

    @Expose()
    get isAdmin(): boolean {
        return this.role === UserRole.ADMIN;
    }

    @Expose()
    get isActive(): boolean {
        return this.status === UserStatus.ACTIVE;
    }

    // Exclude sensitive fields
    @Exclude()
    clerkId?: string;

    @Exclude()
    metadata?: Record<string, any>;

    @Exclude()
    deletedAt?: Date;
}