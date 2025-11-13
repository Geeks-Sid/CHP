import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto, UserListResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('user.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @Permissions('user.read')
  @ApiOperation({ summary: 'List users with pagination and filters' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by role name' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search username or email' })
  @ApiResponse({ status: 200, description: 'Users list', type: UserListResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async listUsers(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('role') role?: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
  ): Promise<UserListResponseDto> {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const activeBool = active === undefined ? undefined : active === 'true';

    return this.usersService.listUsers({
      limit: limitNum,
      cursor,
      role,
      active: activeBool,
      search,
    });
  }

  @Get('roles')
  @Permissions('user.read')
  @ApiOperation({ summary: 'Get all available roles' })
  @ApiResponse({ status: 200, description: 'Roles list' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getRoles() {
    return this.usersService.getAllRoles();
  }

  @Get(':id')
  @Permissions('user.read')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  @Permissions('user.update')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions('user.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (soft delete by default)' })
  @ApiQuery({ name: 'hard', required: false, type: Boolean, description: 'Hard delete (permanent)' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deleteUser(
    @Param('id') id: string,
    @Query('hard') hard?: string,
  ): Promise<void> {
    const hardDelete = hard === 'true';
    await this.usersService.deleteUser(id, hardDelete);
  }
}

