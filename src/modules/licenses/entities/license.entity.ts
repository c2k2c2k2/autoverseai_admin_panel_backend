import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index, BeforeInsert } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { LicenseType } from '../../license-types/entities/license-type.entity';
import { LicenseBrand } from './license-brand.entity';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export enum LicenseStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    EXPIRED = 'expired',
    SUSPENDED = 'suspended',
    REVOKED = 'revoked',
    PENDING_ACTIVATION = 'pending_activation',
}

@Entity('licenses')
@Index(['userId', 'licenseTypeId'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['licenseKey'], { unique: true })
@Index(['status'])
@Index(['expiresAt'])
export class License extends BaseEntity {
    @Column({ type: 'varchar', length: 255, unique: true })
    licenseKey: string;

    @Column({ type: 'varchar', length: 255 })
    accessPassword: string; // Hashed password for license access

    @Column({
        type: 'enum',
        enum: LicenseStatus,
        default: LicenseStatus.PENDING_ACTIVATION,
    })
    status: LicenseStatus;

    @Column({ type: 'timestamptz', nullable: true })
    activatedAt?: Date;

    @Column({ type: 'timestamptz', nullable: true })
    expiresAt?: Date;

    @Column({ type: 'timestamptz', nullable: true })
    lastAccessedAt?: Date;

    @Column({ type: 'integer', default: 0 })
    accessCount: number;

    @Column({ type: 'integer', default: 0 })
    maxAccessCount: number; // 0 means unlimited

    @Column({ type: 'simple-array', nullable: true })
    allowedIpAddresses?: string[];

    @Column({ type: 'jsonb', nullable: true })
    deviceFingerprints?: Record<string, any>[];

    @Column({ type: 'integer', default: 0 })
    maxDevices: number; // 0 means unlimited

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'boolean', default: false })
    emailSent: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    emailSentAt?: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    // Audit fields
    @Column({ type: 'uuid', nullable: true })
    assignedBy?: string; // User ID who assigned this license

    @Column({ type: 'timestamptz', nullable: true })
    assignedAt?: Date;

    @Column({ type: 'text', nullable: true })
    assignmentReason?: string;

    // Foreign Keys
    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'uuid' })
    licenseTypeId: string;

    // Relations
    @ManyToOne(() => User, (user) => user.licenses, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => LicenseType, (licenseType) => licenseType.licenses, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'licenseTypeId' })
    licenseType: LicenseType;

    @OneToMany(() => LicenseBrand, (licenseBrand) => licenseBrand.license)
    licenseBrands: LicenseBrand[];

    // Hooks
    @BeforeInsert()
    async generateLicenseKey() {
        if (!this.licenseKey) {
            this.licenseKey = this.generateUniqueKey();
        }
    }

    @BeforeInsert()
    async hashPassword() {
        if (this.accessPassword && !this.accessPassword.startsWith('$2')) {
            // Only hash if not already hashed
            this.accessPassword = await bcrypt.hash(this.accessPassword, 12);
        }
    }

    // Methods
    private generateUniqueKey(): string {
        const prefix = 'LIC';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }

    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.accessPassword);
    }

    incrementAccessCount(): void {
        this.accessCount += 1;
        this.lastAccessedAt = new Date();
    }

    addDeviceFingerprint(fingerprint: Record<string, any>): void {
        if (!this.deviceFingerprints) {
            this.deviceFingerprints = [];
        }

        const exists = this.deviceFingerprints.some(fp =>
            fp.deviceId === fingerprint.deviceId
        );

        if (!exists) {
            this.deviceFingerprints.push({
                ...fingerprint,
                addedAt: new Date().toISOString(),
            });
        }
    }

    // Virtual properties
    get isActive(): boolean {
        return this.status === LicenseStatus.ACTIVE && !this.isExpired;
    }

    get isExpired(): boolean {
        return this.expiresAt ? new Date() > this.expiresAt : false;
    }

    get canAccess(): boolean {
        if (!this.isActive) return false;
        if (this.maxAccessCount > 0 && this.accessCount >= this.maxAccessCount) return false;
        return true;
    }

    get canAddDevice(): boolean {
        if (!this.deviceFingerprints) return true;
        if (this.maxDevices === 0) return true;
        return this.deviceFingerprints.length < this.maxDevices;
    }

    get daysUntilExpiry(): number | null {
        if (!this.expiresAt) return null;
        const now = new Date();
        const diffTime = this.expiresAt.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    get displayName(): string {
        return `${this.licenseType?.name || 'License'} - ${this.user?.email || 'User'}`;
    }
}