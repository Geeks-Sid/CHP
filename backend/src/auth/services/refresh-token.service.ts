import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { PasswordService } from './password.service';
import { logger } from '../../common/logger/logger.config';

export interface RefreshTokenMetadata {
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface StoredRefreshToken {
  token_id: string;
  user_id: string;
  issued_at: Date;
  revoked_at?: Date;
  user_agent?: string;
  ip?: string;
}

/**
 * Refresh Token Service with security best practices:
 * - Tokens are hashed before storage (bcrypt)
 * - Token rotation on refresh
 * - Device metadata tracking
 * - Automatic cleanup of expired tokens
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly databaseService: DatabaseService,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Store refresh token (hashed) with device metadata
   */
  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    metadata: RefreshTokenMetadata,
  ): Promise<string> {
    // Hash the refresh token before storage
    const tokenHash = await this.passwordService.hashPassword(refreshToken);

    const { rows } = await this.databaseService.query<{ token_id: string }>(
      `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip, issued_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING token_id`,
      [userId, tokenHash, metadata.userAgent || null, metadata.ip || null],
    );

    logger.debug({ userId, tokenId: rows[0].token_id }, 'Refresh token stored');

    return rows[0].token_id;
  }

  /**
   * Verify and retrieve refresh token
   * Returns token metadata if valid
   */
  async verifyRefreshToken(
    refreshToken: string,
    userId?: string,
  ): Promise<StoredRefreshToken | null> {
    // Get all active refresh tokens for user (or all if userId not provided)
    const query = userId
      ? `SELECT token_id, user_id, token_hash, issued_at, revoked_at, user_agent, ip
         FROM refresh_tokens
         WHERE user_id = $1 AND revoked_at IS NULL
         ORDER BY issued_at DESC`
      : `SELECT token_id, user_id, token_hash, issued_at, revoked_at, user_agent, ip
         FROM refresh_tokens
         WHERE revoked_at IS NULL
         ORDER BY issued_at DESC`;

    const { rows } = await this.databaseService.query<{
      token_id: string;
      user_id: string;
      token_hash: string;
      issued_at: Date;
      revoked_at?: Date;
      user_agent?: string;
      ip?: string;
    }>(query, userId ? [userId] : []);

    // Try to match the token against stored hashes
    // Use constant-time comparison for each token
    for (const row of rows) {
      const isValid = await this.passwordService.verifyPassword(
        refreshToken,
        row.token_hash,
      );

      if (isValid) {
        return {
          token_id: row.token_id,
          user_id: row.user_id,
          issued_at: row.issued_at,
          revoked_at: row.revoked_at,
          user_agent: row.user_agent,
          ip: row.ip,
        };
      }
    }

    return null;
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeToken(tokenId: string): Promise<void> {
    await this.databaseService.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_id = $1`,
      [tokenId],
    );

    logger.debug({ tokenId }, 'Refresh token revoked');
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.databaseService.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );

    logger.debug({ userId }, 'All refresh tokens revoked for user');
  }

  /**
   * Revoke all refresh tokens except the current one
   * Used during token rotation
   */
  async revokeAllExceptToken(userId: string, currentTokenId: string): Promise<void> {
    await this.databaseService.query(
      `UPDATE refresh_tokens 
       SET revoked_at = NOW() 
       WHERE user_id = $1 AND token_id != $2 AND revoked_at IS NULL`,
      [userId, currentTokenId],
    );

    logger.debug({ userId, currentTokenId }, 'All tokens revoked except current');
  }

  /**
   * Clean up expired tokens (older than refresh token TTL)
   * Should be run periodically via cron job
   */
  async cleanupExpiredTokens(ttlSeconds: number): Promise<number> {
    const { rowCount } = await this.databaseService.query(
      `DELETE FROM refresh_tokens 
       WHERE issued_at < NOW() - INTERVAL '${ttlSeconds} seconds'`,
      [],
    );

    logger.info({ deletedCount: rowCount }, 'Expired refresh tokens cleaned up');
    return rowCount;
  }

  /**
   * Get all active tokens for a user (for device management)
   */
  async getUserTokens(userId: string): Promise<StoredRefreshToken[]> {
    const { rows } = await this.databaseService.query<StoredRefreshToken>(
      `SELECT token_id, user_id, issued_at, revoked_at, user_agent, ip
       FROM refresh_tokens
       WHERE user_id = $1
       ORDER BY issued_at DESC`,
      [userId],
    );

    return rows;
  }
}

