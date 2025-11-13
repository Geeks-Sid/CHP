import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getTestPool, cleanupTestData, createTestUser, getAuthToken } from '../helpers';

describe('Patients Integration Tests', () => {
  let app: INestApplication;
  let pool = getTestPool();
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user with patient permissions
    const user = await createTestUser(pool, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      roleNames: ['Receptionist'], // Has patient.create permission
    });

    const tokens = await getAuthToken(pool, 'testuser', 'TestPassword123!');
    accessToken = tokens.accessToken;
  });

  afterAll(async () => {
    await cleanupTestData(pool);
    await app.close();
  });

  beforeEach(async () => {
    await cleanupTestData(pool);
  });

  describe('POST /api/v1/patients', () => {
    it('should create a new patient', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          first_name: 'John',
          last_name: 'Doe',
          gender_concept_id: 8507, // Male
          year_of_birth: 1980,
          month_of_birth: 5,
          day_of_birth: 15,
          race_concept_id: 8527, // White
          ethnicity_concept_id: 38003564, // Not Hispanic or Latino
          contact: {
            phone: '+1234567890',
            email: 'john@example.com',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('person_id');
      expect(response.body).toHaveProperty('mrn');
      expect(response.body.mrn).toMatch(/^MRN-\d{4}-\d{6}$/);
    });

    it('should reject patient creation without required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          first_name: 'John',
          // Missing required fields
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/patients')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          gender_concept_id: 8507,
          year_of_birth: 1980,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/patients', () => {
    it('should list patients with pagination', async () => {
      // Create test patients
      await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          first_name: 'John',
          last_name: 'Doe',
          gender_concept_id: 8507,
          year_of_birth: 1980,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should search patients by name', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          first_name: 'Jane',
          last_name: 'Smith',
          gender_concept_id: 8532, // Female
          year_of_birth: 1990,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ search: 'Jane' })
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items[0].first_name).toContain('Jane');
    });
  });

  describe('GET /api/v1/patients/:person_id', () => {
    it('should get patient by ID', async () => {
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

      const personId = createResponse.body.person_id;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/patients/${personId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.person_id).toBe(personId);
      expect(response.body.first_name).toBe('John');
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/patients/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/patients/:person_id', () => {
    it('should update patient', async () => {
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

      const personId = createResponse.body.person_id;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/patients/${personId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          first_name: 'Jane',
        })
        .expect(200);

      expect(response.body.first_name).toBe('Jane');
    });
  });
});

