import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getTestPool, cleanupTestData, createTestUser, createTestPatient, getAuthToken } from '../helpers';

describe('Visits Integration Tests', () => {
  let app: INestApplication;
  let pool = getTestPool();
  let accessToken: string;
  let patientId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const user = await createTestUser(pool, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      roleNames: ['Doctor'],
    });

    const tokens = await getAuthToken(pool, 'testuser', 'TestPassword123!');
    accessToken = tokens.accessToken;

    const patient = await createTestPatient(pool);
    patientId = patient.personId;
  });

  afterAll(async () => {
    await cleanupTestData(pool);
    await app.close();
  });

  beforeEach(async () => {
    await cleanupTestData(pool);
    const patient = await createTestPatient(pool);
    patientId = patient.personId;
  });

  describe('POST /api/v1/visits', () => {
    it('should create a new visit', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          visit_type: 'OPD',
          visit_concept_id: 9201, // Outpatient visit
          visit_start: new Date().toISOString(),
          department_id: 5,
        })
        .expect(201);

      expect(response.body).toHaveProperty('visit_occurrence_id');
      expect(response.body).toHaveProperty('visit_number');
      expect(response.body.visit_number).toMatch(/^V-\d{4}-\d{6}$/);
    });

    it('should prevent overlapping inpatient visits', async () => {
      // Create first IPD visit
      await request(app.getHttpServer())
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          visit_type: 'IPD',
          visit_concept_id: 9201,
          visit_start: new Date().toISOString(),
        })
        .expect(201);

      // Try to create overlapping IPD visit
      await request(app.getHttpServer())
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          visit_type: 'IPD',
          visit_concept_id: 9201,
          visit_start: new Date().toISOString(),
        })
        .expect(409); // Conflict
    });

    it('should allow multiple OPD visits', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          visit_type: 'OPD',
          visit_concept_id: 9201,
          visit_start: new Date().toISOString(),
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          visit_type: 'OPD',
          visit_concept_id: 9201,
          visit_start: new Date().toISOString(),
        })
        .expect(201);
    });
  });

  describe('GET /api/v1/visits', () => {
    it('should list visits with filters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          visit_type: 'OPD',
          visit_concept_id: 9201,
          visit_start: new Date().toISOString(),
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/visits')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ person_id: patientId })
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });
});

