import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { logger } from '../../common/logger/logger.config';

export interface JwtPayload {
  sub: string; // user_id
  username: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
  iss?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * JWT Service with security best practices:
 * - Short-lived access tokens (15 minutes)
 * - Long-lived refresh tokens (7 days) with rotation
 * - Secure token generation
 * - Proper error handling
 */
@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly accessTokenTtl: number;
  private readonly refreshTokenTtl: number;
  private readonly issuer: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>('JWT_SECRET') || '';
    this.accessTokenTtl = this.configService.get<number>('JWT_ACCESS_TTL') || 900;
    this.refreshTokenTtl = this.configService.get<number>('JWT_REFRESH_TTL') || 604800;
    this.issuer = this.configService.get<string>('JWT_ISSUER') || 'hospital-ms';

    if (!this.secret || this.secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
  }

  /**
   * Generate access token (short-lived)
   * Expires in 15 minutes by default
   */
  signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss'>): string {
    try {
      const token = jwt.sign(
        {
          ...payload,
          iss: this.issuer,
        },
        this.secret,
        {
          expiresIn: this.accessTokenTtl,
          algorithm: 'HS256', // Use HS256 for symmetric key
        },
      );

      return token;
    } catch (error) {
      logger.error({ error }, 'Failed to sign access token');
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Verify access token
   * Throws UnauthorizedException if invalid
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        algorithms: ['HS256'],
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Access token expired');
        throw new UnauthorizedException('Token has expired');
      }

      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn({ error: error.message }, 'Invalid access token');
        throw new UnauthorizedException('Invalid token');
      }

      logger.error({ error }, 'Token verification failed');
      throw new UnauthorizedException('Token verification failed');
    }
  }

  /**
   * Generate cryptographically secure refresh token
   * Returns plain token (to be hashed before storage)
   */
  generateRefreshToken(): string {
    // Generate 64-byte random token (512 bits)
    return randomBytes(64).toString('hex');
  }

  /**
   * Get token expiration time
   */
  getAccessTokenExpiration(): number {
    return this.accessTokenTtl;
  }

  /**
   * Get refresh token expiration time
   */
  getRefreshTokenExpiration(): number {
    return this.refreshTokenTtl;
  }

  /**
   * Decode token without verification (for debugging only)
   * Should not be used in production for security checks
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      logger.warn({ error }, 'Failed to decode token');
      return null;
    }
  }
}

