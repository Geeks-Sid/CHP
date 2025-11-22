import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersRepository, CreateUserData, UpdateUserData } from './users.repository';
import { PasswordService } from '../auth/services/password.service';
import { logger } from '../common/logger/logger.config';

/**
 * Users Service
 * Business logic for user management
 * Enforces security and validation rules
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Create a new user
   * Validates password strength and enforces uniqueness
   */
  async createUser(data: {
    username: string;
    email: string;
    password: string;
    role_ids?: number[];
  }) {
    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    // Check for common passwords
    const isCommon = await this.passwordService.isCommonPassword(data.password);
    if (isCommon) {
      throw new BadRequestException('Password is too common and insecure');
    }

    // Hash password
    const password_hash = await this.passwordService.hashPassword(data.password);

    try {
      const user = await this.usersRepository.createUser({
        username: data.username,
        email: data.email,
        password_hash,
        role_ids: data.role_ids,
      });

      logger.info({ userId: user.user_id, username: user.username }, 'User created');

      // Get user with roles
      const userWithRoles = await this.usersRepository.findById(user.user_id);
      if (!userWithRoles) {
        throw new Error('Failed to retrieve created user');
      }
      return userWithRoles;
    } catch (error: any) {
      if (error.message === 'USERNAME_EXISTS') {
        throw new ConflictException('Username already exists');
      }
      if (error.message === 'EMAIL_EXISTS') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Update user
   * Validates password if provided
   */
  async updateUser(userId: string, data: {
    email?: string;
    password?: string;
    active?: boolean;
    role_ids?: number[];
  }) {
    // Check if user exists
    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updateData: UpdateUserData = {};

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.password !== undefined) {
      // Validate password strength
      const passwordValidation = this.passwordService.validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        throw new BadRequestException({
          message: 'Password does not meet security requirements',
          errors: passwordValidation.errors,
        });
      }

      // Check for common passwords
      const isCommon = await this.passwordService.isCommonPassword(data.password);
      if (isCommon) {
        throw new BadRequestException('Password is too common and insecure');
      }

      // Hash password
      updateData.password_hash = await this.passwordService.hashPassword(data.password);
    }

    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    if (data.role_ids !== undefined) {
      updateData.role_ids = data.role_ids;
    }

    try {
      const user = await this.usersRepository.updateUser(userId, updateData);
      logger.info({ userId }, 'User updated');

      // Get user with roles
      const userWithRoles = await this.usersRepository.findById(userId);
      if (!userWithRoles) {
        throw new NotFoundException('User not found');
      }
      return userWithRoles;
    } catch (error: any) {
      if (error.message === 'EMAIL_EXISTS') {
        throw new ConflictException('Email already exists');
      }
      if (error.message === 'USER_NOT_FOUND') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string, hardDelete: boolean = false) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.deleteUser(userId, hardDelete);
    logger.info({ userId, hardDelete }, 'User deleted');
  }

  /**
   * List users with pagination and filters
   */
  async listUsers(params: {
    limit?: number;
    cursor?: string;
    role?: string;
    active?: boolean;
    search?: string;
  }) {
    const limit = Math.min(params.limit || 20, 100); // Max 100 per page
    const pagination = {
      limit,
      cursor: params.cursor,
    };

    const filters = {
      role: params.role,
      active: params.active,
      search: params.search,
    };

    const result = await this.usersRepository.listUsers(pagination, filters);

    return {
      items: result.users,
      nextCursor: result.nextCursor,
    };
  }

  /**
   * Get all available roles
   */
  async getAllRoles() {
    return this.usersRepository.getAllRoles();
  }
}

