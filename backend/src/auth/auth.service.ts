import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PasswordService } from './services/password.service';
import { JwtService } from './services/jwt.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { logger } from '../common/logger/logger.config';

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    user_id: string;
    username: string;
    email: string;
    roles: string[];
  };
}

export interface RefreshDto {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Auth Service with security best practices:
 * - Account lockout after failed attempts
 * - Secure password verification
 * - Token rotation
 * - Device tracking
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly lockoutService: AccountLockoutService,
  ) {}

  /**
   * Login with username/password
   * Implements account lockout and secure authentication
   */
  async login(
    loginDto: LoginDto,
    metadata: { ip?: string; userAgent?: string },
  ): Promise<LoginResponse> {
    const { username, password } = loginDto;
    const ip = metadata.ip || 'unknown';

    // Check account lockout
    const lockoutInfo = await this.lockoutService.isLocked(username, ip);
    if (lockoutInfo.locked) {
      logger.warn(
        { username, ip, unlockAt: lockoutInfo.unlockAt },
        'Login attempt blocked - account locked',
      );
      throw new ForbiddenException({
        statusCode: 423,
        error: 'Locked',
        message: 'Account is temporarily locked due to too many failed attempts',
        unlockAt: lockoutInfo.unlockAt,
      });
    }

    // Find user by username or email
    const { rows: userRows } = await this.databaseService.query<{
      user_id: string;
      username: string;
      email: string;
      password_hash: string;
      active: boolean;
    }>(
      `SELECT user_id, username, email, password_hash, active
       FROM users
       WHERE (username = $1 OR email = $1) AND active = true
       LIMIT 1`,
      [username],
    );

    const user = userRows[0];

    // Always record attempt (even if user not found) to prevent enumeration
    if (!user) {
      await this.lockoutService.recordAttempt(username, ip, false);
      // Use constant-time delay to prevent timing attacks
      await this.delay(1000);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password (constant-time comparison)
    const isValidPassword = await this.passwordService.verifyPassword(
      password,
      user.password_hash,
    );

    if (!isValidPassword) {
      await this.lockoutService.recordAttempt(username, ip, false);
      const remaining = await this.lockoutService.getRemainingAttempts(username, ip);
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        remainingAttempts: remaining,
      });
    }

    // Successful login
    await this.lockoutService.recordAttempt(username, ip, true);
    await this.lockoutService.clearAttempts(username, ip);

    // Get user roles
    const roles = await this.getUserRoles(user.user_id);

    // Generate tokens
    const accessToken = this.jwtService.signAccessToken({
      sub: user.user_id,
      username: user.username,
      email: user.email,
      roles,
    });

    const refreshToken = this.jwtService.generateRefreshToken();

    // Store refresh token with metadata
    await this.refreshTokenService.storeRefreshToken(user.user_id, refreshToken, {
      ip,
      userAgent: metadata.userAgent,
    });

    logger.info({ userId: user.user_id, username }, 'User logged in successfully');

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtService.getAccessTokenExpiration(),
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        roles,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation for security
   */
  async refresh(refreshDto: RefreshDto, metadata: { ip?: string; userAgent?: string }): Promise<RefreshResponse> {
    const { refreshToken } = refreshDto;

    // Verify refresh token
    const storedToken = await this.refreshTokenService.verifyRefreshToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Get user info
    const { rows: userRows } = await this.databaseService.query<{
      user_id: string;
      username: string;
      email: string;
      active: boolean;
    }>(
      `SELECT user_id, username, email, active
       FROM users
       WHERE user_id = $1 AND active = true`,
      [storedToken.user_id],
    );

    if (!userRows[0]) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const user = userRows[0];

    // Get user roles
    const roles = await this.getUserRoles(user.user_id);

    // Generate new tokens (token rotation)
    const newAccessToken = this.jwtService.signAccessToken({
      sub: user.user_id,
      username: user.username,
      email: user.email,
      roles,
    });

    const newRefreshToken = this.jwtService.generateRefreshToken();

    // Revoke old token and store new one
    await this.refreshTokenService.revokeToken(storedToken.token_id);
    await this.refreshTokenService.storeRefreshToken(user.user_id, newRefreshToken, {
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });

    logger.debug({ userId: user.user_id }, 'Token refreshed');

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.jwtService.getAccessTokenExpiration(),
    };
  }

  /**
   * Logout - revoke refresh token(s)
   */
  async logout(userId: string, allDevices: boolean = false): Promise<void> {
    if (allDevices) {
      await this.refreshTokenService.revokeAllUserTokens(userId);
      logger.info({ userId }, 'User logged out from all devices');
    } else {
      // In a real implementation, you'd need to identify the specific token
      // For now, we'll revoke all tokens (can be improved with token ID tracking)
      await this.refreshTokenService.revokeAllUserTokens(userId);
      logger.info({ userId }, 'User logged out');
    }
  }

  /**
   * Get user roles from database
   */
  private async getUserRoles(userId: string): Promise<string[]> {
    const { rows } = await this.databaseService.query<{ role_name: string }>(
      `SELECT r.role_name
       FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId],
    );

    return rows.map((r) => r.role_name);
  }

  /**
   * Constant-time delay to prevent timing attacks
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

