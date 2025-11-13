import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getTestPool, cleanupTestData, createTestUser, createTestPatient, createTestVisit, getAuthToken } from '../helpers';

describe('Medications Integration Tests', () => {
  let app: INestApplication;
  let pool = getTestPool();
  let accessToken: string;
  let patientId: number;
  let visitId: number;

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

    const visit = await createTestVisit(pool, { personId: patientId });
    visitId = visit.visitOccurrenceId;
  });

  afterAll(async () => {
    await cleanupTestData(pool);
    await app.close();
  });

  beforeEach(async () => {
    await cleanupTestData(pool);
    const patient = await createTestPatient(pool);
    patientId = patient.personId;
    const visit = await createTestVisit(pool, { personId: patientId });
    visitId = visit.visitOccurrenceId;
  });

  describe('POST /api/v1/medications', () => {
    it('should create a new medication exposure', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/medications')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          drug_concept_id: 19122137, // Example drug code
          drug_exposure_start_date: new Date().toISOString(),
          drug_exposure_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          drug_type_concept_id: 38000177, // Prescription written
          quantity: 30,
          visit_occurrence_id: visitId,
          instructions: 'Take once daily',
        })
        .expect(201);

      expect(response.body).toHaveProperty('drug_exposure_id');
    });

    it('should validate date ranges', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/medications')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          drug_concept_id: 19122137,
          drug_exposure_start_date: new Date().toISOString(),
          drug_exposure_end_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // End before start
          drug_type_concept_id: 38000177,
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/medications', () => {
    it('should list medications with filters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/medications')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          drug_concept_id: 19122137,
          drug_exposure_start_date: new Date().toISOString(),
          drug_type_concept_id: 38000177,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/medications')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ person_id: patientId })
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });
});

