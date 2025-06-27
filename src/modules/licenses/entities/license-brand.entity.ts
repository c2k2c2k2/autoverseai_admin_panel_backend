// src/modules/licenses/entities/license-brand.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { License } from './license.entity';
import { Brand } from '../../brands/entities/brand.entity';

export enum LicenseBrandStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

@Entity('license_brands')
@Unique(['licenseId', 'brandId'])
@Index(['licenseId'])
@Index(['brandId'])
@Index(['status'])
export class LicenseBrand extends BaseEntity {
    @Column({
        type: 'enum',
        enum: LicenseBrandStatus,
        default: LicenseBrandStatus.ACTIVE,
    })
    status: LicenseBrandStatus;

    @Column({ type: 'timestamptz', nullable: true })
    activatedAt?: Date;

    @Column({ type: 'timestamptz', nullable: true })
    expiresAt?: Date;

    @Column({ type: 'integer', default: 0 })
    accessCount: number;

    @Column({ type: 'timestamptz', nullable: true })
    lastAccessedAt?: Date;

    @Column({ type: 'jsonb', nullable: true })
    permissions?: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    restrictions?: Record<string, any>;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    // Audit fields
    @Column({ type: 'uuid', nullable: true })
    assignedBy?: string; // User ID who assigned this brand to license

    @Column({ type: 'timestamptz', nullable: true })
    assignedAt?: Date;

    // Foreign Keys
    @Column({ type: 'uuid' })
    licenseId: string;

    @Column({ type: 'uuid' })
    brandId: string;

    // Relations
    @ManyToOne(() => License, (license) => license.licenseBrands, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'licenseId' })
    license: License;

    @ManyToOne(() => Brand, (brand) => brand.licenseBrands, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'brandId' })
    brand: Brand;

    // Methods
    incrementAccessCount(): void {
        this.accessCount += 1;
        this.lastAccessedAt = new Date();
    }

    // Virtual properties
    get isActive(): boolean {
        return this.status === LicenseBrandStatus.ACTIVE && !this.isExpired;
    }

    get isExpired(): boolean {
        if (!this.expiresAt) return false;
        return new Date() > this.expiresAt;
    }

    get daysUntilExpiry(): number | null {
        if (!this.expiresAt) return null;
        const now = new Date();
        const diffTime = this.expiresAt.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    get displayName(): string {
        return `${this.brand?.name || 'Brand'} - ${this.license?.licenseKey || 'License'}`;
    }

    get hasPermission(): (permission: string) => boolean {
        return (permission: string) => {
            if (!this.permissions) return true;
            return this.permissions[permission] === true;
        };
    }

    get hasRestriction(): (restriction: string) => boolean {
        return (restriction: string) => {
            if (!this.restrictions) return false;
            return this.restrictions[restriction] === true;
        };
    }
}