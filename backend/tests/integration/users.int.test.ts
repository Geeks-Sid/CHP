import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getTestPool, cleanupTestData, createTestUser, getAuthToken } from '../helpers';

describe('Users Integration Tests', () => {
  let app: INestApplication;
  let pool = getTestPool();
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create admin user
    const admin = await createTestUser(pool, {
      username: 'admin',
      email: 'admin@example.com',
      password: 'AdminPass123!',
      roleNames: ['Admin'],
    });

    const tokens = await getAuthToken(pool, 'admin', 'AdminPass123!');
    adminToken = tokens.accessToken;
  });

  afterAll(async () => {
    await cleanupTestData(pool);
    await app.close();
  });

  beforeEach(async () => {
    await cleanupTestData(pool);
    // Recreate admin
    await createTestUser(pool, {
      username: 'admin',
      email: 'admin@example.com',
      password: 'AdminPass123!',
      roleNames: ['Admin'],
    });
    const tokens = await getAuthToken(pool, 'admin', 'AdminPass123!');
    adminToken = tokens.accessToken;
  });

  describe('GET /api/v1/users', () => {
    it('should list users with pagination', async () => {
      await createTestUser(pool, {
        username: 'user1',
        email: 'user1@example.com',
        password: 'TestPass123!',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should require admin permissions', async () => {
      const user = await createTestUser(pool, {
        username: 'regularuser',
        email: 'regular@example.com',
        password: 'TestPass123!',
        roleNames: ['Patient'],
      });

      const tokens = await getAuthToken(pool, 'regularuser', 'TestPass123!');

      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(403); // Forbidden
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'NewUserPass123!',
          role_ids: [],
        })
        .expect(201);

      expect(response.body).toHaveProperty('user_id');
      expect(response.body.username).toBe('newuser');
      expect(response.body.email).toBe('newuser@example.com');
    });

    it('should reject duplicate username', async () => {
      await createTestUser(pool, {
        username: 'existing',
        email: 'existing@example.com',
        password: 'TestPass123!',
      });

      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'existing',
          email: 'different@example.com',
          password: 'TestPass123!',
        })
        .expect(409); // Conflict
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update user', async () => {
      const user = await createTestUser(pool, {
        username: 'updatable',
        email: 'updatable@example.com',
        password: 'TestPass123!',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${user.userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'updated@example.com',
        })
        .expect(200);

      expect(response.body.email).toBe('updated@example.com');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user', async () => {
      const user = await createTestUser(pool, {
        username: 'deletable',
        email: 'deletable@example.com',
        password: 'TestPass123!',
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/users/${user.userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});

