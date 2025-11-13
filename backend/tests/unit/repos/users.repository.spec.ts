import { Test, TestingModule } from '@nestjs/testing';
import { Pool, PoolClient } from 'pg';
import { UsersRepository } from '../../../src/users/users.repository';
import { DatabaseService } from '../../../src/database/database.service';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let databaseService: DatabaseService;
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(async () => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    } as any;

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn(),
      end: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: DatabaseService,
          useValue: {
            query: jest.fn(),
            getClient: jest.fn().mockResolvedValue(mockClient),
            withTransaction: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    databaseService = module.get<DatabaseService>(DatabaseService);

    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        active: true,
      };

      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
      });

      const result = await repository.findByUsername('testuser');

      expect(result).toBeDefined();
      expect(result?.username).toBe('testuser');
      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['testuser'],
      );
    });

    it('should return null when user not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        active: true,
      };

      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
      });

      const result = await repository.findByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed',
        active: true,
      };

      (databaseService.withTransaction as jest.Mock).mockImplementation(
        async (fn: (client: PoolClient) => Promise<any>) => {
          mockClient.query
            .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // INSERT user
            .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // INSERT roles

          return fn(mockClient);
        },
      );

      const result = await repository.create({
        username: 'newuser',
        email: 'new@example.com',
        passwordHash: 'hashed',
        roleIds: [],
      });

      expect(result).toBeDefined();
      expect(result.username).toBe('newuser');
      expect(databaseService.withTransaction).toHaveBeenCalled();
    });

    it('should create user with roles', async () => {
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed',
        active: true,
      };

      (databaseService.withTransaction as jest.Mock).mockImplementation(
        async (fn: (client: PoolClient) => Promise<any>) => {
          mockClient.query
            .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // INSERT user
            .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT role 1
            .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // INSERT role 2

          return fn(mockClient);
        },
      );

      const result = await repository.create({
        username: 'newuser',
        email: 'new@example.com',
        passwordHash: 'hashed',
        roleIds: [1, 2],
      });

      expect(result).toBeDefined();
      expect(mockClient.query).toHaveBeenCalledTimes(3); // 1 user + 2 roles
    });
  });
});

