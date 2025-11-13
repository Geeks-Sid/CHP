import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getTestPool, cleanupTestData, createTestUser, getAuthToken } from '../helpers';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let pool = getTestPool();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await cleanupTestData(pool);
    await app.close();
  });

  beforeEach(async () => {
    await cleanupTestData(pool);
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const user = await createTestUser(pool, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        roleNames: ['Doctor'],
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.roles).toContain('Doctor');
    });

    it('should reject invalid credentials', async () => {
      await createTestUser(pool, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent',
          password: 'TestPassword123!',
        })
        .expect(401);
    });

    it('should reject inactive user', async () => {
      await createTestUser(pool, {
        username: 'inactiveuser',
        email: 'inactive@example.com',
        password: 'TestPassword123!',
        active: false,
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'inactiveuser',
          password: 'TestPassword123!',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = await createTestUser(pool, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      // First login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPassword123!',
        })
        .expect(200);

      const refreshToken = loginResponse.body.refreshToken;

      // Refresh the token
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
      expect(refreshResponse.body.refreshToken).not.toBe(refreshToken); // Token rotation
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and revoke refresh token', async () => {
      const user = await createTestUser(pool, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPassword123!',
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          allDevices: false,
        })
        .expect(204);

      // Try to use refresh token after logout
      const refreshToken = loginResponse.body.refreshToken;
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(401);
    });

    it('should require authentication for logout', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({
          allDevices: false,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user info', async () => {
      const user = await createTestUser(pool, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        roleNames: ['Doctor', 'Nurse'],
      });

      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPassword123!',
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // Get current user
      const meResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meResponse.body).toHaveProperty('user_id');
      expect(meResponse.body.username).toBe('testuser');
      expect(meResponse.body.email).toBe('test@example.com');
      expect(meResponse.body.roles).toContain('Doctor');
      expect(meResponse.body.roles).toContain('Nurse');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });
  });
});

