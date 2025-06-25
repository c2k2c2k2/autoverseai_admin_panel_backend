import { Exclude, Expose } from 'class-transformer';
import { LicenseTypeStatus, PlatformType } from '../entities/license-type.entity';

export class LicenseTypeResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    code: string;

    @Expose()
    description?: string;

    @Expose()
    status: LicenseTypeStatus;

    @Expose()
    supportedPlatforms: PlatformType[];

    @Expose()
    downloadUrl?: string;

    @Expose()
    iconUrl?: string;

    @Expose()
    version?: string;

    @Expose()
    maxUsers?: number;

    @Expose()
    validityDays?: number;

    @Expose()
    requiresActivation: boolean;

    @Expose()
    allowMultipleDevices: boolean;

    @Expose()
    maxDevices?: number;

    @Expose()
    price?: number;

    @Expose()
    currency: string;

    @Expose()
    sortOrder: number;

    @Expose()
    systemRequirements?: Record<string, any>;

    @Expose()
    features?: string[];

    @Expose()
    tags?: string[];

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Expose()
    get isActive(): boolean {
        return this.status === LicenseTypeStatus.ACTIVE;
    }

    @Expose()
    get isUnlimited(): boolean {
        return this.maxUsers === null || this.maxUsers === 0;
    }

    @Expose()
    get hasExpiry(): boolean {
        return this.validityDays !== null && this.validityDays! > 0;
    }

    @Expose()
    get displayName(): string {
        return this.name;
    }

    // Exclude sensitive fields
    @Exclude()
    metadata?: Record<string, any>;

    @Exclude()
    deletedAt?: Date;
}