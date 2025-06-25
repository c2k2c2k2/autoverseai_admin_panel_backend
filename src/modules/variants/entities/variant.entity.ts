import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { Car } from '../../cars/entities/car.entity';

export enum VariantStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DISCONTINUED = 'discontinued',
    OUT_OF_STOCK = 'out_of_stock',
}

export enum TransmissionType {
    MANUAL = 'manual',
    AUTOMATIC = 'automatic',
    CVT = 'cvt',
    DCT = 'dct',
    AMT = 'amt',
}

export enum DriveType {
    FWD = 'fwd', // Front Wheel Drive
    RWD = 'rwd', // Rear Wheel Drive
    AWD = 'awd', // All Wheel Drive
    FourWD = '4wd', // Four Wheel Drive
}

@Entity('variants')
@Index(['brandId', 'carId', 'name'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['status'])
@Index(['price'])
export class Variant extends BaseEntity {
    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: VariantStatus,
        default: VariantStatus.ACTIVE,
    })
    status: VariantStatus;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    price: number;

    @Column({ type: 'varchar', length: 3, default: 'USD' })
    currency: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    discountedPrice?: number;

    @Column({ type: 'varchar', length: 20, nullable: true })
    engineCapacity?: string; // e.g., "1.5L", "2000cc"

    @Column({ type: 'integer', nullable: true })
    horsePower?: number;

    @Column({ type: 'integer', nullable: true })
    torque?: number;

    @Column({
        type: 'enum',
        enum: TransmissionType,
        nullable: true,
    })
    transmission?: TransmissionType;

    @Column({
        type: 'enum',
        enum: DriveType,
        nullable: true,
    })
    driveType?: DriveType;

    @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
    fuelEfficiency?: number; // km/l or mpg

    @Column({ type: 'integer', nullable: true })
    seatingCapacity?: number;

    @Column({ type: 'integer', nullable: true })
    bootSpace?: number; // in liters

    @Column({ type: 'varchar', length: 50, nullable: true })
    color?: string;

    @Column({ type: 'varchar', length: 7, nullable: true })
    colorCode?: string; // HEX color code

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageUrl?: string;

    @Column({ type: 'simple-array', nullable: true })
    imageUrls?: string[];

    @Column({ type: 'integer', default: 0 })
    sortOrder: number;

    @Column({ type: 'boolean', default: true })
    isAvailable: boolean;

    @Column({ type: 'integer', default: 0 })
    stockQuantity: number;

    @Column({ type: 'jsonb', nullable: true })
    specifications?: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    features?: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    // Foreign Keys
    @Column({ type: 'uuid' })
    brandId: string;

    @Column({ type: 'uuid' })
    carId: string;

    // Relations
    @ManyToOne(() => Brand, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'brandId' })
    brand: Brand;

    @ManyToOne(() => Car, (car) => car.variants, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'carId' })
    car: Car;

    // Virtual properties
    get isActive(): boolean {
        return this.status === VariantStatus.ACTIVE && this.isAvailable;
    }

    get isDiscontinued(): boolean {
        return this.status === VariantStatus.DISCONTINUED;
    }

    get displayName(): string {
        return `${this.car?.displayName || ''} ${this.name}`.trim();
    }

    get effectivePrice(): number {
        return this.discountedPrice || this.price;
    }

    get hasDiscount(): boolean {
        return !!this.discountedPrice && this.discountedPrice < this.price;
    }

    get discountPercentage(): number {
        if (!this.hasDiscount) return 0;
        return Math.round(((this.price - this.discountedPrice!) / this.price) * 100);
    }

    get primaryImageUrl(): string {
        return this.imageUrl || this.imageUrls?.[0] || this.car?.primaryImageUrl || '';
    }
}