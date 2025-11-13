import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from '../../src/auth/services/password.service';
import { AuthService } from '../../src/auth/auth.service';
import { getTestPool, createTestUser } from '../helpers';

describe('Password Policy Security Tests', () => {
  let passwordService: PasswordService;
  let pool = getTestPool();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    passwordService = module.get<PasswordService>(PasswordService);
  });

  describe('Weak Password Rejection', () => {
    it('should reject passwords shorter than 12 characters', () => {
      const result = passwordService.validatePasswordStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject common passwords', async () => {
      const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
      
      for (const password of commonPasswords) {
        const isCommon = await passwordService.isCommonPassword(password);
        expect(isCommon).toBe(true);
      }
    });

    it('should reject passwords without uppercase', () => {
      const result = passwordService.validatePasswordStrength('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase', () => {
      const result = passwordService.validatePasswordStrength('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = passwordService.validatePasswordStrength('NoNumberHere!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const result = passwordService.validatePasswordStrength('NoSpecialChar123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject passwords with repeated characters', () => {
      const result = passwordService.validatePasswordStrength('AAAAA123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password contains common patterns and is too weak');
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecureP@ssw0rd',
        'Complex#Password2024',
      ];

      for (const password of strongPasswords) {
        const result = passwordService.validatePasswordStrength(password);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('Password Hashing Security', () => {
    it('should use constant-time comparison', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);

      // Verify correct password
      const start1 = Date.now();
      const isValid1 = await passwordService.verifyPassword(password, hash);
      const time1 = Date.now() - start1;

      // Verify incorrect password
      const start2 = Date.now();
      const isValid2 = await passwordService.verifyPassword('WrongPassword123!', hash);
      const time2 = Date.now() - start2;

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(false);
      // Times should be similar (bcrypt is constant-time)
      expect(Math.abs(time1 - time2)).toBeLessThan(100); // Allow small variance
    });

    it('should produce different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });
  });
});

