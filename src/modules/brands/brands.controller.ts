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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FilterBrandsDto } from './dto/filter-brands.dto';
import { BrandResponseDto } from './dto/brand-response.dto';
import { BrandStatsDto } from './dto/brand-stats.dto';
import { UpdateSortOrderDto } from './dto/update-sort-order.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { AdminOnly } from '../../auth/decorators/admin-only.decorator';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { plainToInstance } from 'class-transformer';

@ApiTags('Brands')
@Controller('brands')
@UseInterceptors(ClassSerializerInterceptor)
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) { }

    @Post()
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new brand' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Brand created successfully',
        type: BrandResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Brand with this name already exists',
    })
    async create(@Body() createBrandDto: CreateBrandDto): Promise<BrandResponseDto> {
        const brand = await this.brandsService.create(createBrandDto);
        return plainToInstance(BrandResponseDto, brand);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all brands with pagination and filtering' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Brands retrieved successfully',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'sortOrder' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
    async findAll(
        @Query() filterDto: FilterBrandsDto,
    ) {
        const result = await this.brandsService.findAll(filterDto, filterDto);

        return {
            ...result,
            data: result.data.map(brand => plainToInstance(BrandResponseDto, brand)),
        };
    }

    @Get('active')
    @Public()
    @ApiOperation({ summary: 'Get all active brands' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Active brands retrieved successfully',
        type: [BrandResponseDto],
    })
    async findAllActive(): Promise<BrandResponseDto[]> {
        const brands = await this.brandsService.findAllActive();
        return brands.map(brand => plainToInstance(BrandResponseDto, brand));
    }

    @Get('stats')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get brand statistics' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Brand statistics retrieved successfully',
        type: BrandStatsDto,
    })
    async getStats(): Promise<BrandStatsDto> {
        return this.brandsService.getStats();
    }

    @Get('slug/:slug')
    @Public()
    @ApiOperation({ summary: 'Get brand by slug' })
    @ApiParam({ name: 'slug', description: 'Brand slug', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Brand retrieved successfully',
        type: BrandResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Brand not found',
    })
    async findBySlug(@Param('slug') slug: string): Promise<BrandResponseDto> {
        const brand = await this.brandsService.findBySlug(slug);
        if (!brand) {
            throw new Error('Brand not found');
        }
        return plainToInstance(BrandResponseDto, brand);
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get brand by ID' })
    @ApiParam({ name: 'id', description: 'Brand ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Brand retrieved successfully',
        type: BrandResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Brand not found',
    })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<BrandResponseDto> {
        const brand = await this.brandsService.findOne(id);
        return plainToInstance(BrandResponseDto, brand);
    }

    @Patch('sort-order')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update brand sort order' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Brand sort order updated successfully',
    })
    async updateSortOrder(@Body() updateSortOrderDto: UpdateSortOrderDto): Promise<void> {
        await this.brandsService.updateSortOrder(updateSortOrderDto.items);
    }

    @Patch(':id')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update brand by ID' })
    @ApiParam({ name: 'id', description: 'Brand ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Brand updated successfully',
        type: BrandResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Brand not found',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateBrandDto: UpdateBrandDto,
    ): Promise<BrandResponseDto> {
        const brand = await this.brandsService.update(id, updateBrandDto);
        return plainToInstance(BrandResponseDto, brand);
    }

    @Patch(':id/activate')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Activate brand' })
    @ApiParam({ name: 'id', description: 'Brand ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Brand activated successfully',
        type: BrandResponseDto,
    })
    async activate(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<BrandResponseDto> {
        const brand = await this.brandsService.activate(id);
        return plainToInstance(BrandResponseDto, brand);
    }

    @Patch(':id/deactivate')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Deactivate brand' })
    @ApiParam({ name: 'id', description: 'Brand ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Brand deactivated successfully',
        type: BrandResponseDto,
    })
    async deactivate(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<BrandResponseDto> {
        const brand = await this.brandsService.deactivate(id);
        return plainToInstance(BrandResponseDto, brand);
    }

    @Delete(':id')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete brand (soft delete)' })
    @ApiParam({ name: 'id', description: 'Brand ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Brand deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Brand not found',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Cannot delete brand with associated cars',
    })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.brandsService.remove(id);
    }
}
