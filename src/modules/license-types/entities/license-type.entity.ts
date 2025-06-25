import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { License } from '../../licenses/entities/license.entity';

export enum LicenseTypeStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DEPRECATED = 'deprecated',
}

export enum PlatformType {
    STANDALONE = 'standalone',
    META_QUEST = 'meta_quest',
    VISION_PRO = 'vision_pro',
    WINDOWS = 'windows',
    MAC = 'mac',
    LINUX = 'linux',
    ANDROID = 'android',
    IOS = 'ios',
    WEB = 'web',
}

@Entity('license_types')
@Index(['name'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['code'], { unique: true, where: '"deletedAt" IS NULL' })
export class LicenseType extends BaseEntity {
    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 50 })
    code: string; // Unique identifier code

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: LicenseTypeStatus,
        default: LicenseTypeStatus.ACTIVE,
    })
    status: LicenseTypeStatus;

    @Column({
        type: 'enum',
        enum: PlatformType,
        array: true,
        default: [],
    })
    supportedPlatforms: PlatformType[];

    @Column({ type: 'varchar', length: 500, nullable: true })
    downloadUrl?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    iconUrl?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    version?: string;

    @Column({ type: 'integer', nullable: true })
    maxUsers?: number; // null means unlimited

    @Column({ type: 'integer', nullable: true })
    validityDays?: number; // null means no expiry

    @Column({ type: 'boolean', default: false })
    requiresActivation: boolean;

    @Column({ type: 'boolean', default: true })
    allowMultipleDevices: boolean;

    @Column({ type: 'integer', nullable: true })
    maxDevices?: number; // null means unlimited

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price?: number;

    @Column({ type: 'varchar', length: 3, default: 'USD' })
    currency: string;

    @Column({ type: 'integer', default: 0 })
    sortOrder: number;

    @Column({ type: 'jsonb', nullable: true })
    systemRequirements?: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    features?: string[];

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @Column({ type: 'simple-array', nullable: true })
    tags?: string[];

    // Relations
    @OneToMany(() => License, (license) => license.licenseType)
    licenses: License[];

    // Virtual properties
    get isActive(): boolean {
        return this.status === LicenseTypeStatus.ACTIVE;
    }

    get isUnlimited(): boolean {
        return this.maxUsers === null || this.maxUsers === 0;
    }

    get hasExpiry(): boolean {
        return this.validityDays !== null && this.validityDays! > 0;
    }

    get displayName(): string {
        return this.name;
    }

    get isPlatformSupported(): (platform: PlatformType) => boolean {
        return (platform: PlatformType) => this.supportedPlatforms.includes(platform);
    }
}