import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { License } from '../../licenses/entities/license.entity';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending',
    SUSPENDED = 'suspended',
}

@Entity('users')
@Index(['email'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['clerkId'], { unique: true, where: '"clerkId" IS NOT NULL AND "deletedAt" IS NULL' })
export class User extends BaseEntity {
    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    firstName?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    lastName?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone?: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.PENDING,
    })
    status: UserStatus;

    @Column({ type: 'varchar', length: 255, nullable: true })
    clerkId?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    profileImageUrl?: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @Column({ type: 'timestamptz', nullable: true })
    lastLoginAt?: Date;

    @Column({ type: 'timestamptz', nullable: true })
    emailVerifiedAt?: Date;

    // Relations
    @OneToMany(() => License, (license) => license.user)
    licenses: License[];

    // Virtual properties
    get fullName(): string {
        return [this.firstName, this.lastName].filter(Boolean).join(' ');
    }

    get isAdmin(): boolean {
        return this.role === UserRole.ADMIN;
    }

    get isActive(): boolean {
        return this.status === UserStatus.ACTIVE;
    }
}