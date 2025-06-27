// src/modules/license-types/license-types.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LicenseType, LicenseTypeStatus, PlatformType } from './entities/license-type.entity';
import { CreateLicenseTypeDto } from './dto/create-license-type.dto';
import { UpdateLicenseTypeDto } from './dto/update-license-type.dto';
import { FilterLicenseTypesDto } from './dto/filter-license-types.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class LicenseTypesService {
    private readonly logger = new Logger(LicenseTypesService.name);

    constructor(
        @InjectRepository(LicenseType)
        private licenseTypesRepository: Repository<LicenseType>,
    ) { }

    async create(createLicenseTypeDto: CreateLicenseTypeDto): Promise<LicenseType> {
        const {
            name,
            code,
            description,
            supportedPlatforms,
            downloadUrl,
            iconUrl,
            version,
            maxUsers,
            validityDays,
            requiresActivation,
            allowMultipleDevices,
            maxDevices,
            price,
            currency,
            systemRequirements,
            features,
            tags,
        } = createLicenseTypeDto;

        // Check if license type already exists
        const existingByName = await this.findByName(name);
        if (existingByName) {
            throw new ConflictException('License type with this name already exists');
        }

        const existingByCode = await this.findByCode(code);
        if (existingByCode) {
            throw new ConflictException('License type with this code already exists');
        }

        try {
            // Get next sort order
            const maxSortOrder = await this.getMaxSortOrder();

            const licenseType = this.licenseTypesRepository.create({
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: description?.trim(),
                supportedPlatforms: supportedPlatforms || [],
                downloadUrl: downloadUrl?.trim(),
                iconUrl: iconUrl?.trim(),
                version: version?.trim(),
                maxUsers,
                validityDays,
                requiresActivation: requiresActivation ?? false,
                allowMultipleDevices: allowMultipleDevices ?? true,
                maxDevices,
                price,
                currency: currency || 'USD',
                sortOrder: maxSortOrder + 1,
                systemRequirements,
                features,
                tags,
            });

            const savedLicenseType = await this.licenseTypesRepository.save(licenseType);

            this.logger.log(`License type created: ${savedLicenseType.name} (ID: ${savedLicenseType.id})`);
            return savedLicenseType;
        } catch (error) {
            this.logger.error(`Failed to create license type: ${error.message}`);
            throw new BadRequestException('Failed to create license type');
        }
    }

    async findAll(
        paginationDto: PaginationDto,
        filterDto?: FilterLicenseTypesDto,
    ): Promise<PaginatedResult<LicenseType>> {
        const queryBuilder = this.licenseTypesRepository
            .createQueryBuilder('licenseType')
            .leftJoinAndSelect('licenseType.licenses', 'licenses')
            .where('licenseType.deletedAt IS NULL');

        // Apply filters
        if (filterDto) {
            if (filterDto.status) {
                queryBuilder.andWhere('licenseType.status = :status', { status: filterDto.status });
            }

            if (filterDto.platform) {
                queryBuilder.andWhere(':platform = ANY(licenseType.supportedPlatforms)', {
                    platform: filterDto.platform,
                });
            }

            if (filterDto.requiresActivation !== undefined) {
                queryBuilder.andWhere('licenseType.requiresActivation = :requiresActivation', {
                    requiresActivation: filterDto.requiresActivation,
                });
            }

            if (filterDto.hasExpiry !== undefined) {
                if (filterDto.hasExpiry) {
                    queryBuilder.andWhere('licenseType.validityDays IS NOT NULL AND licenseType.validityDays > 0');
                } else {
                    queryBuilder.andWhere('licenseType.validityDays IS NULL OR licenseType.validityDays = 0');
                }
            }

            if (filterDto.createdAfter) {
                queryBuilder.andWhere('licenseType.createdAt >= :createdAfter', {
                    createdAfter: filterDto.createdAfter,
                });
            }

            if (filterDto.createdBefore) {
                queryBuilder.andWhere('licenseType.createdAt <= :createdBefore', {
                    createdBefore: filterDto.createdBefore,
                });
            }
        }

        // Apply search
        if (paginationDto.search) {
            const searchTerm = `%${paginationDto.search.toLowerCase()}%`;
            queryBuilder.andWhere(
                '(LOWER(licenseType.name) LIKE :search OR LOWER(licenseType.code) LIKE :search OR LOWER(licenseType.description) LIKE :search)',
                { search: searchTerm },
            );
        }

        // Apply sorting
        const sortBy = paginationDto.sortBy || 'sortOrder';
        const sortOrder = paginationDto.sortOrder || 'ASC';
        queryBuilder.orderBy(`licenseType.${sortBy}`, sortOrder);

        return PaginationUtil.paginate(queryBuilder, paginationDto);
    }

    async findAllActive(): Promise<LicenseType[]> {
        return this.licenseTypesRepository.find({
            where: { status: LicenseTypeStatus.ACTIVE },
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<LicenseType> {
        const licenseType = await this.licenseTypesRepository.findOne({
            where: { id },
            relations: ['licenses', 'licenses.user', 'licenses.licenseBrands'],
        });

        if (!licenseType) {
            throw new NotFoundException(`License type with ID ${id} not found`);
        }

        return licenseType;
    }

    async findByName(name: string): Promise<LicenseType | null> {
        return this.licenseTypesRepository.findOne({
            where: { name: name.trim() },
        });
    }

    async findByCode(code: string): Promise<LicenseType | null> {
        return this.licenseTypesRepository.findOne({
            where: { code: code.trim().toUpperCase() },
        });
    }

    async update(id: string, updateLicenseTypeDto: UpdateLicenseTypeDto): Promise<LicenseType> {
        const licenseType = await this.findOne(id);

        // Check name uniqueness if name is being updated
        if (updateLicenseTypeDto.name && updateLicenseTypeDto.name !== licenseType.name) {
            const existingByName = await this.findByName(updateLicenseTypeDto.name);
            if (existingByName && existingByName.id !== id) {
                throw new ConflictException('License type with this name already exists');
            }
        }

        // Check code uniqueness if code is being updated
        if (updateLicenseTypeDto.code && updateLicenseTypeDto.code !== licenseType.code) {
            const existingByCode = await this.findByCode(updateLicenseTypeDto.code);
            if (existingByCode && existingByCode.id !== id) {
                throw new ConflictException('License type with this code already exists');
            }
        }

        try {
            // Update license type
            Object.assign(licenseType, {
                ...updateLicenseTypeDto,
                name: updateLicenseTypeDto.name?.trim() || licenseType.name,
                code: updateLicenseTypeDto.code?.trim().toUpperCase() || licenseType.code,
                description: updateLicenseTypeDto.description?.trim() || licenseType.description,
                downloadUrl: updateLicenseTypeDto.downloadUrl?.trim() || licenseType.downloadUrl,
                iconUrl: updateLicenseTypeDto.iconUrl?.trim() || licenseType.iconUrl,
                version: updateLicenseTypeDto.version?.trim() || licenseType.version,
                currency: updateLicenseTypeDto.currency || licenseType.currency,
                updatedAt: new Date(),
            });

            const updatedLicenseType = await this.licenseTypesRepository.save(licenseType);

            this.logger.log(`License type updated: ${updatedLicenseType.name} (ID: ${updatedLicenseType.id})`);
            return updatedLicenseType;
        } catch (error) {
            this.logger.error(`Failed to update license type ${id}: ${error.message}`);
            throw new BadRequestException('Failed to update license type');
        }
    }

    async updateSortOrder(sortOrderData: { id: string; sortOrder: number }[]): Promise<void> {
        try {
            await this.licenseTypesRepository.manager.transaction(async (manager) => {
                for (const item of sortOrderData) {
                    await manager.update(LicenseType, item.id, { sortOrder: item.sortOrder });
                }
            });

            this.logger.log('License type sort order updated');
        } catch (error) {
            this.logger.error(`Failed to update license type sort order: ${error.message}`);
            throw new BadRequestException('Failed to update license type sort order');
        }
    }

    async activate(id: string): Promise<LicenseType> {
        const licenseType = await this.findOne(id);

        if (licenseType.status === LicenseTypeStatus.ACTIVE) {
            throw new BadRequestException('License type is already active');
        }

        licenseType.status = LicenseTypeStatus.ACTIVE;
        const updatedLicenseType = await this.licenseTypesRepository.save(licenseType);

        this.logger.log(`License type activated: ${updatedLicenseType.name} (ID: ${updatedLicenseType.id})`);
        return updatedLicenseType;
    }

    async deactivate(id: string): Promise<LicenseType> {
        const licenseType = await this.findOne(id);

        if (licenseType.status === LicenseTypeStatus.INACTIVE) {
            throw new BadRequestException('License type is already inactive');
        }

        licenseType.status = LicenseTypeStatus.INACTIVE;
        const updatedLicenseType = await this.licenseTypesRepository.save(licenseType);

        this.logger.log(`License type deactivated: ${updatedLicenseType.name} (ID: ${updatedLicenseType.id})`);
        return updatedLicenseType;
    }

    async remove(id: string): Promise<void> {
        const licenseType = await this.findOne(id);

        // Check if license type has licenses
        if (licenseType.licenses && licenseType.licenses.length > 0) {
            throw new BadRequestException('Cannot delete license type with associated licenses');
        }

        try {
            // Soft delete
            await this.licenseTypesRepository.softDelete(id);

            this.logger.log(`License type deleted: ${licenseType.name} (ID: ${licenseType.id})`);
        } catch (error) {
            this.logger.error(`Failed to delete license type ${id}: ${error.message}`);
            throw new BadRequestException('Failed to delete license type');
        }
    }

    async getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        deprecated: number;
        withLicenses: number;
        withoutLicenses: number;
        byPlatform: Record<PlatformType, number>;
    }> {
        const [
            total,
            active,
            inactive,
            deprecated,
        ] = await Promise.all([
            this.licenseTypesRepository.count(),
            this.licenseTypesRepository.count({ where: { status: LicenseTypeStatus.ACTIVE } }),
            this.licenseTypesRepository.count({ where: { status: LicenseTypeStatus.INACTIVE } }),
            this.licenseTypesRepository.count({ where: { status: LicenseTypeStatus.DEPRECATED } }),
        ]);

        const licenseTypesWithLicenses = await this.licenseTypesRepository
            .createQueryBuilder('licenseType')
            .leftJoin('licenseType.licenses', 'license')
            .where('license.id IS NOT NULL')
            .getCount();

        // Get platform statistics
        const byPlatform: Record<PlatformType, number> = {} as any;
        for (const platform of Object.values(PlatformType)) {
            const count = await this.licenseTypesRepository
                .createQueryBuilder('licenseType')
                .where(':platform = ANY(licenseType.supportedPlatforms)', { platform })
                .getCount();
            byPlatform[platform] = count;
        }

        return {
            total,
            active,
            inactive,
            deprecated,
            withLicenses: licenseTypesWithLicenses,
            withoutLicenses: total - licenseTypesWithLicenses,
            byPlatform,
        };
    }

    private async getMaxSortOrder(): Promise<number> {
        const result = await this.licenseTypesRepository
            .createQueryBuilder('licenseType')
            .select('MAX(licenseType.sortOrder)', 'maxSortOrder')
            .getRawOne();

        return result.maxSortOrder || 0;
    }
}