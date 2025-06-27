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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { VariantsService } from './variants.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { FilterVariantsDto } from './dto/filter-variants.dto';
import { VariantResponseDto } from './dto/variant-response.dto';
import { VariantStatsDto } from './dto/variant-stats.dto';
import { UpdateVariantSortOrderDto } from './dto/update-variant-sort-order.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { AdminOnly } from '../../auth/decorators/admin-only.decorator';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { plainToInstance } from 'class-transformer';

@ApiTags('Variants')
@Controller('variants')
@UseInterceptors(ClassSerializerInterceptor)
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post()
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new variant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Variant created successfully',
    type: VariantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Variant with this name already exists for this car',
  })
  async create(
    @Body() createVariantDto: CreateVariantDto,
  ): Promise<VariantResponseDto> {
    const variant = await this.variantsService.create(createVariantDto);
    return plainToInstance(VariantResponseDto, variant);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all variants with pagination and filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variants retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'sortOrder',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  async findAll(@Query() filterDto: FilterVariantsDto) {
    const result = await this.variantsService.findAll(filterDto, filterDto);

    return {
      ...result,
      data: result.data.map((variant) =>
        plainToInstance(VariantResponseDto, variant),
      ),
    };
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get all active variants' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active variants retrieved successfully',
    type: [VariantResponseDto],
  })
  async findAllActive(): Promise<VariantResponseDto[]> {
    const variants = await this.variantsService.findAllActive();
    return variants.map((variant) =>
      plainToInstance(VariantResponseDto, variant),
    );
  }

  @Get('stats')
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get variant statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant statistics retrieved successfully',
    type: VariantStatsDto,
  })
  async getStats(): Promise<VariantStatsDto> {
    return this.variantsService.getStats();
  }

  @Get('brand/:brandId')
  @Public()
  @ApiOperation({ summary: 'Get all variants by brand' })
  @ApiParam({ name: 'brandId', description: 'Brand ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variants retrieved successfully',
    type: [VariantResponseDto],
  })
  async findAllByBrand(
    @Param('brandId', ParseUUIDPipe) brandId: string,
  ): Promise<VariantResponseDto[]> {
    const variants = await this.variantsService.findAllByBrand(brandId);
    return variants.map((variant) =>
      plainToInstance(VariantResponseDto, variant),
    );
  }

  @Get('car/:carId')
  @Public()
  @ApiOperation({ summary: 'Get all variants by car' })
  @ApiParam({ name: 'carId', description: 'Car ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variants retrieved successfully',
    type: [VariantResponseDto],
  })
  async findAllByCar(
    @Param('carId', ParseUUIDPipe) carId: string,
  ): Promise<VariantResponseDto[]> {
    const variants = await this.variantsService.findAllByCar(carId);
    return variants.map((variant) =>
      plainToInstance(VariantResponseDto, variant),
    );
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get variant by ID' })
  @ApiParam({ name: 'id', description: 'Variant ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant retrieved successfully',
    type: VariantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Variant not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VariantResponseDto> {
    const variant = await this.variantsService.findOne(id);
    return plainToInstance(VariantResponseDto, variant);
  }

  @Patch('car/:carId/sort-order')
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update variant sort order within car' })
  @ApiParam({ name: 'carId', description: 'Car ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant sort order updated successfully',
  })
  async updateSortOrder(
    @Param('carId', ParseUUIDPipe) carId: string,
    @Body() updateSortOrderDto: UpdateVariantSortOrderDto,
  ): Promise<void> {
    await this.variantsService.updateSortOrder(carId, updateSortOrderDto.items);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update variant by ID' })
  @ApiParam({ name: 'id', description: 'Variant ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant updated successfully',
    type: VariantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Variant not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVariantDto: UpdateVariantDto,
  ): Promise<VariantResponseDto> {
    const variant = await this.variantsService.update(id, updateVariantDto);
    return plainToInstance(VariantResponseDto, variant);
  }

  @Patch(':id/stock')
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update variant stock quantity' })
  @ApiParam({ name: 'id', description: 'Variant ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant stock updated successfully',
    type: VariantResponseDto,
  })
  async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStockDto: UpdateStockDto,
  ): Promise<VariantResponseDto> {
    const variant = await this.variantsService.updateStock(
      id,
      updateStockDto.stockQuantity,
    );
    return plainToInstance(VariantResponseDto, variant);
  }

  @Patch(':id/activate')
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate variant' })
  @ApiParam({ name: 'id', description: 'Variant ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant activated successfully',
    type: VariantResponseDto,
  })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VariantResponseDto> {
    const variant = await this.variantsService.activate(id);
    return plainToInstance(VariantResponseDto, variant);
  }

  @Patch(':id/deactivate')
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate variant' })
  @ApiParam({ name: 'id', description: 'Variant ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant deactivated successfully',
    type: VariantResponseDto,
  })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VariantResponseDto> {
    const variant = await this.variantsService.deactivate(id);
    return plainToInstance(VariantResponseDto, variant);
  }

  @Patch(':id/discontinue')
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Discontinue variant' })
  @ApiParam({ name: 'id', description: 'Variant ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant discontinued successfully',
    type: VariantResponseDto,
  })
  async discontinue(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VariantResponseDto> {
    const variant = await this.variantsService.discontinue(id);
    return plainToInstance(VariantResponseDto, variant);
  }

  @Delete(':id')
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete variant (soft delete)' })
  @ApiParam({ name: 'id', description: 'Variant ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Variant deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Variant not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.variantsService.remove(id);
  }
}
