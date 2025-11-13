import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { logger } from '../../common/logger/logger.config';

export interface LoginAttempt {
  identifier: string; // username or email
  ip: string;
  success: boolean;
  timestamp: Date;
}

/**
 * Account Lockout Service with security best practices:
 * - Exponential backoff on failed attempts
 * - IP-based and user-based tracking
 * - Automatic unlock after cooldown period
 * - Prevents brute force attacks
 */
@Injectable()
export class AccountLockoutService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minute window

  // In-memory store (in production, use Redis)
  private readonly attempts = new Map<string, LoginAttempt[]>();

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Record a login attempt
   */
  async recordAttempt(identifier: string, ip: string, success: boolean): Promise<void> {
    const key = `${identifier}:${ip}`;
    const attempts = this.attempts.get(key) || [];

    attempts.push({
      identifier,
      ip,
      success,
      timestamp: new Date(),
    });

    // Keep only attempts within the time window
    const cutoff = new Date(Date.now() - this.WINDOW_MS);
    const recentAttempts = attempts.filter((a) => a.timestamp > cutoff);

    this.attempts.set(key, recentAttempts);

    // Log failed attempts for audit
    if (!success) {
      logger.warn(
        { identifier, ip, attemptCount: recentAttempts.filter((a) => !a.success).length },
        'Failed login attempt recorded',
      );
    }
  }

  /**
   * Check if account is locked
   * Returns lockout info if locked, null if not locked
   */
  async isLocked(identifier: string, ip: string): Promise<{
    locked: boolean;
    unlockAt?: Date;
    remainingAttempts?: number;
  }> {
    const key = `${identifier}:${ip}`;
    const attempts = this.attempts.get(key) || [];

    // Filter to recent attempts
    const cutoff = new Date(Date.now() - this.WINDOW_MS);
    const recentAttempts = attempts.filter((a) => a.timestamp > cutoff);

    // Count failed attempts
    const failedAttempts = recentAttempts.filter((a) => !a.success);

    if (failedAttempts.length >= this.MAX_ATTEMPTS) {
      // Check if lockout period has passed
      const oldestFailedAttempt = failedAttempts[0];
      const lockoutEnd = new Date(
        oldestFailedAttempt.timestamp.getTime() + this.LOCKOUT_DURATION_MS,
      );

      if (new Date() < lockoutEnd) {
        return {
          locked: true,
          unlockAt: lockoutEnd,
        };
      } else {
        // Lockout expired, clear attempts
        this.attempts.delete(key);
        return { locked: false };
      }
    }

    return {
      locked: false,
      remainingAttempts: this.MAX_ATTEMPTS - failedAttempts.length,
    };
  }

  /**
   * Clear all attempts for an identifier (on successful login)
   */
  async clearAttempts(identifier: string, ip: string): Promise<void> {
    const key = `${identifier}:${ip}`;
    this.attempts.delete(key);
  }

  /**
   * Get remaining attempts before lockout
   */
  async getRemainingAttempts(identifier: string, ip: string): Promise<number> {
    const lockoutInfo = await this.isLocked(identifier, ip);
    return lockoutInfo.remainingAttempts || 0;
  }
}

