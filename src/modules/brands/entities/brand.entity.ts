import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Car } from '../../cars/entities/car.entity';
import { LicenseBrand } from '../../licenses/entities/license-brand.entity';

export enum BrandStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    MAINTENANCE = 'maintenance',
}

@Entity('brands')
@Index(['name'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['slug'], { unique: true, where: '"deletedAt" IS NULL' })
export class Brand extends BaseEntity {
    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 120 })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    logoUrl?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    websiteUrl?: string;

    @Column({
        type: 'enum',
        enum: BrandStatus,
        default: BrandStatus.ACTIVE,
    })
    status: BrandStatus;

    @Column({ type: 'varchar', length: 7, nullable: true })
    primaryColor?: string; // HEX color code

    @Column({ type: 'varchar', length: 7, nullable: true })
    secondaryColor?: string; // HEX color code

    @Column({ type: 'integer', default: 0 })
    sortOrder: number;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @Column({ type: 'varchar', length: 3, nullable: true })
    countryCode?: string; // ISO 3166-1 alpha-3

    // Relations
    @OneToMany(() => Car, (car) => car.brand)
    cars: Car[];

    @OneToMany(() => LicenseBrand, (licenseBrand) => licenseBrand.brand)
    licenseBrands: LicenseBrand[];

    // Virtual properties
    get isActive(): boolean {
        return this.status === BrandStatus.ACTIVE;
    }

    get displayName(): string {
        return this.name;
    }
}