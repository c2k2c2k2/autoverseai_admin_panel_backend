import { Exclude, Expose, Type } from 'class-transformer';
import { LicenseStatus } from '../entities/license.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { LicenseTypeResponseDto } from '../../license-types/dto/license-type-response.dto';
import { BrandResponseDto } from '../../brands/dto/brand-response.dto';

export class LicenseBrandResponseDto {
    @Expose()
    id: string;

    @Expose()
    status: string;

    @Expose()
    activatedAt?: Date;

    @Expose()
    expiresAt?: Date;

    @Expose()
    accessCount: number;

    @Expose()
    lastAccessedAt?: Date;

    @Expose()
    @Type(() => BrandResponseDto)
    brand: BrandResponseDto;
}

export class LicenseResponseDto {
    @Expose()
    id: string;

    @Expose()
    licenseKey: string;

    @Expose()
    status: LicenseStatus;

    @Expose()
    activatedAt?: Date;

    @Expose()
    expiresAt?: Date;

    @Expose()
    lastAccessedAt?: Date;

    @Expose()
    accessCount: number;

    @Expose()
    maxAccessCount: number;

    @Expose()
    maxDevices: number;

    @Expose()
    notes?: string;

    @Expose()
    emailSent: boolean;

    @Expose()
    emailSentAt?: Date;

    @Expose()
    assignedAt?: Date;

    @Expose()
    assignmentReason?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Expose()
    @Type(() => UserResponseDto)
    user: UserResponseDto;

    @Expose()
    @Type(() => LicenseTypeResponseDto)
    licenseType: LicenseTypeResponseDto;

    @Expose()
    @Type(() => LicenseBrandResponseDto)
    licenseBrands: LicenseBrandResponseDto[];

    @Expose()
    get isActive(): boolean {
        return this.status === LicenseStatus.ACTIVE && !this.isExpired;
    }

    @Expose()
    get isExpired(): boolean {
        return this.expiresAt ? new Date() > new Date(this.expiresAt) : false;
    }

    @Expose()
    get canAccess(): boolean {
        if (!this.isActive) return false;
        if (this.maxAccessCount > 0 && this.accessCount >= this.maxAccessCount) return false;
        return true;
    }

    @Expose()
    get daysUntilExpiry(): number | null {
        if (!this.expiresAt) return null;
        const now = new Date();
        const expiry = new Date(this.expiresAt);
        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    @Expose()
    get displayName(): string {
        return `${this.licenseType?.name || 'License'} - ${this.user?.email || 'User'}`;
    }

    @Expose()
    get brandNames(): string[] {
        return this.licenseBrands?.map(lb => lb.brand.name) || [];
    }

    // Exclude sensitive fields
    @Exclude()
    accessPassword: string;

    @Exclude()
    allowedIpAddresses?: string[];

    @Exclude()
    deviceFingerprints?: Record<string, any>[];

    @Exclude()
    metadata?: Record<string, any>;

    @Exclude()
    assignedBy?: string;

    @Exclude()
    deletedAt?: Date;
}