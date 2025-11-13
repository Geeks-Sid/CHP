import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getTestPool, cleanupTestData, createTestUser, getAuthToken } from '../helpers';

describe('SQL Injection Security Tests', () => {
  let app: INestApplication;
  let pool = getTestPool();
  let accessToken: string;

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
      roleNames: ['Receptionist'],
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

  describe('SQL Injection in Search Parameters', () => {
    it('should safely handle SQL injection attempts in search', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; DELETE FROM users; --",
        "1' UNION SELECT * FROM users--",
        "admin'--",
        "' OR 1=1--",
      ];

      for (const attempt of sqlInjectionAttempts) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/patients')
          .set('Authorization', `Bearer ${accessToken}`)
          .query({ search: attempt })
          .expect(200); // Should not crash, should return empty or filtered results

        // Verify no SQL error occurred
        expect(response.status).toBe(200);
      }
    });

    it('should safely handle SQL injection in username field', async () => {
      const sqlInjection = "admin' OR '1'='1";

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: sqlInjection,
          password: 'TestPassword123!',
        })
        .expect(401); // Should reject, not crash
    });

    it('should safely handle SQL injection in numeric fields', async () => {
      const sqlInjection = "1; DROP TABLE person; --";

      await request(app.getHttpServer())
        .get(`/api/v1/patients/${sqlInjection}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400); // Should reject invalid ID format
    });
  });

  describe('Parameterized Queries', () => {
    it('should use parameterized queries for all inputs', async () => {
      // This test verifies that the application uses parameterized queries
      // by ensuring SQL injection attempts don't execute

      const maliciousInput = "'; DELETE FROM person WHERE '1'='1";

      // Try to inject in various fields
      await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          first_name: maliciousInput,
          last_name: 'Doe',
          gender_concept_id: 8507,
          year_of_birth: 1980,
        })
        .expect(201); // Should create patient, not execute SQL

      // Verify data was inserted as string, not executed
      const result = await pool.query(
        'SELECT first_name FROM person WHERE first_name = $1',
        [maliciousInput],
      );
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Union-Based SQL Injection', () => {
    it('should prevent union-based SQL injection', async () => {
      const unionInjection = "1' UNION SELECT * FROM users--";

      await request(app.getHttpServer())
        .get(`/api/v1/patients/${unionInjection}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400); // Should reject invalid format
    });
  });

  describe('Boolean-Based Blind SQL Injection', () => {
    it('should prevent boolean-based blind SQL injection', async () => {
      const booleanInjection = "1' AND 1=1--";

      await request(app.getHttpServer())
        .get(`/api/v1/patients/${booleanInjection}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400); // Should reject invalid format
    });
  });
});

