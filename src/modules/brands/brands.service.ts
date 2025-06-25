// src/modules/brands/brands.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand, BrandStatus } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FilterBrandsDto } from './dto/filter-brands.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { SlugUtil } from '../../common/utils/slug.util';

@Injectable()
export class BrandsService {
    private readonly logger = new Logger(BrandsService.name);

    constructor(
        @InjectRepository(Brand)
        private brandsRepository: Repository<Brand>,
    ) { }

    async create(createBrandDto: CreateBrandDto): Promise<Brand> {
        const { name, description, logoUrl, websiteUrl, status, primaryColor, secondaryColor, countryCode } = createBrandDto;

        // Check if brand already exists
        const existingBrand = await this.findByName(name);
        if (existingBrand) {
            throw new ConflictException('Brand with this name already exists');
        }

        try {
            // Generate unique slug
            const existingSlugs = await this.getAllSlugs();
            const slug = SlugUtil.generateUniqueSlug(name, existingSlugs);

            // Get next sort order
            const maxSortOrder = await this.getMaxSortOrder();

            const brand = this.brandsRepository.create({
                name: name.trim(),
                slug,
                description: description?.trim(),
                logoUrl: logoUrl?.trim(),
                websiteUrl: websiteUrl?.trim(),
                status: status || BrandStatus.ACTIVE,
                primaryColor,
                secondaryColor,
                countryCode: countryCode?.toUpperCase(),
                sortOrder: maxSortOrder + 1,
            });

            const savedBrand = await this.brandsRepository.save(brand);

            this.logger.log(`Brand created: ${savedBrand.name} (ID: ${savedBrand.id})`);
            return savedBrand;
        } catch (error) {
            this.logger.error(`Failed to create brand: ${error.message}`);
            throw new BadRequestException('Failed to create brand');
        }
    }

    async findAll(
        paginationDto: PaginationDto,
        filterDto?: FilterBrandsDto,
    ): Promise<PaginatedResult<Brand>> {
        const queryBuilder = this.brandsRepository
            .createQueryBuilder('brand')
            .leftJoinAndSelect('brand.cars', 'cars')
            .where('brand.deletedAt IS NULL');

        // Apply filters
        if (filterDto) {
            if (filterDto.status) {
                queryBuilder.andWhere('brand.status = :status', { status: filterDto.status });
            }

            if (filterDto.countryCode) {
                queryBuilder.andWhere('brand.countryCode = :countryCode', {
                    countryCode: filterDto.countryCode.toUpperCase(),
                });
            }

            if (filterDto.createdAfter) {
                queryBuilder.andWhere('brand.createdAt >= :createdAfter', {
                    createdAfter: filterDto.createdAfter,
                });
            }

            if (filterDto.createdBefore) {
                queryBuilder.andWhere('brand.createdAt <= :createdBefore', {
                    createdBefore: filterDto.createdBefore,
                });
            }
        }

        // Apply search
        if (paginationDto.search) {
            const searchTerm = `%${paginationDto.search.toLowerCase()}%`;
            queryBuilder.andWhere(
                '(LOWER(brand.name) LIKE :search OR LOWER(brand.description) LIKE :search)',
                { search: searchTerm },
            );
        }

        // Apply sorting
        const sortBy = paginationDto.sortBy || 'sortOrder';
        const sortOrder = paginationDto.sortOrder || 'ASC';
        queryBuilder.orderBy(`brand.${sortBy}`, sortOrder);

        return PaginationUtil.paginate(queryBuilder, paginationDto);
    }

    async findAllActive(): Promise<Brand[]> {
        return this.brandsRepository.find({
            where: { status: BrandStatus.ACTIVE },
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Brand> {
        const brand = await this.brandsRepository.findOne({
            where: { id },
            relations: ['cars', 'cars.variants', 'licenseBrands'],
        });

        if (!brand) {
            throw new NotFoundException(`Brand with ID ${id} not found`);
        }

        return brand;
    }

    async findByName(name: string): Promise<Brand | null> {
        return this.brandsRepository.findOne({
            where: { name: name.trim() },
        });
    }

    async findBySlug(slug: string): Promise<Brand | null> {
        return this.brandsRepository.findOne({
            where: { slug },
            relations: ['cars', 'cars.variants'],
        });
    }

    async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
        const brand = await this.findOne(id);

        // Check name uniqueness if name is being updated
        if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
            const existingBrand = await this.findByName(updateBrandDto.name);
            if (existingBrand && existingBrand.id !== id) {
                throw new ConflictException('Brand with this name already exists');
            }
        }

        try {
            // Update slug if name is changing
            let slug = brand.slug;
            if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
                const existingSlugs = await this.getAllSlugs();
                slug = SlugUtil.generateUniqueSlug(updateBrandDto.name, existingSlugs.filter(s => s !== brand.slug));
            }

            // Update brand
            Object.assign(brand, {
                ...updateBrandDto,
                name: updateBrandDto.name?.trim() || brand.name,
                slug,
                description: updateBrandDto.description?.trim() || brand.description,
                logoUrl: updateBrandDto.logoUrl?.trim() || brand.logoUrl,
                websiteUrl: updateBrandDto.websiteUrl?.trim() || brand.websiteUrl,
                countryCode: updateBrandDto.countryCode?.toUpperCase() || brand.countryCode,
                updatedAt: new Date(),
            });

            const updatedBrand = await this.brandsRepository.save(brand);

            this.logger.log(`Brand updated: ${updatedBrand.name} (ID: ${updatedBrand.id})`);
            return updatedBrand;
        } catch (error) {
            this.logger.error(`Failed to update brand ${id}: ${error.message}`);
            throw new BadRequestException('Failed to update brand');
        }
    }

    async updateSortOrder(sortOrderData: { id: string; sortOrder: number }[]): Promise<void> {
        try {
            await this.brandsRepository.manager.transaction(async (manager) => {
                for (const item of sortOrderData) {
                    await manager.update(Brand, item.id, { sortOrder: item.sortOrder });
                }
            });

            this.logger.log('Brand sort order updated');
        } catch (error) {
            this.logger.error(`Failed to update brand sort order: ${error.message}`);
            throw new BadRequestException('Failed to update brand sort order');
        }
    }

    async activate(id: string): Promise<Brand> {
        const brand = await this.findOne(id);

        if (brand.status === BrandStatus.ACTIVE) {
            throw new BadRequestException('Brand is already active');
        }

        brand.status = BrandStatus.ACTIVE;
        const updatedBrand = await this.brandsRepository.save(brand);

        this.logger.log(`Brand activated: ${updatedBrand.name} (ID: ${updatedBrand.id})`);
        return updatedBrand;
    }

    async deactivate(id: string): Promise<Brand> {
        const brand = await this.findOne(id);

        if (brand.status === BrandStatus.INACTIVE) {
            throw new BadRequestException('Brand is already inactive');
        }

        brand.status = BrandStatus.INACTIVE;
        const updatedBrand = await this.brandsRepository.save(brand);

        this.logger.log(`Brand deactivated: ${updatedBrand.name} (ID: ${updatedBrand.id})`);
        return updatedBrand;
    }

    async remove(id: string): Promise<void> {
        const brand = await this.findOne(id);

        // Check if brand has cars
        if (brand.cars && brand.cars.length > 0) {
            throw new BadRequestException('Cannot delete brand with associated cars');
        }

        try {
            // Soft delete
            await this.brandsRepository.softDelete(id);

            this.logger.log(`Brand deleted: ${brand.name} (ID: ${brand.id})`);
        } catch (error) {
            this.logger.error(`Failed to delete brand ${id}: ${error.message}`);
            throw new BadRequestException('Failed to delete brand');
        }
    }

    async getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        maintenance: number;
        withCars: number;
        withoutCars: number;
    }> {
        const [
            total,
            active,
            inactive,
            maintenance,
        ] = await Promise.all([
            this.brandsRepository.count(),
            this.brandsRepository.count({ where: { status: BrandStatus.ACTIVE } }),
            this.brandsRepository.count({ where: { status: BrandStatus.INACTIVE } }),
            this.brandsRepository.count({ where: { status: BrandStatus.MAINTENANCE } }),
        ]);

        const brandsWithCars = await this.brandsRepository
            .createQueryBuilder('brand')
            .leftJoin('brand.cars', 'car')
            .where('car.id IS NOT NULL')
            .getCount();

        return {
            total,
            active,
            inactive,
            maintenance,
            withCars: brandsWithCars,
            withoutCars: total - brandsWithCars,
        };
    }

    private async getAllSlugs(): Promise<string[]> {
        const brands = await this.brandsRepository.find({
            select: ['slug'],
        });
        return brands.map(brand => brand.slug);
    }

    private async getMaxSortOrder(): Promise<number> {
        const result = await this.brandsRepository
            .createQueryBuilder('brand')
            .select('MAX(brand.sortOrder)', 'maxSortOrder')
            .getRawOne();

        return result.maxSortOrder || 0;
    }
}