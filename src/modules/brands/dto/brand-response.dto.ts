import { Exclude, Expose, Type } from 'class-transformer';
import { BrandStatus } from '../entities/brand.entity';

export class BrandResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    slug: string;

    @Expose()
    description?: string;

    @Expose()
    logoUrl?: string;

    @Expose()
    websiteUrl?: string;

    @Expose()
    status: BrandStatus;

    @Expose()
    primaryColor?: string;

    @Expose()
    secondaryColor?: string;

    @Expose()
    sortOrder: number;

    @Expose()
    countryCode?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Expose()
    get isActive(): boolean {
        return this.status === BrandStatus.ACTIVE;
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
