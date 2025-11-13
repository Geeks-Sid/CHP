import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('OpenAPI Snapshot Tests', () => {
  let app: INestApplication;
  const snapshotDir = path.join(__dirname, '__snapshots__');
  const snapshotFile = path.join(snapshotDir, 'openapi-spec.json');

  beforeAll(async () => {
    // Create snapshot directory if it doesn't exist
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should match OpenAPI spec snapshot', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    const currentSpec = JSON.stringify(response.body, null, 2);

    if (fs.existsSync(snapshotFile)) {
      // Compare with existing snapshot
      const snapshot = fs.readFileSync(snapshotFile, 'utf-8');
      expect(currentSpec).toBe(snapshot);
    } else {
      // Create initial snapshot
      fs.writeFileSync(snapshotFile, currentSpec, 'utf-8');
      console.log('Created initial OpenAPI snapshot');
    }
  });

  it('should detect changes in API structure', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    const spec = response.body;

    // Verify key structural elements exist
    expect(spec).toHaveProperty('openapi');
    expect(spec).toHaveProperty('info');
    expect(spec).toHaveProperty('paths');
    expect(spec).toHaveProperty('components');

    // Verify API version
    expect(spec.info.version).toBe('1.0');

    // Verify key endpoints are present
    const paths = Object.keys(spec.paths);
    expect(paths.length).toBeGreaterThan(0);
  });
});

