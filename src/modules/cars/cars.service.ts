import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car, CarStatus } from './entities/car.entity';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { SlugUtil } from '../../common/utils/slug.util';
import { BrandsService } from '../brands/brands.service';

@Injectable()
export class CarsService {
    private readonly logger = new Logger(CarsService.name);

    constructor(
        @InjectRepository(Car)
        private carsRepository: Repository<Car>,
        private brandsService: BrandsService,
    ) { }

    async create(createCarDto: CreateCarDto): Promise<Car> {
        const {
            brandId,
            name,
            description,
            type,
            fuelTypes,
            launchYear,
            discontinuedYear,
            startingPrice,
            currency,
            imageUrl,
            imageUrls,
            specifications,
            features,
        } = createCarDto;

        // Validate brand exists and is active
        const brand = await this.brandsService.findOne(brandId);
        if (!brand.isActive) {
            throw new BadRequestException('Brand is not active');
        }

        // Check if car already exists for this brand
        const existingCar = await this.findByBrandAndName(brandId, name);
        if (existingCar) {
            throw new ConflictException('Car with this name already exists for this brand');
        }

        try {
            // Generate unique slug
            const existingSlugs = await this.getAllSlugsByBrand(brandId);
            const slug = SlugUtil.generateUniqueSlug(name, existingSlugs);

            // Get next sort order for this brand
            const maxSortOrder = await this.getMaxSortOrderByBrand(brandId);

            const car = this.carsRepository.create({
                brandId,
                name: name.trim(),
                slug,
                description: description?.trim(),
                type,
                fuelTypes: fuelTypes || [],
                launchYear,
                discontinuedYear,
                startingPrice,
                currency: currency || 'USD',
                imageUrl: imageUrl?.trim(),
                imageUrls: imageUrls || [],
                sortOrder: maxSortOrder + 1,
                specifications,
                features,
            });

            const savedCar = await this.carsRepository.save(car);

            this.logger.log(`Car created: ${savedCar.name} for brand ${brand.name} (ID: ${savedCar.id})`);
            return savedCar;
        } catch (error) {
            this.logger.error(`Failed to create car: ${error.message}`);
            throw new BadRequestException('Failed to create car');
        }
    }

    async findAll(
        paginationDto: PaginationDto,
        filterDto?: FilterCarsDto,
    ): Promise<PaginatedResult<Car>> {
        const queryBuilder = this.carsRepository
            .createQueryBuilder('car')
            .leftJoinAndSelect('car.brand', 'brand')
            .leftJoinAndSelect('car.variants', 'variants')
            .where('car.deletedAt IS NULL');

        // Apply filters
        if (filterDto) {
            if (filterDto.brandId) {
                queryBuilder.andWhere('car.brandId = :brandId', { brandId: filterDto.brandId });
            }

            if (filterDto.status) {
                queryBuilder.andWhere('car.status = :status', { status: filterDto.status });
            }

            if (filterDto.type) {
                queryBuilder.andWhere('car.type = :type', { type: filterDto.type });
            }

            if (filterDto.fuelType) {
                queryBuilder.andWhere(':fuelType = ANY(car.fuelTypes)', {
                    fuelType: filterDto.fuelType,
                });
            }

            if (filterDto.launchYear) {
                queryBuilder.andWhere('car.launchYear = :launchYear', {
                    launchYear: filterDto.launchYear,
                });
            }

            if (filterDto.minPrice) {
                queryBuilder.andWhere('car.startingPrice >= :minPrice', {
                    minPrice: filterDto.minPrice,
                });
            }

            if (filterDto.maxPrice) {
                queryBuilder.andWhere('car.startingPrice <= :maxPrice', {
                    maxPrice: filterDto.maxPrice,
                });
            }

            if (filterDto.createdAfter) {
                queryBuilder.andWhere('car.createdAt >= :createdAfter', {
                    createdAfter: filterDto.createdAfter,
                });
            }

            if (filterDto.createdBefore) {
                queryBuilder.andWhere('car.createdAt <= :createdBefore', {
                    createdBefore: filterDto.createdBefore,
                });
            }
        }

        // Apply search
        if (paginationDto.search) {
            const searchTerm = `%${paginationDto.search.toLowerCase()}%`;
            queryBuilder.andWhere(
                '(LOWER(car.name) LIKE :search OR LOWER(car.description) LIKE :search OR LOWER(brand.name) LIKE :search)',
                { search: searchTerm },
            );
        }

        // Apply sorting
        const sortBy = paginationDto.sortBy || 'sortOrder';
        const sortOrder = paginationDto.sortOrder || 'ASC';
        queryBuilder.orderBy(`car.${sortBy}`, sortOrder);

        return PaginationUtil.paginate(queryBuilder, paginationDto);
    }

    async findAllByBrand(brandId: string): Promise<Car[]> {
        return this.carsRepository.find({
            where: { brandId, status: CarStatus.ACTIVE },
            relations: ['variants'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findAllActive(): Promise<Car[]> {
        return this.carsRepository.find({
            where: { status: CarStatus.ACTIVE },
            relations: ['brand', 'variants'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Car> {
        const car = await this.carsRepository.findOne({
            where: { id },
            relations: ['brand', 'variants'],
        });

        if (!car) {
            throw new NotFoundException(`Car with ID ${id} not found`);
        }

        return car;
    }

    async findByBrandAndName(brandId: string, name: string): Promise<Car | null> {
        return this.carsRepository.findOne({
            where: { brandId, name: name.trim() },
        });
    }

    async findByBrandAndSlug(brandId: string, slug: string): Promise<Car | null> {
        return this.carsRepository.findOne({
            where: { brandId, slug },
            relations: ['brand', 'variants'],
        });
    }

    async update(id: string, updateCarDto: UpdateCarDto): Promise<Car> {
        const car = await this.findOne(id);

        // Check name uniqueness if name is being updated
        if (updateCarDto.name && updateCarDto.name !== car.name) {
            const existingCar = await this.findByBrandAndName(car.brandId, updateCarDto.name);
            if (existingCar && existingCar.id !== id) {
                throw new ConflictException('Car with this name already exists for this brand');
            }
        }

        try {
            // Update slug if name is changing
            let slug = car.slug;
            if (updateCarDto.name && updateCarDto.name !== car.name) {
                const existingSlugs = await this.getAllSlugsByBrand(car.brandId);
                slug = SlugUtil.generateUniqueSlug(
                    updateCarDto.name,
                    existingSlugs.filter(s => s !== car.slug)
                );
            }

            // Update car
            Object.assign(car, {
                ...updateCarDto,
                name: updateCarDto.name?.trim() || car.name,
                slug,
                description: updateCarDto.description?.trim() || car.description,
                imageUrl: updateCarDto.imageUrl?.trim() || car.imageUrl,
                currency: updateCarDto.currency || car.currency,
                updatedAt: new Date(),
            });

            const updatedCar = await this.carsRepository.save(car);

            this.logger.log(`Car updated: ${updatedCar.name} (ID: ${updatedCar.id})`);
            return updatedCar;
        } catch (error) {
            this.logger.error(`Failed to update car ${id}: ${error.message}`);
            throw new BadRequestException('Failed to update car');
        }
    }

    async updateSortOrder(
        brandId: string,
        sortOrderData: { id: string; sortOrder: number }[]
    ): Promise<void> {
        try {
            await this.carsRepository.manager.transaction(async (manager) => {
                for (const item of sortOrderData) {
                    await manager.update(Car, { id: item.id, brandId }, { sortOrder: item.sortOrder });
                }
            });

            this.logger.log(`Car sort order updated for brand ${brandId}`);
        } catch (error) {
            this.logger.error(`Failed to update car sort order: ${error.message}`);
            throw new BadRequestException('Failed to update car sort order');
        }
    }

    async activate(id: string): Promise<Car> {
        const car = await this.findOne(id);

        if (car.status === CarStatus.ACTIVE) {
            throw new BadRequestException('Car is already active');
        }

        car.status = CarStatus.ACTIVE;
        const updatedCar = await this.carsRepository.save(car);

        this.logger.log(`Car activated: ${updatedCar.name} (ID: ${updatedCar.id})`);
        return updatedCar;
    }

    async deactivate(id: string): Promise<Car> {
        const car = await this.findOne(id);

        if (car.status === CarStatus.INACTIVE) {
            throw new BadRequestException('Car is already inactive');
        }

        car.status = CarStatus.INACTIVE;
        const updatedCar = await this.carsRepository.save(car);

        this.logger.log(`Car deactivated: ${updatedCar.name} (ID: ${updatedCar.id})`);
        return updatedCar;
    }

    async discontinue(id: string): Promise<Car> {
        const car = await this.findOne(id);

        if (car.status === CarStatus.DISCONTINUED) {
            throw new BadRequestException('Car is already discontinued');
        }

        car.status = CarStatus.DISCONTINUED;
        car.discontinuedYear = new Date().getFullYear();
        const updatedCar = await this.carsRepository.save(car);

        this.logger.log(`Car discontinued: ${updatedCar.name} (ID: ${updatedCar.id})`);
        return updatedCar;
    }

    async remove(id: string): Promise<void> {
        const car = await this.findOne(id);

        // Check if car has variants
        if (car.variants && car.variants.length > 0) {
            throw new BadRequestException('Cannot delete car with associated variants');
        }

        try {
            // Soft delete
            await this.carsRepository.softDelete(id);

            this.logger.log(`Car deleted: ${car.name} (ID: ${car.id})`);
        } catch (error) {
            this.logger.error(`Failed to delete car ${id}: ${error.message}`);
            throw new BadRequestException('Failed to delete car');
        }
    }

    async getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        discontinued: number;
        upcoming: number;
        withVariants: number;
        withoutVariants: number;
        byBrand: Record<string, number>;
        byType: Record<string, number>;
        byFuelType: Record<string, number>;
    }> {
        const [
            total,
            active,
            inactive,
            discontinued,
            upcoming,
        ] = await Promise.all([
            this.carsRepository.count(),
            this.carsRepository.count({ where: { status: CarStatus.ACTIVE } }),
            this.carsRepository.count({ where: { status: CarStatus.INACTIVE } }),
            this.carsRepository.count({ where: { status: CarStatus.DISCONTINUED } }),
            this.carsRepository.count({ where: { status: CarStatus.UPCOMING } }),
        ]);

        const carsWithVariants = await this.carsRepository
            .createQueryBuilder('car')
            .leftJoin('car.variants', 'variant')
            .where('variant.id IS NOT NULL')
            .getCount();

        // Get brand statistics
        const brandStats = await this.carsRepository
            .createQueryBuilder('car')
            .leftJoin('car.brand', 'brand')
            .select('brand.name', 'name')
            .addSelect('COUNT(car.id)', 'count')
            .groupBy('brand.name')
            .getRawMany();

        const byBrand: Record<string, number> = {};
        brandStats.forEach(stat => {
            byBrand[stat.name] = parseInt(stat.count);
        });

        // Get type statistics
        const typeStats = await this.carsRepository
            .createQueryBuilder('car')
            .select('car.type', 'type')
            .addSelect('COUNT(car.id)', 'count')
            .groupBy('car.type')
            .getRawMany();

        const byType: Record<string, number> = {};
        typeStats.forEach(stat => {
            byType[stat.type] = parseInt(stat.count);
        });

        // Get fuel type statistics (handling array fields)
        const fuelTypeStats = await this.carsRepository
            .createQueryBuilder('car')
            .select('UNNEST(car.fuelTypes)', 'fuelType')
            .addSelect('COUNT(*)', 'count')
            .groupBy('UNNEST(car.fuelTypes)')
            .getRawMany();

        const byFuelType: Record<string, number> = {};
        fuelTypeStats.forEach(stat => {
            byFuelType[stat.fuelType] = parseInt(stat.count);
        });

        return {
            total,
            active,
            inactive,
            discontinued,
            upcoming,
            withVariants: carsWithVariants,
            withoutVariants: total - carsWithVariants,
            byBrand,
            byType,
            byFuelType,
        };
    }

    private async getAllSlugsByBrand(brandId: string): Promise<string[]> {
        const cars = await this.carsRepository.find({
            where: { brandId },
            select: ['slug'],
        });
        return cars.map(car => car.slug);
    }

    private async getMaxSortOrderByBrand(brandId: string): Promise<number> {
        const result = await this.carsRepository
            .createQueryBuilder('car')
            .select('MAX(car.sortOrder)', 'maxSortOrder')
            .where('car.brandId = :brandId', { brandId })
            .getRawOne();

        return result.maxSortOrder || 0;
    }
}