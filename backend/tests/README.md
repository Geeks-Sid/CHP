# Testing Infrastructure

This directory contains comprehensive tests for the Hospital Management System backend.

## Test Structure

```
tests/
├── setup.ts                    # Test database setup with Testcontainers
├── helpers.ts                  # Test utility functions
├── unit/                       # Unit tests
│   ├── auth/                   # Authentication service tests
│   ├── guards/                 # Guard tests
│   └── repos/                  # Repository tests
├── integration/                # Integration tests
│   ├── auth.int.test.ts
│   ├── users.int.test.ts
│   ├── patients.int.test.ts
│   ├── visits.int.test.ts
│   ├── procedures.int.test.ts
│   └── medications.int.test.ts
├── security/                   # Security tests
│   ├── password-policy.test.ts
│   ├── jwt-tampering.test.ts
│   ├── sql-injection.test.ts
│   └── phi-redaction.test.ts
├── contract/                   # Contract tests
│   ├── openapi.contract.test.ts
│   └── openapi.snapshot.test.ts
└── load/                       # Load tests
    └── k6-scenarios.js
```

## Prerequisites

1. **Docker** - Required for Testcontainers (PostgreSQL)
2. **Node.js** - Version 18+ recommended
3. **k6** (optional) - For load testing: https://k6.io/docs/getting-started/installation/

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test -- --testPathPattern=unit
```

### Integration Tests Only
```bash
npm run test:e2e
```

### With Coverage
```bash
npm run test:cov
```

### Watch Mode
```bash
npm run test:watch
```

### Specific Test File
```bash
npm test -- tests/integration/auth.int.test.ts
```

## Test Types

### Unit Tests
- Test individual services, guards, and repositories in isolation
- Use mocks for dependencies
- Fast execution
- Located in `tests/unit/`

### Integration Tests
- Test full request/response cycles
- Use real database (Testcontainers)
- Test authentication, authorization, and business logic
- Located in `tests/integration/`

### Security Tests
- Test password policies
- Test JWT security
- Test SQL injection prevention
- Test PHI redaction
- Located in `tests/security/`

### Contract Tests
- Validate API contracts against OpenAPI spec
- Ensure backward compatibility
- Located in `tests/contract/`

### Load Tests
- Performance testing with k6
- Test system under load
- Located in `tests/load/`

## Test Database

Tests use **Testcontainers** to spin up a real PostgreSQL database in Docker. This ensures:
- Real database behavior
- Isolation between test runs
- No need for manual database setup

The test database is automatically:
- Created before tests run
- Migrated with all schema changes
- Cleaned up after tests complete

## Writing Tests

### Example Unit Test
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from '../../../src/auth/services/password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should hash a password', async () => {
    const hash = await service.hashPassword('TestPassword123!');
    expect(hash).toBeDefined();
  });
});
```

### Example Integration Test
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getTestPool, cleanupTestData, createTestUser, getAuthToken } from '../helpers';

describe('Auth Integration', () => {
  let app: INestApplication;
  let pool = getTestPool();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await cleanupTestData(pool);
    await app.close();
  });

  it('should login', async () => {
    const user = await createTestUser(pool, {
      username: 'testuser',
      password: 'TestPassword123!',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'testuser', password: 'TestPassword123!' })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
  });
});
```

## Test Helpers

The `helpers.ts` file provides utilities:
- `createTestUser()` - Create test users with roles
- `createTestPatient()` - Create test patients
- `createTestVisit()` - Create test visits
- `getAuthToken()` - Get JWT tokens for authenticated requests
- `cleanupTestData()` - Clean up test data
- `getTestPool()` - Get database connection pool

## Load Testing with k6

```bash
# Install k6
# macOS: brew install k6
# Linux: See https://k6.io/docs/getting-started/installation/

# Run load tests
k6 run tests/load/k6-scenarios.js

# With custom parameters
BASE_URL=http://localhost:3000 k6 run tests/load/k6-scenarios.js
```

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
- Tests use Testcontainers (works in Docker environments)
- No external dependencies required
- Fast execution for quick feedback
- Coverage reports generated

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Realistic Data**: Use realistic test data
4. **Assertions**: Make assertions specific and meaningful
5. **Error Cases**: Test both success and error paths
6. **Security**: Always test security boundaries

## Troubleshooting

### Tests fail with "Cannot connect to database"
- Ensure Docker is running
- Check Testcontainers can pull PostgreSQL image
- Verify port 5432 is not in use

### Tests timeout
- Increase timeout in `jest.config.ts`
- Check database connection pool settings
- Verify Testcontainers is working

### Coverage too low
- Add tests for untested code paths
- Review coverage report: `npm run test:cov`
- Focus on critical business logic

## Notes

- Tests use a separate test database (isolated from dev/prod)
- All sensitive data is mocked or uses test values
- PHI is never logged or exposed in test outputs
- Tests are designed to be deterministic and repeatable

