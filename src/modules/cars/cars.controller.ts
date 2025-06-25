import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpStatus,
    ParseUUIDPipe,
    UseInterceptors,
    ClassSerializerInterceptor,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { CarResponseDto } from './dto/car-response.dto';
import { CarStatsDto } from './dto/car-stats.dto';
import { UpdateCarSortOrderDto } from './dto/update-car-sort-order.dto';
import { PaginationDto, SortOrder } from '../../common/dto/pagination.dto';
import { AdminOnly } from '../../auth/decorators/admin-only.decorator';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { plainToInstance } from 'class-transformer';

@ApiTags('Cars')
@Controller('cars')
@UseInterceptors(ClassSerializerInterceptor)
export class CarsController {
    constructor(private readonly carsService: CarsService) { }

    @Post()
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new car' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Car created successfully',
        type: CarResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Car with this name already exists for this brand',
    })
    async create(@Body() createCarDto: CreateCarDto): Promise<CarResponseDto> {
        const car = await this.carsService.create(createCarDto);
        return plainToInstance(CarResponseDto, car);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all cars with pagination and filtering' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Cars retrieved successfully',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'sortOrder' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
    async findAll(
        @Query() filterDto: FilterCarsDto,
    ) {
        const result = await this.carsService.findAll(filterDto, filterDto);

        return {
            ...result,
            data: result.data.map(car => plainToInstance(CarResponseDto, car)),
        };
    }

    @Get('active')
    @Public()
    @ApiOperation({ summary: 'Get all active cars' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Active cars retrieved successfully',
        type: [CarResponseDto],
    })
    async findAllActive(): Promise<CarResponseDto[]> {
        const cars = await this.carsService.findAllActive();
        return cars.map(car => plainToInstance(CarResponseDto, car));
    }

    @Get('stats')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get car statistics' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Car statistics retrieved successfully',
        type: CarStatsDto,
    })
    async getStats(): Promise<CarStatsDto> {
        return this.carsService.getStats();
    }

    @Get('brand/:brandId')
    @Public()
    @ApiOperation({ summary: 'Get all cars by brand' })
    @ApiParam({ name: 'brandId', description: 'Brand ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Cars retrieved successfully',
        type: [CarResponseDto],
    })
    async findAllByBrand(
        @Param('brandId', ParseUUIDPipe) brandId: string,
    ): Promise<CarResponseDto[]> {
        const cars = await this.carsService.findAllByBrand(brandId);
        return cars.map(car => plainToInstance(CarResponseDto, car));
    }

    @Get('brand/:brandId/slug/:slug')
    @Public()
    @ApiOperation({ summary: 'Get car by brand and slug' })
    @ApiParam({ name: 'brandId', description: 'Brand ID', type: 'string' })
    @ApiParam({ name: 'slug', description: 'Car slug', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Car retrieved successfully',
        type: CarResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Car not found',
    })
    async findByBrandAndSlug(
        @Param('brandId', ParseUUIDPipe) brandId: string,
        @Param('slug') slug: string,
    ): Promise<CarResponseDto> {
        const car = await this.carsService.findByBrandAndSlug(brandId, slug);
        if (!car) {
            throw new Error('Car not found');
        }
        return plainToInstance(CarResponseDto, car);
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get car by ID' })
    @ApiParam({ name: 'id', description: 'Car ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Car retrieved successfully',
        type: CarResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Car not found',
    })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<CarResponseDto> {
        const car = await this.carsService.findOne(id);
        return plainToInstance(CarResponseDto, car);
    }

    @Patch('brand/:brandId/sort-order')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update car sort order within brand' })
    @ApiParam({ name: 'brandId', description: 'Brand ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Car sort order updated successfully',
    })
    async updateSortOrder(
        @Param('brandId', ParseUUIDPipe) brandId: string,
        @Body() updateSortOrderDto: UpdateCarSortOrderDto,
    ): Promise<void> {
        await this.carsService.updateSortOrder(brandId, updateSortOrderDto.items);
    }

    @Patch(':id')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update car by ID' })
    @ApiParam({ name: 'id', description: 'Car ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Car updated successfully',
        type: CarResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Car not found',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateCarDto: UpdateCarDto,
    ): Promise<CarResponseDto> {
        const car = await this.carsService.update(id, updateCarDto);
        return plainToInstance(CarResponseDto, car);
    }

    @Patch(':id/activate')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Activate car' })
    @ApiParam({ name: 'id', description: 'Car ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Car activated successfully',
        type: CarResponseDto,
    })
    async activate(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<CarResponseDto> {
        const car = await this.carsService.activate(id);
        return plainToInstance(CarResponseDto, car);
    }

    @Patch(':id/deactivate')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Deactivate car' })
    @ApiParam({ name: 'id', description: 'Car ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Car deactivated successfully',
        type: CarResponseDto,
    })
    async deactivate(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<CarResponseDto> {
        const car = await this.carsService.deactivate(id);
        return plainToInstance(CarResponseDto, car);
    }

    @Patch(':id/discontinue')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Discontinue car' })
    @ApiParam({ name: 'id', description: 'Car ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Car discontinued successfully',
        type: CarResponseDto,
    })
    async discontinue(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<CarResponseDto> {
        const car = await this.carsService.discontinue(id);
        return plainToInstance(CarResponseDto, car);
    }

    @Delete(':id')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete car (soft delete)' })
    @ApiParam({ name: 'id', description: 'Car ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Car deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Car not found',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Cannot delete car with associated variants',
    })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.carsService.remove(id);
    }
}