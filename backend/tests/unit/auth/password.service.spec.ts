import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from '../../../src/auth/services/password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should throw error for empty password', async () => {
      await expect(service.hashPassword('')).rejects.toThrow('Password cannot be empty');
    });

    it('should produce different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      // bcrypt includes salt, so hashes should be different
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hashPassword(password);

      const isValid = await service.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await service.hashPassword(password);

      const isValid = await service.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await service.hashPassword('TestPassword123!');
      const isValid = await service.verifyPassword('', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isValid = await service.verifyPassword('TestPassword123!', '');
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = service.validatePasswordStrength('StrongPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 12 characters', () => {
      const result = service.validatePasswordStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = service.validatePasswordStrength('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = service.validatePasswordStrength('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = service.validatePasswordStrength('NoNumberHere!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = service.validatePasswordStrength('NoSpecialChar123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject password with repeated characters', () => {
      const result = service.validatePasswordStrength('AAAAA123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password contains common patterns and is too weak');
    });

    it('should reject common passwords', () => {
      const result = service.validatePasswordStrength('password123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password contains common patterns and is too weak');
    });

    it('should reject empty password', () => {
      const result = service.validatePasswordStrength('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });
  });

  describe('isCommonPassword', () => {
    it('should detect common passwords', async () => {
      const isCommon = await service.isCommonPassword('password');
      expect(isCommon).toBe(true);
    });

    it('should not flag strong passwords as common', async () => {
      const isCommon = await service.isCommonPassword('MySecurePass123!');
      expect(isCommon).toBe(false);
    });

    it('should detect common passwords case-insensitively', async () => {
      const isCommon = await service.isCommonPassword('PASSWORD');
      expect(isCommon).toBe(true);
    });
  });
});

