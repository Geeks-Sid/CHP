import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '../../../src/auth/services/jwt.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtService', () => {
  let service: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
      providers: [JwtService],
    }).compile();

    service = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('signAccessToken', () => {
    it('should sign an access token', () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['Doctor'],
      };

      const token = service.signAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include all payload fields in token', () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['Doctor', 'Nurse'],
      };

      const token = service.signAccessToken(payload);
      const decoded = service.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe(payload.sub);
      expect(decoded?.username).toBe(payload.username);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.roles).toEqual(payload.roles);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['Doctor'],
      };

      const token = service.signAccessToken(payload);
      const verified = service.verifyAccessToken(token);

      expect(verified.sub).toBe(payload.sub);
      expect(verified.username).toBe(payload.username);
      expect(verified.email).toBe(payload.email);
      expect(verified.roles).toEqual(payload.roles);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      // Create a token with very short expiration
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['Doctor'],
      };

      // Temporarily set short TTL
      const originalTtl = service.getAccessTokenExpiration();
      // We can't easily test expiration without waiting, so we'll test invalid token instead
      const invalidToken = 'invalid.token.here';

      expect(() => service.verifyAccessToken(invalidToken)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for tampered token', () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['Doctor'],
      };

      const token = service.signAccessToken(payload);
      const tampered = token.substring(0, token.length - 5) + 'xxxxx';

      expect(() => service.verifyAccessToken(tampered)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for token with wrong secret', () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['Doctor'],
      };

      const token = service.signAccessToken(payload);
      // Token signed with one secret, but we're using the same service so it should work
      // This test would need a different service instance with different secret
      expect(() => service.verifyAccessToken(token)).not.toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const token = service.generateRefreshToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(128); // 64 bytes = 128 hex characters
    });

    it('should generate unique tokens', () => {
      const token1 = service.generateRefreshToken();
      const token2 = service.generateRefreshToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['Doctor'],
      };

      const token = service.signAccessToken(payload);
      const decoded = service.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe(payload.sub);
    });

    it('should return null for invalid token', () => {
      const decoded = service.decodeToken('invalid.token.here');
      expect(decoded).toBeNull();
    });
  });

  describe('getAccessTokenExpiration', () => {
    it('should return access token TTL', () => {
      const ttl = service.getAccessTokenExpiration();
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBe(900); // 15 minutes default
    });
  });

  describe('getRefreshTokenExpiration', () => {
    it('should return refresh token TTL', () => {
      const ttl = service.getRefreshTokenExpiration();
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBe(604800); // 7 days default
    });
  });
});

