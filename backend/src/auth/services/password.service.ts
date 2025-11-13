import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { logger } from '../../common/logger/logger.config';

/**
 * Password service with security best practices:
 * - High bcrypt rounds (12+)
 * - Constant-time comparison
 * - Secure password validation
 */
@Injectable()
export class PasswordService {
  private readonly SALT_ROUNDS = 12; // High security: 12 rounds = ~300ms hash time

  /**
   * Hash a password using bcrypt with high security rounds
   * Uses constant-time hashing to prevent timing attacks
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }

    try {
      const hash = await bcrypt.hash(password, this.SALT_ROUNDS);
      return hash;
    } catch (error) {
      logger.error({ error }, 'Password hashing failed');
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify password using constant-time comparison
   * Prevents timing attacks by always comparing full hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    try {
      // bcrypt.compare is constant-time by design
      const isValid = await bcrypt.compare(password, hash);
      return isValid;
    } catch (error) {
      logger.warn({ error }, 'Password verification failed');
      // Always return false on error to prevent information leakage
      return false;
    }
  }

  /**
   * Validate password strength
   * Enforces strong password policy
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const minLength = 12;
    const maxLength = 128;

    if (!password) {
      return { valid: false, errors: ['Password is required'] };
    }

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (password.length > maxLength) {
      errors.push(`Password must be no more than ${maxLength} characters long`);
    }

    // Require at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Require at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Require at least one number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Require at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    const commonPatterns = [
      /(.)\1{3,}/, // Same character repeated 4+ times
      /12345|abcde|qwerty|password/i, // Common sequences
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common patterns and is too weak');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if password is in common password list (simplified check)
   * In production, use Have I Been Pwned API or offline list
   */
  async isCommonPassword(password: string): Promise<boolean> {
    // Common passwords list (truncated - in production use HIBP API)
    const commonPasswords = [
      'password',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
      'admin123',
      'welcome123',
    ];

    const lowerPassword = password.toLowerCase();
    return commonPasswords.some((common) => lowerPassword.includes(common));
  }
}

