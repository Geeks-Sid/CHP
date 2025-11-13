import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../../../src/auth/guards/permissions.guard';
import { DatabaseService } from '../../../src/database/database.service';
import { PERMISSIONS_KEY } from '../../../src/auth/decorators/permissions.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let databaseService: DatabaseService;
  let reflector: Reflector;

  const mockDatabaseService = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        Reflector,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    databaseService = module.get<DatabaseService>(DatabaseService);
    reflector = module.get<Reflector>(Reflector);

    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no permissions required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const mockRequest = {
        user: {
          userId: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['Doctor'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has required permissions', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['patient.read']);

      mockDatabaseService.query.mockResolvedValue({
        rows: [{ permission_name: 'patient.read' }, { permission_name: 'patient.create' }],
      });

      const mockRequest = {
        user: {
          userId: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['Doctor'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT p.permission_name'),
        ['user-123'],
      );
    });

    it('should deny access when user lacks required permissions', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['patient.delete']);

      mockDatabaseService.query.mockResolvedValue({
        rows: [{ permission_name: 'patient.read' }, { permission_name: 'patient.create' }],
      });

      const mockRequest = {
        user: {
          userId: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['Doctor'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user not authenticated', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['patient.read']);

      const mockRequest = {} as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should check multiple required permissions', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['patient.read', 'patient.create']);

      mockDatabaseService.query.mockResolvedValue({
        rows: [
          { permission_name: 'patient.read' },
          { permission_name: 'patient.create' },
          { permission_name: 'patient.update' },
        ],
      });

      const mockRequest = {
        user: {
          userId: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['Doctor'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny when user has only some required permissions', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['patient.read', 'patient.delete']);

      mockDatabaseService.query.mockResolvedValue({
        rows: [{ permission_name: 'patient.read' }],
      });

      const mockRequest = {
        user: {
          userId: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['Doctor'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });
  });
});

