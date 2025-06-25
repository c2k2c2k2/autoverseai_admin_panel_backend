// src/modules/users/users.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AdminOnly } from '../../auth/decorators/admin-only.decorator';
import { Auth } from '../../auth/decorators/auth.decorator';
import { CurrentDbUser } from '../../auth/decorators/current-db-user.decorator';
import { User, UserRole } from './entities/user.entity';
import { plainToInstance } from 'class-transformer';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @AdminOnly()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User created successfully',
        type: UserResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'User with this email already exists',
    })
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const user = await this.usersService.create(createUserDto);
        return plainToInstance(UserResponseDto, user);
    }

    @Get()
    @AdminOnly()
    @ApiOperation({ summary: 'Get all users with pagination and filtering' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Users retrieved successfully',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    async findAll(
        @Query() paginationDto: PaginationDto,
        @Query() filterDto: FilterUsersDto,
    ) {
        const result = await this.usersService.findAll(paginationDto, filterDto);

        return {
            ...result,
            data: result.data.map(user => plainToInstance(UserResponseDto, user)),
        };
    }

    @Get('stats')
    @AdminOnly()
    @ApiOperation({ summary: 'Get user statistics' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User statistics retrieved successfully',
        type: UserStatsDto,
    })
    async getStats(): Promise<UserStatsDto> {
        return this.usersService.getStats();
    }

    @Get('me')
    @Auth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Current user profile retrieved successfully',
        type: UserResponseDto,
    })
    async getProfile(@CurrentDbUser() user: User): Promise<UserResponseDto> {
        const fullUser = await this.usersService.findOne(user.id);
        return plainToInstance(UserResponseDto, fullUser);
    }

    @Get(':id')
    @AdminOnly()
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User retrieved successfully',
        type: UserResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<UserResponseDto> {
        const user = await this.usersService.findOne(id);
        return plainToInstance(UserResponseDto, user);
    }

    @Patch('me')
    @Auth()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User profile updated successfully',
        type: UserResponseDto,
    })
    async updateProfile(
        @CurrentDbUser() user: User,
        @Body() updateUserDto: Omit<UpdateUserDto, 'role' | 'status'>,
    ): Promise<UserResponseDto> {
        // Users can only update their own profile, excluding role and status
        const { role, status, ...allowedUpdates } = updateUserDto as any;
        const updatedUser = await this.usersService.update(user.id, allowedUpdates);
        return plainToInstance(UserResponseDto, updatedUser);
    }

    @Patch(':id')
    @AdminOnly()
    @ApiOperation({ summary: 'Update user by ID (Admin only)' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User updated successfully',
        type: UserResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        const user = await this.usersService.update(id, updateUserDto);
        return plainToInstance(UserResponseDto, user);
    }

    @Patch(':id/activate')
    @AdminOnly()
    @ApiOperation({ summary: 'Activate user account' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User activated successfully',
        type: UserResponseDto,
    })
    async activate(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<UserResponseDto> {
        const user = await this.usersService.activate(id);
        return plainToInstance(UserResponseDto, user);
    }

    @Patch(':id/deactivate')
    @AdminOnly()
    @ApiOperation({ summary: 'Deactivate user account' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User deactivated successfully',
        type: UserResponseDto,
    })
    async deactivate(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<UserResponseDto> {
        const user = await this.usersService.deactivate(id);
        return plainToInstance(UserResponseDto, user);
    }

    @Delete(':id')
    @AdminOnly()
    @ApiOperation({ summary: 'Delete user (soft delete)' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'User deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.usersService.remove(id);
    }
}