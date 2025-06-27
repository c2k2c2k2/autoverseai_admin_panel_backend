import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { License, LicenseStatus } from './entities/license.entity';
import { LicenseBrand, LicenseBrandStatus } from './entities/license-brand.entity';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { AssignLicenseDto } from './dto/assign-license.dto';
import { FilterLicensesDto } from './dto/filter-licenses.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { EmailService, LicenseEmailData } from '../../common/services/email.service';
import { PasswordGeneratorService } from '../../common/services/password-generator.service';
import { UsersService } from '../users/users.service';
import { LicenseTypesService } from '../license-types/license-types.service';
import { BrandsService } from '../brands/brands.service';
import { UserStatus } from '../users/entities/user.entity';

@Injectable()
export class LicensesService {
    private readonly logger = new Logger(LicensesService.name);

    constructor(
        @InjectRepository(License)
        private licensesRepository: Repository<License>,
        @InjectRepository(LicenseBrand)
        private licenseBrandsRepository: Repository<LicenseBrand>,
        private usersService: UsersService,
        private licenseTypesService: LicenseTypesService,
        private brandsService: BrandsService,
        private emailService: EmailService,
        private passwordGeneratorService: PasswordGeneratorService,
    ) { }

    async create(createLicenseDto: CreateLicenseDto): Promise<License> {
        const { userId, licenseTypeId, brandIds, expiresAt, notes, assignedBy, assignmentReason } = createLicenseDto;

        // Validate user exists
        const user = await this.usersService.findOne(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Validate license type exists and is active
        const licenseType = await this.licenseTypesService.findOne(licenseTypeId);
        if (!licenseType) {
            throw new NotFoundException(`License type with ID ${licenseTypeId} not found`);
        }
        if (!licenseType.isActive) {
            throw new BadRequestException('License type is not active');
        }

        // Check if user already has this license type
        const existingLicense = await this.findByUserAndLicenseType(userId, licenseTypeId);
        if (existingLicense) {
            throw new ConflictException('User already has a license for this license type');
        }

        // Validate brands exist and are active
        const brands = await Promise.all(
            brandIds.map(brandId => this.brandsService.findOne(brandId))
        );
        const inactiveBrands = brands.filter(brand => !brand.isActive);
        if (inactiveBrands.length > 0) {
            throw new BadRequestException(`Some brands are not active: ${inactiveBrands.map(b => b.name).join(', ')}`);
        }

        try {
            // Generate access password
            const accessPassword = this.passwordGeneratorService.generateUserFriendlyPassword();

            // Calculate expiry date if not provided but license type has validity
            let calculatedExpiresAt: Date | undefined;
            if (expiresAt) {
                calculatedExpiresAt = new Date(expiresAt);
            } else if (licenseType.validityDays) {
                calculatedExpiresAt = new Date();
                calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + licenseType.validityDays);
            }

            // Create license
            const license = this.licensesRepository.create({
                userId,
                licenseTypeId,
                accessPassword, // Will be hashed by entity hook
                expiresAt: calculatedExpiresAt,
                maxDevices: licenseType.maxDevices || 0,
                notes,
                assignedBy,
                assignedAt: new Date(),
                assignmentReason,
                status: LicenseStatus.PENDING_ACTIVATION,
            });

            const savedLicense = await this.licensesRepository.save(license);

            // Create license-brand associations
            const licenseBrands = brandIds.map(brandId =>
                this.licenseBrandsRepository.create({
                    licenseId: savedLicense.id,
                    brandId,
                    status: LicenseBrandStatus.ACTIVE,
                    activatedAt: new Date(),
                    expiresAt: calculatedExpiresAt,
                    assignedBy,
                    assignedAt: new Date(),
                })
            );

            await this.licenseBrandsRepository.save(licenseBrands);

            // Load complete license with relations
            const completeLicense = await this.findOne(savedLicense.id);

            // Send license assignment email
            await this.sendLicenseAssignmentEmail(completeLicense, accessPassword);

            this.logger.log(`License created and assigned: ${completeLicense.licenseKey} to ${user.email}`);
            return completeLicense;
        } catch (error) {
            this.logger.error(`Failed to create license: ${error.message}`);
            if (error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to create license');
        }
    }

    async assignLicense(assignLicenseDto: AssignLicenseDto): Promise<License> {
        const { email, licenseTypeId, brandIds, assignedBy, assignmentReason } = assignLicenseDto;

        // Find or create user
        let user = await this.usersService.findByEmail(email);
        if (!user) {
            user = await this.usersService.create({
                email,
                status: UserStatus.ACTIVE,
            });
        }

        // Create license
        return this.create({
            userId: user.id,
            licenseTypeId,
            brandIds,
            assignedBy,
            assignmentReason,
        });
    }

    async findAll(
        paginationDto: PaginationDto,
        filterDto?: FilterLicensesDto,
    ): Promise<PaginatedResult<License>> {
        const queryBuilder = this.licensesRepository
            .createQueryBuilder('license')
            .leftJoinAndSelect('license.user', 'user')
            .leftJoinAndSelect('license.licenseType', 'licenseType')
            .leftJoinAndSelect('license.licenseBrands', 'licenseBrands')
            .leftJoinAndSelect('licenseBrands.brand', 'brand')
            .where('license.deletedAt IS NULL');

        // Apply filters
        if (filterDto) {
            if (filterDto.status) {
                queryBuilder.andWhere('license.status = :status', { status: filterDto.status });
            }

            if (filterDto.licenseTypeId) {
                queryBuilder.andWhere('license.licenseTypeId = :licenseTypeId', {
                    licenseTypeId: filterDto.licenseTypeId,
                });
            }

            if (filterDto.userId) {
                queryBuilder.andWhere('license.userId = :userId', { userId: filterDto.userId });
            }

            if (filterDto.brandId) {
                queryBuilder.andWhere('licenseBrands.brandId = :brandId', { brandId: filterDto.brandId });
            }

            if (filterDto.isExpired !== undefined) {
                if (filterDto.isExpired) {
                    queryBuilder.andWhere('license.expiresAt <= :now', { now: new Date() });
                } else {
                    queryBuilder.andWhere('(license.expiresAt IS NULL OR license.expiresAt > :now)', {
                        now: new Date(),
                    });
                }
            }

            if (filterDto.expiringInDays) {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + filterDto.expiringInDays);
                queryBuilder.andWhere('license.expiresAt BETWEEN :now AND :futureDate', {
                    now: new Date(),
                    futureDate,
                });
            }

            if (filterDto.createdAfter) {
                queryBuilder.andWhere('license.createdAt >= :createdAfter', {
                    createdAfter: filterDto.createdAfter,
                });
            }

            if (filterDto.createdBefore) {
                queryBuilder.andWhere('license.createdAt <= :createdBefore', {
                    createdBefore: filterDto.createdBefore,
                });
            }
        }

        // Apply search
        if (paginationDto.search) {
            const searchTerm = `%${paginationDto.search.toLowerCase()}%`;
            queryBuilder.andWhere(
                '(LOWER(license.licenseKey) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(licenseType.name) LIKE :search)',
                { search: searchTerm },
            );
        }

        // Apply sorting
        const sortBy = paginationDto.sortBy || 'createdAt';
        const sortOrder = paginationDto.sortOrder || 'DESC';
        queryBuilder.orderBy(`license.${sortBy}`, sortOrder);

        return PaginationUtil.paginate(queryBuilder, paginationDto);
    }

    async findOne(id: string): Promise<License> {
        const license = await this.licensesRepository.findOne({
            where: { id },
            relations: [
                'user',
                'licenseType',
                'licenseBrands',
                'licenseBrands.brand',
            ],
        });

        if (!license) {
            throw new NotFoundException(`License with ID ${id} not found`);
        }

        return license;
    }

    async findByLicenseKey(licenseKey: string): Promise<License | null> {
        return this.licensesRepository.findOne({
            where: { licenseKey },
            relations: ['user', 'licenseType', 'licenseBrands', 'licenseBrands.brand'],
        });
    }

    async findByUserAndLicenseType(userId: string, licenseTypeId: string): Promise<License | null> {
        return this.licensesRepository.findOne({
            where: { userId, licenseTypeId },
            relations: ['user', 'licenseType', 'licenseBrands', 'licenseBrands.brand'],
        });
    }

    async update(id: string, updateLicenseDto: UpdateLicenseDto): Promise<License> {
        const license = await this.findOne(id);

        try {
            // Update license
            Object.assign(license, {
                ...updateLicenseDto,
                updatedAt: new Date(),
            });

            const updatedLicense = await this.licensesRepository.save(license);

            this.logger.log(`License updated: ${updatedLicense.licenseKey} (ID: ${updatedLicense.id})`);
            return updatedLicense;
        } catch (error) {
            this.logger.error(`Failed to update license ${id}: ${error.message}`);
            throw new BadRequestException('Failed to update license');
        }
    }

    async activate(id: string): Promise<License> {
        const license = await this.findOne(id);

        if (license.status === LicenseStatus.ACTIVE) {
            throw new BadRequestException('License is already active');
        }

        license.status = LicenseStatus.ACTIVE;
        license.activatedAt = new Date();

        const updatedLicense = await this.licensesRepository.save(license);

        this.logger.log(`License activated: ${updatedLicense.licenseKey} (ID: ${updatedLicense.id})`);
        return updatedLicense;
    }

    async deactivate(id: string): Promise<License> {
        const license = await this.findOne(id);

        if (license.status === LicenseStatus.INACTIVE) {
            throw new BadRequestException('License is already inactive');
        }

        license.status = LicenseStatus.INACTIVE;
        const updatedLicense = await this.licensesRepository.save(license);

        this.logger.log(`License deactivated: ${updatedLicense.licenseKey} (ID: ${updatedLicense.id})`);
        return updatedLicense;
    }

    async suspend(id: string): Promise<License> {
        const license = await this.findOne(id);

        if (license.status === LicenseStatus.SUSPENDED) {
            throw new BadRequestException('License is already suspended');
        }

        license.status = LicenseStatus.SUSPENDED;
        const updatedLicense = await this.licensesRepository.save(license);

        this.logger.log(`License suspended: ${updatedLicense.licenseKey} (ID: ${updatedLicense.id})`);
        return updatedLicense;
    }

    async revoke(id: string): Promise<License> {
        const license = await this.findOne(id);

        if (license.status === LicenseStatus.REVOKED) {
            throw new BadRequestException('License is already revoked');
        }

        license.status = LicenseStatus.REVOKED;
        const updatedLicense = await this.licensesRepository.save(license);

        this.logger.log(`License revoked: ${updatedLicense.licenseKey} (ID: ${updatedLicense.id})`);
        return updatedLicense;
    }

    async validateLicenseAccess(
        licenseKey: string,
        password: string,
        deviceFingerprint?: Record<string, any>,
    ): Promise<{ valid: boolean; license?: License; message?: string }> {
        const license = await this.findByLicenseKey(licenseKey);

        if (!license) {
            return { valid: false, message: 'Invalid license key' };
        }

        if (!license.canAccess) {
            return { valid: false, message: 'License access not allowed' };
        }

        const passwordValid = await license.validatePassword(password);
        if (!passwordValid) {
            return { valid: false, message: 'Invalid password' };
        }

        // Check device limit if fingerprint provided
        if (deviceFingerprint && !license.canAddDevice) {
            const existingDevice = license.deviceFingerprints?.find(
                fp => fp.deviceId === deviceFingerprint.deviceId
            );
            if (!existingDevice) {
                return { valid: false, message: 'Device limit exceeded' };
            }
        }

        // Update access tracking
        license.incrementAccessCount();
        if (deviceFingerprint) {
            license.addDeviceFingerprint(deviceFingerprint);
        }

        await this.licensesRepository.save(license);

        return { valid: true, license };
    }

    async remove(id: string): Promise<void> {
        const license = await this.findOne(id);

        try {
            // Soft delete license and associated license brands
            await this.licensesRepository.manager.transaction(async (manager) => {
                await manager.softDelete(LicenseBrand, { licenseId: id });
                await manager.softDelete(License, id);
            });

            this.logger.log(`License deleted: ${license.licenseKey} (ID: ${license.id})`);
        } catch (error) {
            this.logger.error(`Failed to delete license ${id}: ${error.message}`);
            throw new BadRequestException('Failed to delete license');
        }
    }

    async getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        expired: number;
        suspended: number;
        revoked: number;
        expiringIn7Days: number;
        expiringIn30Days: number;
        byLicenseType: Record<string, number>;
    }> {
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [
            total,
            active,
            inactive,
            suspended,
            revoked,
            expiringIn7Days,
            expiringIn30Days,
        ] = await Promise.all([
            this.licensesRepository.count(),
            this.licensesRepository.count({ where: { status: LicenseStatus.ACTIVE } }),
            this.licensesRepository.count({ where: { status: LicenseStatus.INACTIVE } }),
            this.licensesRepository.count({ where: { status: LicenseStatus.SUSPENDED } }),
            this.licensesRepository.count({ where: { status: LicenseStatus.REVOKED } }),
            this.licensesRepository
                .createQueryBuilder('license')
                .where('license.expiresAt BETWEEN :now AND :in7Days', { now, in7Days })
                .getCount(),
            this.licensesRepository
                .createQueryBuilder('license')
                .where('license.expiresAt BETWEEN :now AND :in30Days', { now, in30Days })
                .getCount(),
        ]);

        const expired = await this.licensesRepository
            .createQueryBuilder('license')
            .where('license.expiresAt <= :now', { now })
            .getCount();

        // Get license type statistics
        const licenseTypeStats = await this.licensesRepository
            .createQueryBuilder('license')
            .leftJoin('license.licenseType', 'licenseType')
            .select('licenseType.name', 'name')
            .addSelect('COUNT(license.id)', 'count')
            .groupBy('licenseType.name')
            .getRawMany();

        const byLicenseType: Record<string, number> = {};
        licenseTypeStats.forEach(stat => {
            byLicenseType[stat.name] = parseInt(stat.count);
        });

        return {
            total,
            active,
            inactive,
            expired,
            suspended,
            revoked,
            expiringIn7Days,
            expiringIn30Days,
            byLicenseType,
        };
    }

    private async sendLicenseAssignmentEmail(license: License, accessPassword: string): Promise<void> {
        try {
            const downloadUrls = license.licenseType?.supportedPlatforms?.map(platform => ({
                platform,
                url: license.licenseType?.downloadUrl || '#',
            })) || [];

            const emailData: LicenseEmailData = {
                userEmail: license.user.email,
                userName: license.user.fullName || license.user.email,
                licenseKey: license.licenseKey,
                accessPassword,
                downloadUrls,
                licenseType: license.licenseType.name,
                brands: license.licenseBrands.map(lb => lb.brand.name),
                expiresAt: license.expiresAt,
            };

            await this.emailService.sendLicenseAssignmentEmail(emailData);

            // Mark email as sent
            license.emailSent = true;
            license.emailSentAt = new Date();
            await this.licensesRepository.save(license);

        } catch (error) {
            this.logger.warn(`Failed to send license assignment email: ${error.message}`);
            // Don't throw error as license creation should succeed even if email fails
        }
    }
}