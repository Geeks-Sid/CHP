import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from './decorators/current-user.decorator';
import { FastifyRequest } from 'fastify';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 423, description: 'Account locked' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: FastifyRequest,
  ) {
    const metadata = {
      ip: (req.headers['x-forwarded-for'] as string) || 
          (req.headers['x-real-ip'] as string) || 
          req.socket.remoteAddress || 
          'unknown',
      userAgent: req.headers['user-agent'] || undefined,
    };

    return this.authService.login(loginDto, metadata);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() refreshDto: RefreshDto,
    @Req() req: FastifyRequest,
  ) {
    const metadata = {
      ip: (req.headers['x-forwarded-for'] as string) || 
          (req.headers['x-real-ip'] as string) || 
          req.socket.remoteAddress || 
          'unknown',
      userAgent: req.headers['user-agent'] || undefined,
    };

    return this.authService.refresh(refreshDto, metadata);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token(s)' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: CurrentUserType,
    @Body() logoutDto: LogoutDto,
  ) {
    await this.authService.logout(user.userId, logoutDto.allDevices || false);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: CurrentUserType) {
    return {
      user_id: user.userId,
      username: user.username,
      email: user.email,
      roles: user.roles,
    };
  }
}

