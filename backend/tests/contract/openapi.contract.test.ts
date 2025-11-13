import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getTestPool, cleanupTestData, createTestUser, getAuthToken } from '../helpers';
import * as fs from 'fs';
import * as path from 'path';

describe('OpenAPI Contract Tests', () => {
  let app: INestApplication;
  let pool = getTestPool();
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Setup Swagger
    const config = new DocumentBuilder()
      .setTitle('Hospital Management System API')
      .setDescription('Backend API for Hospital Management System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();

    const user = await createTestUser(pool, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      roleNames: ['Doctor'],
    });

    const tokens = await getAuthToken(pool, 'testuser', 'TestPassword123!');
    accessToken = tokens.accessToken;
  });

  afterAll(async () => {
    await cleanupTestData(pool);
    await app.close();
  });

  describe('OpenAPI Schema Validation', () => {
    it('should generate valid OpenAPI document', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
      expect(response.body.openapi).toMatch(/^3\./);
    });

    it('should include all API endpoints in OpenAPI spec', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const paths = response.body.paths;
      
      // Check for key endpoints
      expect(paths).toHaveProperty('/api/v1/auth/login');
      expect(paths).toHaveProperty('/api/v1/auth/refresh');
      expect(paths).toHaveProperty('/api/v1/auth/logout');
      expect(paths).toHaveProperty('/api/v1/auth/me');
      expect(paths).toHaveProperty('/api/v1/users');
      expect(paths).toHaveProperty('/api/v1/patients');
      expect(paths).toHaveProperty('/api/v1/visits');
    });
  });

  describe('Endpoint Contract Validation', () => {
    it('should match OpenAPI spec for POST /api/v1/auth/login', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPassword123!',
        })
        .expect(200);

      // Verify response matches expected schema
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
      expect(response.body.user).toHaveProperty('user_id');
      expect(response.body.user).toHaveProperty('username');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('roles');
    });

    it('should match OpenAPI spec for GET /api/v1/patients', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should return correct status codes per OpenAPI spec', async () => {
      // 401 for unauthorized
      await request(app.getHttpServer())
        .get('/api/v1/patients')
        .expect(401);

      // 400 for bad request
      await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      // 404 for not found
      await request(app.getHttpServer())
        .get('/api/v1/patients/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Request/Response Schema Validation', () => {
    it('should validate request body against schema', async () => {
      // Invalid request (missing required fields)
      await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          first_name: 'John',
          // Missing required fields
        })
        .expect(400);
    });

    it('should validate response body structure', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          first_name: 'John',
          last_name: 'Doe',
          gender_concept_id: 8507,
          year_of_birth: 1980,
        })
        .expect(201);

      // Verify response structure matches schema
      expect(createResponse.body).toHaveProperty('person_id');
      expect(createResponse.body).toHaveProperty('mrn');
      expect(typeof createResponse.body.person_id).toBe('number');
      expect(typeof createResponse.body.mrn).toBe('string');
    });
  });
});

