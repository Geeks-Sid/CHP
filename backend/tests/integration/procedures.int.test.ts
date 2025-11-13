import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getTestPool, cleanupTestData, createTestUser, createTestPatient, createTestVisit, getAuthToken } from '../helpers';

describe('Procedures Integration Tests', () => {
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

  describe('POST /api/v1/procedures', () => {
    it('should create a new procedure', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/procedures')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          procedure_concept_id: 2000001, // Example procedure code
          procedure_date: new Date().toISOString(),
          procedure_type_concept_id: 4478661, // Inpatient procedure
          visit_occurrence_id: visitId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('procedure_occurrence_id');
    });

    it('should reject invalid concept codes', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/procedures')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          procedure_concept_id: 999999999, // Invalid code
          procedure_date: new Date().toISOString(),
          procedure_type_concept_id: 4478661,
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/procedures', () => {
    it('should list procedures with filters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/procedures')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          person_id: patientId,
          procedure_concept_id: 2000001,
          procedure_date: new Date().toISOString(),
          procedure_type_concept_id: 4478661,
          visit_occurrence_id: visitId,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/procedures')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ person_id: patientId })
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });
});

