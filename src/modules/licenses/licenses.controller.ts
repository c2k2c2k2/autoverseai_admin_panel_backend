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
import { LicensesService } from './licenses.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { AssignLicenseDto } from './dto/assign-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { FilterLicensesDto } from './dto/filter-licenses.dto';
import { ValidateLicenseDto } from './dto/validate-license.dto';
import { LicenseResponseDto } from './dto/license-response.dto';
import { LicenseStatsDto } from './dto/license-stats.dto';
import { LicenseValidationResponseDto } from './dto/license-validation-response.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { AdminOnly } from '../../auth/decorators/admin-only.decorator';
import { Auth } from '../../auth/decorators/auth.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentDbUser } from '../../auth/decorators/current-db-user.decorator';
import { LicenseAccess } from '../../auth/decorators/license-access.decorator';
import { CurrentLicense } from '../../auth/decorators/current-license.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { License } from './entities/license.entity';
import { plainToInstance } from 'class-transformer';

@ApiTags('Licenses')
@Controller('licenses')
@UseInterceptors(ClassSerializerInterceptor)
export class LicensesController {
    constructor(private readonly licensesService: LicensesService) { }

    @Post()
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new license (Admin only)' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'License created successfully',
        type: LicenseResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'User already has a license for this license type',
    })
    async create(
        @Body() createLicenseDto: CreateLicenseDto,
        @CurrentDbUser() adminUser: User,
    ): Promise<LicenseResponseDto> {
        const licenseData = {
            ...createLicenseDto,
            assignedBy: adminUser.id,
        };
        const license = await this.licensesService.create(licenseData);
        return plainToInstance(LicenseResponseDto, license);
    }

    @Post('assign')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Assign license to user by email (Admin only)' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'License assigned successfully',
        type: LicenseResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'User already has a license for this license type',
    })
    async assignLicense(
        @Body() assignLicenseDto: AssignLicenseDto,
        @CurrentDbUser() adminUser: User,
    ): Promise<LicenseResponseDto> {
        const licenseData = {
            ...assignLicenseDto,
            assignedBy: adminUser.id,
        };
        const license = await this.licensesService.assignLicense(licenseData);
        return plainToInstance(LicenseResponseDto, license);
    }

    @Post('validate')
    @Public()
    @ApiOperation({ summary: 'Validate license access (Public endpoint for applications)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License validation result',
        type: LicenseValidationResponseDto,
    })
    async validateLicense(
        @Body() validateLicenseDto: ValidateLicenseDto,
    ): Promise<LicenseValidationResponseDto> {
        const result = await this.licensesService.validateLicenseAccess(
            validateLicenseDto.licenseKey,
            validateLicenseDto.password,
            validateLicenseDto.deviceFingerprint,
        );

        return {
            valid: result.valid,
            message: result.message,
            license: result.license ? plainToInstance(LicenseResponseDto, result.license) : undefined,
        };
    }

    @Get()
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all licenses with pagination and filtering (Admin only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Licenses retrieved successfully',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
    async findAll(
        @Query() filterDto: FilterLicensesDto,
    ) {
        const result = await this.licensesService.findAll(filterDto, filterDto);

        return {
            ...result,
            data: result.data.map(license => plainToInstance(LicenseResponseDto, license)),
        };
    }

    @Get('my-licenses')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user licenses' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User licenses retrieved successfully',
        type: [LicenseResponseDto],
    })
    async getMyLicenses(
        @CurrentDbUser() user: User,
        @Query() paginationDto: FilterLicensesDto,
    ) {
        const filterDto: FilterLicensesDto = { ...paginationDto, userId: user.id };
        const result = await this.licensesService.findAll(filterDto, filterDto);

        return {
            ...result,
            data: result.data.map(license => plainToInstance(LicenseResponseDto, license)),
        };
    }

    @Get('stats')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get license statistics (Admin only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License statistics retrieved successfully',
        type: LicenseStatsDto,
    })
    async getStats(): Promise<LicenseStatsDto> {
        return this.licensesService.getStats();
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get license by ID' })
    @ApiParam({ name: 'id', description: 'License ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License retrieved successfully',
        type: LicenseResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'License not found',
    })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentDbUser() user: User,
    ): Promise<LicenseResponseDto> {
        const license = await this.licensesService.findOne(id);

        // Non-admin users can only view their own licenses
        if (!user.isAdmin && license.userId !== user.id) {
            throw new Error('Access denied to this license');
        }

        return plainToInstance(LicenseResponseDto, license);
    }

    @Patch(':id')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update license by ID (Admin only)' })
    @ApiParam({ name: 'id', description: 'License ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License updated successfully',
        type: LicenseResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'License not found',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateLicenseDto: UpdateLicenseDto,
    ): Promise<LicenseResponseDto> {
        const license = await this.licensesService.update(id, updateLicenseDto);
        return plainToInstance(LicenseResponseDto, license);
    }

    @Patch(':id/activate')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Activate license (Admin only)' })
    @ApiParam({ name: 'id', description: 'License ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License activated successfully',
        type: LicenseResponseDto,
    })
    async activate(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<LicenseResponseDto> {
        const license = await this.licensesService.activate(id);
        return plainToInstance(LicenseResponseDto, license);
    }

    @Patch(':id/deactivate')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Deactivate license (Admin only)' })
    @ApiParam({ name: 'id', description: 'License ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License deactivated successfully',
        type: LicenseResponseDto,
    })
    async deactivate(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<LicenseResponseDto> {
        const license = await this.licensesService.deactivate(id);
        return plainToInstance(LicenseResponseDto, license);
    }

    @Patch(':id/suspend')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Suspend license (Admin only)' })
    @ApiParam({ name: 'id', description: 'License ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License suspended successfully',
        type: LicenseResponseDto,
    })
    async suspend(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<LicenseResponseDto> {
        const license = await this.licensesService.suspend(id);
        return plainToInstance(LicenseResponseDto, license);
    }

    @Patch(':id/revoke')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Revoke license (Admin only)' })
    @ApiParam({ name: 'id', description: 'License ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'License revoked successfully',
        type: LicenseResponseDto,
    })
    async revoke(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<LicenseResponseDto> {
        const license = await this.licensesService.revoke(id);
        return plainToInstance(LicenseResponseDto, license);
    }

    @Delete(':id')
    @AdminOnly()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete license (soft delete, Admin only)' })
    @ApiParam({ name: 'id', description: 'License ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'License deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'License not found',
    })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.licensesService.remove(id);
    }
}
