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
import { LicenseTypesService } from './license-types.service';
import { CreateLicenseTypeDto } from './dto/create-license-type.dto';
import { UpdateLicenseTypeDto } from './dto/update-license-type.dto';
import { FilterLicenseTypesDto } from './dto/filter-license-types.dto';
import { LicenseTypeResponseDto } from './dto/license-type-response.dto';
import { LicenseTypeStatsDto } from './dto/license-type-stats.dto';
import { UpdateSortOrderDto } from '../brands/dto/update-sort-order.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { AdminOnly } from '../../auth/decorators/admin-only.decorator';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { plainToInstance } from 'class-transformer';

@ApiTags('License Types')
@Controller('license-types')
@UseInterceptors(ClassSerializerInterceptor)
export class LicenseTypesController {
    constructor(private readonly licenseTypesService: LicenseTypesService) { }

    @Post()
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new license type' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'License type created successfully',
        type: LicenseTypeResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'License type with this name or code already exists',
    })
    async create(@Body() createLicenseTypeDto: CreateLicenseTypeDto): Promise<LicenseTypeResponseDto> {
        const licenseType = await this.licenseTypesService.create(createLicenseTypeDto);
        return plainToInstance(LicenseTypeResponseDto, licenseType);
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all license types with pagination and filtering' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License types retrieved successfully',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'sortOrder' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
    async findAll(
        @Query() filterDto: FilterLicenseTypesDto,
    ) {
        const result = await this.licenseTypesService.findAll(filterDto, filterDto);

        return {
            ...result,
            data: result.data.map(licenseType => plainToInstance(LicenseTypeResponseDto, licenseType)),
        };
    }

    @Get('active')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all active license types' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Active license types retrieved successfully',
        type: [LicenseTypeResponseDto],
    })
    async findAllActive(): Promise<LicenseTypeResponseDto[]> {
        const licenseTypes = await this.licenseTypesService.findAllActive();
        return licenseTypes.map(licenseType => plainToInstance(LicenseTypeResponseDto, licenseType));
    }

    @Get('stats')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get license type statistics' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License type statistics retrieved successfully',
        type: LicenseTypeStatsDto,
    })
    async getStats(): Promise<LicenseTypeStatsDto> {
        return this.licenseTypesService.getStats();
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get license type by ID' })
    @ApiParam({ name: 'id', description: 'License Type ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License type retrieved successfully',
        type: LicenseTypeResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'License type not found',
    })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<LicenseTypeResponseDto> {
        const licenseType = await this.licenseTypesService.findOne(id);
        return plainToInstance(LicenseTypeResponseDto, licenseType);
    }

    @Patch('sort-order')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update license type sort order' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License type sort order updated successfully',
    })
    async updateSortOrder(@Body() updateSortOrderDto: UpdateSortOrderDto): Promise<void> {
        await this.licenseTypesService.updateSortOrder(updateSortOrderDto.items);
    }

    @Patch(':id')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update license type by ID' })
    @ApiParam({ name: 'id', description: 'License Type ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License type updated successfully',
        type: LicenseTypeResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'License type not found',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateLicenseTypeDto: UpdateLicenseTypeDto,
    ): Promise<LicenseTypeResponseDto> {
        const licenseType = await this.licenseTypesService.update(id, updateLicenseTypeDto);
        return plainToInstance(LicenseTypeResponseDto, licenseType);
    }

    @Patch(':id/activate')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Activate license type' })
    @ApiParam({ name: 'id', description: 'License Type ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License type activated successfully',
        type: LicenseTypeResponseDto,
    })
    async activate(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<LicenseTypeResponseDto> {
        const licenseType = await this.licenseTypesService.activate(id);
        return plainToInstance(LicenseTypeResponseDto, licenseType);
    }

    @Patch(':id/deactivate')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Deactivate license type' })
    @ApiParam({ name: 'id', description: 'License Type ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License type deactivated successfully',
        type: LicenseTypeResponseDto,
    })
    async deactivate(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<LicenseTypeResponseDto> {
        const licenseType = await this.licenseTypesService.deactivate(id);
        return plainToInstance(LicenseTypeResponseDto, licenseType);
    }

    @Delete(':id')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete license type (soft delete)' })
    @ApiParam({ name: 'id', description: 'License Type ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'License type deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'License type not found',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Cannot delete license type with associated licenses',
    })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.licenseTypesService.remove(id);
    }
}
