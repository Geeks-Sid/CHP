import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { JwtService } from '../../../src/auth/services/jwt.service';
import { ConfigModule } from '@nestjs/config';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [JwtAuthGuard, JwtService],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('canActivate', () => {
    it('should allow access with valid token', async () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['Doctor'],
      };

      const token = jwtService.signAccessToken(payload);

      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user.userId).toBe(payload.sub);
      expect(mockRequest.user.username).toBe(payload.username);
      expect(mockRequest.user.email).toBe(payload.email);
      expect(mockRequest.user.roles).toEqual(payload.roles);
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const mockRequest = {
        headers: {},
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should extract token from Bearer header', async () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['Doctor'],
      };

      const token = jwtService.signAccessToken(payload);

      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should extract token without Bearer prefix', async () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['Doctor'],
      };

      const token = jwtService.signAccessToken(payload);

      const mockRequest = {
        headers: {
          authorization: token,
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});

