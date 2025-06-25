import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variant, VariantStatus } from './entities/variant.entity';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { FilterVariantsDto } from './dto/filter-variants.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { BrandsService } from '../brands/brands.service';
import { CarsService } from '../cars/cars.service';

@Injectable()
export class VariantsService {
    private readonly logger = new Logger(VariantsService.name);

    constructor(
        @InjectRepository(Variant)
        private variantsRepository: Repository<Variant>,
        private brandsService: BrandsService,
        private carsService: CarsService,
    ) { }

    async create(createVariantDto: CreateVariantDto): Promise<Variant> {
        const {
            brandId,
            carId,
            name,
            description,
            price,
            currency,
            discountedPrice,
            engineCapacity,
            horsePower,
            torque,
            transmission,
            driveType,
            fuelEfficiency,
            seatingCapacity,
            bootSpace,
            color,
            colorCode,
            imageUrl,
            imageUrls,
            isAvailable,
            stockQuantity,
            specifications,
            features,
        } = createVariantDto;

        // Validate brand exists and is active
        const brand = await this.brandsService.findOne(brandId);
        if (!brand.isActive) {
            throw new BadRequestException('Brand is not active');
        }

        // Validate car exists and is active
        const car = await this.carsService.findOne(carId);
        if (!car.isActive) {
            throw new BadRequestException('Car is not active');
        }

        // Verify car belongs to brand
        if (car.brandId !== brandId) {
            throw new BadRequestException('Car does not belong to the specified brand');
        }

        // Check if variant already exists for this car
        const existingVariant = await this.findByCarAndName(carId, name);
        if (existingVariant) {
            throw new ConflictException('Variant with this name already exists for this car');
        }

        try {
            // Get next sort order for this car
            const maxSortOrder = await this.getMaxSortOrderByCar(carId);

            const variant = this.variantsRepository.create({
                brandId,
                carId,
                name: name.trim(),
                description: description?.trim(),
                price,
                currency: currency || 'USD',
                discountedPrice,
                engineCapacity: engineCapacity?.trim(),
                horsePower,
                torque,
                transmission,
                driveType,
                fuelEfficiency,
                seatingCapacity,
                bootSpace,
                color: color?.trim(),
                colorCode,
                imageUrl: imageUrl?.trim(),
                imageUrls: imageUrls || [],
                sortOrder: maxSortOrder + 1,
                isAvailable: isAvailable ?? true,
                stockQuantity: stockQuantity || 0,
                specifications,
                features,
            });

            const savedVariant = await this.variantsRepository.save(variant);

            this.logger.log(`Variant created: ${savedVariant.name} for car ${car.name} (ID: ${savedVariant.id})`);
            return savedVariant;
        } catch (error) {
            this.logger.error(`Failed to create variant: ${error.message}`);
            throw new BadRequestException('Failed to create variant');
        }
    }

    async findAll(
        paginationDto: PaginationDto,
        filterDto?: FilterVariantsDto,
    ): Promise<PaginatedResult<Variant>> {
        const queryBuilder = this.variantsRepository
            .createQueryBuilder('variant')
            .leftJoinAndSelect('variant.brand', 'brand')
            .leftJoinAndSelect('variant.car', 'car')
            .where('variant.deletedAt IS NULL');

        // Apply filters
        if (filterDto) {
            if (filterDto.brandId) {
                queryBuilder.andWhere('variant.brandId = :brandId', { brandId: filterDto.brandId });
            }

            if (filterDto.carId) {
                queryBuilder.andWhere('variant.carId = :carId', { carId: filterDto.carId });
            }

            if (filterDto.status) {
                queryBuilder.andWhere('variant.status = :status', { status: filterDto.status });
            }

            if (filterDto.transmission) {
                queryBuilder.andWhere('variant.transmission = :transmission', {
                    transmission: filterDto.transmission,
                });
            }

            if (filterDto.driveType) {
                queryBuilder.andWhere('variant.driveType = :driveType', {
                    driveType: filterDto.driveType,
                });
            }

            if (filterDto.minPrice) {
                queryBuilder.andWhere('variant.price >= :minPrice', {
                    minPrice: filterDto.minPrice,
                });
            }

            if (filterDto.maxPrice) {
                queryBuilder.andWhere('variant.price <= :maxPrice', {
                    maxPrice: filterDto.maxPrice,
                });
            }

            if (filterDto.isAvailable !== undefined) {
                queryBuilder.andWhere('variant.isAvailable = :isAvailable', {
                    isAvailable: filterDto.isAvailable,
                });
            }

            if (filterDto.inStock !== undefined) {
                if (filterDto.inStock) {
                    queryBuilder.andWhere('variant.stockQuantity > 0');
                } else {
                    queryBuilder.andWhere('variant.stockQuantity = 0');
                }
            }

            if (filterDto.createdAfter) {
                queryBuilder.andWhere('variant.createdAt >= :createdAfter', {
                    createdAfter: filterDto.createdAfter,
                });
            }

            if (filterDto.createdBefore) {
                queryBuilder.andWhere('variant.createdAt <= :createdBefore', {
                    createdBefore: filterDto.createdBefore,
                });
            }
        }

        // Apply search
        if (paginationDto.search) {
            const searchTerm = `%${paginationDto.search.toLowerCase()}%`;
            queryBuilder.andWhere(
                '(LOWER(variant.name) LIKE :search OR LOWER(variant.description) LIKE :search OR LOWER(car.name) LIKE :search OR LOWER(brand.name) LIKE :search)',
                { search: searchTerm },
            );
        }

        // Apply sorting
        const sortBy = paginationDto.sortBy || 'sortOrder';
        const sortOrder = paginationDto.sortOrder || 'ASC';
        queryBuilder.orderBy(`variant.${sortBy}`, sortOrder);

        return PaginationUtil.paginate(queryBuilder, paginationDto);
    }

    async findAllByCar(carId: string): Promise<Variant[]> {
        return this.variantsRepository.find({
            where: { carId, status: VariantStatus.ACTIVE, isAvailable: true },
            relations: ['brand', 'car'],
            order: { sortOrder: 'ASC', price: 'ASC' },
        });
    }

    async findAllByBrand(brandId: string): Promise<Variant[]> {
        return this.variantsRepository.find({
            where: { brandId, status: VariantStatus.ACTIVE, isAvailable: true },
            relations: ['brand', 'car'],
            order: { sortOrder: 'ASC', price: 'ASC' },
        });
    }

    async findAllActive(): Promise<Variant[]> {
        return this.variantsRepository.find({
            where: { status: VariantStatus.ACTIVE, isAvailable: true },
            relations: ['brand', 'car'],
            order: { price: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Variant> {
        const variant = await this.variantsRepository.findOne({
            where: { id },
            relations: ['brand', 'car'],
        });

        if (!variant) {
            throw new NotFoundException(`Variant with ID ${id} not found`);
        }

        return variant;
    }

    async findByCarAndName(carId: string, name: string): Promise<Variant | null> {
        return this.variantsRepository.findOne({
            where: { carId, name: name.trim() },
        });
    }

    async update(id: string, updateVariantDto: UpdateVariantDto): Promise<Variant> {
        const variant = await this.findOne(id);

        // Check name uniqueness if name is being updated
        if (updateVariantDto.name && updateVariantDto.name !== variant.name) {
            const existingVariant = await this.findByCarAndName(variant.carId, updateVariantDto.name);
            if (existingVariant && existingVariant.id !== id) {
                throw new ConflictException('Variant with this name already exists for this car');
            }
        }

        try {
            // Update variant
            Object.assign(variant, {
                ...updateVariantDto,
                name: updateVariantDto.name?.trim() || variant.name,
                description: updateVariantDto.description?.trim() || variant.description,
                engineCapacity: updateVariantDto.engineCapacity?.trim() || variant.engineCapacity,
                color: updateVariantDto.color?.trim() || variant.color,
                imageUrl: updateVariantDto.imageUrl?.trim() || variant.imageUrl,
                currency: updateVariantDto.currency || variant.currency,
                updatedAt: new Date(),
            });

            const updatedVariant = await this.variantsRepository.save(variant);

            this.logger.log(`Variant updated: ${updatedVariant.name} (ID: ${updatedVariant.id})`);
            return updatedVariant;
        } catch (error) {
            this.logger.error(`Failed to update variant ${id}: ${error.message}`);
            throw new BadRequestException('Failed to update variant');
        }
    }

    async updateSortOrder(
        carId: string,
        sortOrderData: { id: string; sortOrder: number }[]
    ): Promise<void> {
        try {
            await this.variantsRepository.manager.transaction(async (manager) => {
                for (const item of sortOrderData) {
                    await manager.update(Variant, { id: item.id, carId }, { sortOrder: item.sortOrder });
                }
            });

            this.logger.log(`Variant sort order updated for car ${carId}`);
        } catch (error) {
            this.logger.error(`Failed to update variant sort order: ${error.message}`);
            throw new BadRequestException('Failed to update variant sort order');
        }
    }

    async updateStock(id: string, stockQuantity: number): Promise<Variant> {
        const variant = await this.findOne(id);

        variant.stockQuantity = Math.max(0, stockQuantity);
        variant.isAvailable = variant.stockQuantity > 0;

        const updatedVariant = await this.variantsRepository.save(variant);

        this.logger.log(`Variant stock updated: ${updatedVariant.name} - Stock: ${updatedVariant.stockQuantity}`);
        return updatedVariant;
    }

    async activate(id: string): Promise<Variant> {
        const variant = await this.findOne(id);

        if (variant.status === VariantStatus.ACTIVE) {
            throw new BadRequestException('Variant is already active');
        }

        variant.status = VariantStatus.ACTIVE;
        const updatedVariant = await this.variantsRepository.save(variant);

        this.logger.log(`Variant activated: ${updatedVariant.name} (ID: ${updatedVariant.id})`);
        return updatedVariant;
    }

    async deactivate(id: string): Promise<Variant> {
        const variant = await this.findOne(id);

        if (variant.status === VariantStatus.INACTIVE) {
            throw new BadRequestException('Variant is already inactive');
        }

        variant.status = VariantStatus.INACTIVE;
        const updatedVariant = await this.variantsRepository.save(variant);

        this.logger.log(`Variant deactivated: ${updatedVariant.name} (ID: ${updatedVariant.id})`);
        return updatedVariant;
    }

    async discontinue(id: string): Promise<Variant> {
        const variant = await this.findOne(id);

        if (variant.status === VariantStatus.DISCONTINUED) {
            throw new BadRequestException('Variant is already discontinued');
        }

        variant.status = VariantStatus.DISCONTINUED;
        variant.isAvailable = false;
        const updatedVariant = await this.variantsRepository.save(variant);

        this.logger.log(`Variant discontinued: ${updatedVariant.name} (ID: ${updatedVariant.id})`);
        return updatedVariant;
    }

    async remove(id: string): Promise<void> {
        const variant = await this.findOne(id);

        try {
            // Soft delete
            await this.variantsRepository.softDelete(id);

            this.logger.log(`Variant deleted: ${variant.name} (ID: ${variant.id})`);
        } catch (error) {
            this.logger.error(`Failed to delete variant ${id}: ${error.message}`);
            throw new BadRequestException('Failed to delete variant');
        }
    }

    async getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        discontinued: number;
        outOfStock: number;
        available: number;
        withDiscount: number;
        byBrand: Record<string, number>;
        byCar: Record<string, number>;
        byTransmission: Record<string, number>;
        byDriveType: Record<string, number>;
        priceRange: {
            min: number;
            max: number;
            average: number;
        };
    }> {
        const [
            total,
            active,
            inactive,
            discontinued,
            outOfStock,
            available,
            withDiscount,
        ] = await Promise.all([
            this.variantsRepository.count(),
            this.variantsRepository.count({ where: { status: VariantStatus.ACTIVE } }),
            this.variantsRepository.count({ where: { status: VariantStatus.INACTIVE } }),
            this.variantsRepository.count({ where: { status: VariantStatus.DISCONTINUED } }),
            this.variantsRepository.count({ where: { status: VariantStatus.OUT_OF_STOCK } }),
            this.variantsRepository.count({ where: { isAvailable: true } }),
            this.variantsRepository
                .createQueryBuilder('variant')
                .where('variant.discountedPrice IS NOT NULL')
                .andWhere('variant.discountedPrice < variant.price')
                .getCount(),
        ]);

        // Get brand statistics
        const brandStats = await this.variantsRepository
            .createQueryBuilder('variant')
            .leftJoin('variant.brand', 'brand')
            .select('brand.name', 'name')
            .addSelect('COUNT(variant.id)', 'count')
            .groupBy('brand.name')
            .getRawMany();

        const byBrand: Record<string, number> = {};
        brandStats.forEach(stat => {
            byBrand[stat.name] = parseInt(stat.count);
        });

        // Get car statistics
        const carStats = await this.variantsRepository
            .createQueryBuilder('variant')
            .leftJoin('variant.car', 'car')
            .select('car.name', 'name')
            .addSelect('COUNT(variant.id)', 'count')
            .groupBy('car.name')
            .getRawMany();

        const byCar: Record<string, number> = {};
        carStats.forEach(stat => {
            byCar[stat.name] = parseInt(stat.count);
        });

        // Get transmission statistics
        const transmissionStats = await this.variantsRepository
            .createQueryBuilder('variant')
            .select('variant.transmission', 'transmission')
            .addSelect('COUNT(variant.id)', 'count')
            .where('variant.transmission IS NOT NULL')
            .groupBy('variant.transmission')
            .getRawMany();

        const byTransmission: Record<string, number> = {};
        transmissionStats.forEach(stat => {
            byTransmission[stat.transmission] = parseInt(stat.count);
        });

        // Get drive type statistics
        const driveTypeStats = await this.variantsRepository
            .createQueryBuilder('variant')
            .select('variant.driveType', 'driveType')
            .addSelect('COUNT(variant.id)', 'count')
            .where('variant.driveType IS NOT NULL')
            .groupBy('variant.driveType')
            .getRawMany();

        const byDriveType: Record<string, number> = {};
        driveTypeStats.forEach(stat => {
            byDriveType[stat.driveType] = parseInt(stat.count);
        });

        // Get price statistics
        const priceStats = await this.variantsRepository
            .createQueryBuilder('variant')
            .select('MIN(variant.price)', 'min')
            .addSelect('MAX(variant.price)', 'max')
            .addSelect('AVG(variant.price)', 'average')
            .getRawOne();

        const priceRange = {
            min: parseFloat(priceStats.min) || 0,
            max: parseFloat(priceStats.max) || 0,
            average: parseFloat(priceStats.average) || 0,
        };

        return {
            total,
            active,
            inactive,
            discontinued,
            outOfStock,
            available,
            withDiscount,
            byBrand,
            byCar,
            byTransmission,
            byDriveType,
            priceRange,
        };
    }

    private async getMaxSortOrderByCar(carId: string): Promise<number> {
        const result = await this.variantsRepository
            .createQueryBuilder('variant')
            .select('MAX(variant.sortOrder)', 'maxSortOrder')
            .where('variant.carId = :carId', { carId })
            .getRawOne();

        return result.maxSortOrder || 0;
    }
}