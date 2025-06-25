// src/modules/cars/entities/car.entity.ts
import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { Variant } from '../../variants/entities/variant.entity';

export enum CarStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DISCONTINUED = 'discontinued',
    UPCOMING = 'upcoming',
}

export enum CarType {
    SEDAN = 'sedan',
    HATCHBACK = 'hatchback',
    SUV = 'suv',
    COUPE = 'coupe',
    CONVERTIBLE = 'convertible',
    WAGON = 'wagon',
    PICKUP = 'pickup',
    VAN = 'van',
    TRUCK = 'truck',
    MOTORCYCLE = 'motorcycle',
    OTHER = 'other',
}

export enum FuelType {
    PETROL = 'petrol',
    DIESEL = 'diesel',
    ELECTRIC = 'electric',
    HYBRID = 'hybrid',
    PLUGIN_HYBRID = 'plugin_hybrid',
    CNG = 'cng',
    LPG = 'lpg',
}

@Entity('cars')
@Index(['brandId', 'name'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['brandId', 'slug'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['status'])
@Index(['launchYear'])
export class Car extends BaseEntity {
    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 120 })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: CarStatus,
        default: CarStatus.ACTIVE,
    })
    status: CarStatus;

    @Column({
        type: 'enum',
        enum: CarType,
        default: CarType.OTHER,
    })
    type: CarType;

    @Column({
        type: 'enum',
        enum: FuelType,
        array: true,
        default: [],
    })
    fuelTypes: FuelType[];

    @Column({ type: 'integer', nullable: true })
    launchYear?: number;

    @Column({ type: 'integer', nullable: true })
    discontinuedYear?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    startingPrice?: number;

    @Column({ type: 'varchar', length: 3, default: 'USD' })
    currency: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageUrl?: string;

    @Column({ type: 'simple-array', nullable: true })
    imageUrls?: string[];

    @Column({ type: 'integer', default: 0 })
    sortOrder: number;

    @Column({ type: 'jsonb', nullable: true })
    specifications?: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    features?: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    // Foreign Keys
    @Column({ type: 'uuid' })
    brandId: string;

    // Relations
    @ManyToOne(() => Brand, (brand) => brand.cars, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'brandId' })
    brand: Brand;

    @OneToMany(() => Variant, (variant) => variant.car)
    variants: Variant[];

    // Virtual properties
    get isActive(): boolean {
        return this.status === CarStatus.ACTIVE;
    }

    get isDiscontinued(): boolean {
        return this.status === CarStatus.DISCONTINUED;
    }

    get displayName(): string {
        return `${this.brand?.name || ''} ${this.name}`.trim();
    }

    get primaryImageUrl(): string {
        return this.imageUrl || this.imageUrls?.[0] || '';
    }
}