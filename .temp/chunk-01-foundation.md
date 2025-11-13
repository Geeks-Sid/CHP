# Chunk 01: Foundation & Infrastructure Setup

## Tasks: 2, 3, 4, 5, 19, 20, 21, 22, 23, 24, 64, 65, 99, 100, 110

### Phase 1.1: Repository Bootstrap (Task 2)
- [ ] Create monorepo folder structure
- [ ] Setup TypeScript with strict mode
- [ ] Configure ESLint and Prettier
- [ ] Setup commit hooks (husky)
- [ ] Create package.json with dependencies

### Phase 1.2: Database Migrations (Tasks 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18)
- [ ] Create `database/migrations` folder
- [ ] V000: Extensions and baseline (pgcrypto, uuid-ossp, pg_trgm, trigger function)
- [ ] V001: Roles and permissions tables
- [ ] V002: Users and user_roles tables + refresh_tokens
- [ ] V003: Audit log table and function
- [ ] V004: Person table (OMOP-light)
- [ ] V005: Visit_occurrence table
- [ ] V006: Procedure_occurrence table
- [ ] V007: Drug_exposure table
- [ ] V008: Document table
- [ ] V009: Vocabulary tables (concept, concept_relationship, concept_ancestor, vocabulary)
- [ ] V010: Sequences for MRN and Visit numbers
- [ ] V011: Seed roles and permissions
- [ ] V012: Seed admin user

### Phase 1.3: NestJS App Scaffold (Task 3)
- [ ] Create NestJS app with Fastify adapter
- [ ] Setup main.ts with global pipes/filters
- [ ] Configure CORS
- [ ] Setup Helmet for security headers
- [ ] Configure rate limiting

### Phase 1.4: Configuration Module (Task 4)
- [ ] Create config module with zod/joi validation
- [ ] Environment variables for DB, Redis, JWT, S3
- [ ] Type-safe config exports

### Phase 1.5: Database Connection (Task 19)
- [ ] PostgreSQL pool wrapper (pg or slonik)
- [ ] Connection timeouts and retries
- [ ] Health check queries
- [ ] Transaction helper (`withTx`)

### Phase 1.6: Error Handling (Task 20)
- [ ] Error mapper: SQLSTATE → HTTP errors
- [ ] Consistent error response shape
- [ ] Global exception filter (Task 65)

### Phase 1.7: Request ID Middleware (Task 21)
- [ ] Inject request ID
- [ ] Propagate in logs

### Phase 1.8: Logging (Task 22)
- [ ] Pino structured logging
- [ ] PHI redaction
- [ ] Request ID, user ID, route, status in logs

### Phase 1.9: Metrics & Tracing (Tasks 23, 24)
- [ ] Prometheus metrics endpoint `/metrics`
- [ ] OpenTelemetry basic tracing

### Phase 1.10: Health Endpoints (Task 64)
- [ ] `/health` (liveness)
- [ ] `/ready` (DB ping + migration version)

### Phase 1.11: Response Wrapper (Task 99)
- [ ] Standard success envelope
- [ ] Error schema adherence

### Phase 1.12: Header Contracts (Task 100)
- [ ] Enforce `X-Request-ID`
- [ ] Optional `X-Client-Version`

### Phase 1.13: Docker Compose (Task 110)
- [ ] Postgres, Redis, MinIO setup
- [ ] Make targets for migrations and seeds

## Files to Create:
```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── configuration.module.ts
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   └── middleware/
│   │       └── request-id.middleware.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── pool.service.ts
│   │   └── health.service.ts
│   └── utils/
│       └── error-mapper.util.ts
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
└── nest-cli.json

database/
├── migrations/
│   ├── V000__extensions_and_baseline.sql
│   ├── V001__roles_permissions.sql
│   ├── V002__users.sql
│   ├── V003__audit_log.sql
│   ├── V004__person.sql
│   ├── V005__visit_occurrence.sql
│   ├── V006__procedure_occurrence.sql
│   ├── V007__drug_exposure.sql
│   ├── V008__document.sql
│   ├── V009__vocabulary_core.sql
│   ├── V010__identifiers_and_locks.sql
│   ├── V011__seed_roles_permissions.sql
│   └── V012__seed_admin_user.sql
└── docker-compose.yml
```

## Dependencies:
- @nestjs/core, @nestjs/common, @nestjs/platform-fastify
- @nestjs/config
- pg or @slonik/slonik
- zod or joi
- pino, pino-http
- prom-client
- @opentelemetry/api
- helmet, @nestjs/throttler

