import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, IsNull } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { EmailService } from '../../common/services/email.service';
import { ClerkService } from '../../auth/clerk.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
    private clerkService: ClerkService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, firstName, lastName, phone, role, status } = createUserDto;

    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    try {
      // Create user in our database
      const user = this.usersRepository.create({
        email: email.toLowerCase().trim(),
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        phone: phone?.trim(),
        role: role || UserRole.USER,
        status: status || UserStatus.PENDING,
      });

      const savedUser = await this.usersRepository.save(user);

      // Send welcome email
      if (savedUser.status === UserStatus.ACTIVE) {
        try {
          await this.emailService.sendWelcomeEmail(
            savedUser.email,
            savedUser.fullName || savedUser.email,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to send welcome email to ${savedUser.email}`,
          );
        }
      }

      this.logger.log(`User created: ${savedUser.email} (ID: ${savedUser.id})`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw new BadRequestException('Failed to create user');
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto?: FilterUsersDto,
  ): Promise<PaginatedResult<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.licenses', 'licenses')
      .where('user.deletedAt IS NULL');

    // Apply filters
    if (filterDto) {
      if (filterDto.role) {
        queryBuilder.andWhere('user.role = :role', { role: filterDto.role });
      }

      if (filterDto.status) {
        queryBuilder.andWhere('user.status = :status', {
          status: filterDto.status,
        });
      }

      if (filterDto.createdAfter) {
        queryBuilder.andWhere('user.createdAt >= :createdAfter', {
          createdAfter: filterDto.createdAfter,
        });
      }

      if (filterDto.createdBefore) {
        queryBuilder.andWhere('user.createdAt <= :createdBefore', {
          createdBefore: filterDto.createdBefore,
        });
      }
    }

    // Apply search
    if (paginationDto.search) {
      const searchTerm = `%${paginationDto.search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(user.email) LIKE :search OR LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search)',
        { search: searchTerm },
      );
    }

    // Apply sorting
    const sortBy = paginationDto.sortBy || 'createdAt';
    const sortOrder = paginationDto.sortOrder || 'DESC';
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    return PaginationUtil.paginate(queryBuilder, paginationDto);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['licenses', 'licenses.licenseType', 'licenses.licenseBrands'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
      relations: ['licenses'],
    });
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { clerkId },
      relations: ['licenses'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    try {
      // Update user
      Object.assign(user, {
        ...updateUserDto,
        email: updateUserDto.email?.toLowerCase().trim() || user.email,
        firstName: updateUserDto.firstName?.trim() || user.firstName,
        lastName: updateUserDto.lastName?.trim() || user.lastName,
        phone: updateUserDto.phone?.trim() || user.phone,
        updatedAt: new Date(),
      });

      const updatedUser = await this.usersRepository.save(user);

      this.logger.log(
        `User updated: ${updatedUser.email} (ID: ${updatedUser.id})`,
      );
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user ${id}: ${error.message}`);
      throw new BadRequestException('Failed to update user');
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async syncWithClerk(clerkId: string): Promise<User> {
    try {
      const clerkUser = await this.clerkService.getUser(clerkId);

      let user = await this.findByClerkId(clerkId);

      if (!user) {
        // Create new user from Clerk data
        user = await this.create({
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          clerkId: clerkUser.id,
          profileImageUrl: clerkUser.imageUrl,
          status: UserStatus.ACTIVE,
          emailVerifiedAt:
            clerkUser.emailAddresses[0]?.verification?.status === 'verified'
              ? new Date().toISOString()
              : undefined,
        });
      } else {
        // Update existing user with Clerk data
        await this.update(user.id, {
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          profileImageUrl: clerkUser.imageUrl,
          emailVerifiedAt:
            clerkUser.emailAddresses[0]?.verification?.status === 'verified'
              ? new Date().toISOString()
              : user.emailVerifiedAt?.toISOString(),
        });
        user = await this.findOne(user.id);
      }

      return user;
    } catch (error) {
      this.logger.error(`Failed to sync user with Clerk: ${error.message}`);
      throw new BadRequestException('Failed to sync user with Clerk');
    }
  }

  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is already active');
    }

    user.status = UserStatus.ACTIVE;
    const updatedUser = await this.usersRepository.save(user);

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(
        updatedUser.email,
        updatedUser.fullName || updatedUser.email,
      );
    } catch (error) {
      this.logger.warn(`Failed to send welcome email to ${updatedUser.email}`);
    }

    this.logger.log(
      `User activated: ${updatedUser.email} (ID: ${updatedUser.id})`,
    );
    return updatedUser;
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);

    if (user.status === UserStatus.INACTIVE) {
      throw new BadRequestException('User is already inactive');
    }

    user.status = UserStatus.INACTIVE;
    const updatedUser = await this.usersRepository.save(user);

    this.logger.log(
      `User deactivated: ${updatedUser.email} (ID: ${updatedUser.id})`,
    );
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    try {
      // Soft delete
      await this.usersRepository.softDelete(id);

      this.logger.log(`User deleted: ${user.email} (ID: ${user.id})`);
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}: ${error.message}`);
      throw new BadRequestException('Failed to delete user');
    }
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
    admins: number;
    recentSignups: number;
  }> {
    const [total, active, inactive, pending, admins, recentSignups] =
      await Promise.all([
        this.usersRepository.count(),
        this.usersRepository.count({ where: { status: UserStatus.ACTIVE } }),
        this.usersRepository.count({ where: { status: UserStatus.INACTIVE } }),
        this.usersRepository.count({ where: { status: UserStatus.PENDING } }),
        this.usersRepository.count({ where: { role: UserRole.ADMIN } }),
        this.usersRepository.count({
          where: {
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        }),
      ]);

    return {
      total,
      active,
      inactive,
      pending,
      admins,
      recentSignups,
    };
  }
}
