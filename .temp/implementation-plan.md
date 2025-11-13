# Implementation Plan - Hospital Management System Backend

## Overview
This document outlines the phased implementation plan for the backend system based on the 120 tasks defined in `ready-to-start.md`.

## Architecture Stack
- **Framework**: NestJS with Fastify adapter
- **Database**: PostgreSQL (raw SQL via pg/slonik, no Prisma)
- **Migrations**: Flyway/Liquibase style SQL files
- **Auth**: JWT (access + refresh tokens)
- **RBAC**: Roles → Permissions tables
- **Testing**: Jest + Testcontainers
- **Documentation**: OpenAPI/Swagger

## Implementation Phases

### Phase 1: Foundation & Infrastructure (Chunk 01)
**Priority**: CRITICAL - Must be done first
**Estimated Time**: 2-3 weeks
**Dependencies**: None

**Key Deliverables**:
- Repository structure and tooling
- All database migrations (V000-V012)
- NestJS app scaffold
- Configuration module
- Database connection pool
- Error handling
- Logging infrastructure
- Health endpoints

**Files**: See `chunk-01-foundation.md`

---

### Phase 2: Authentication & Authorization (Chunk 02)
**Priority**: CRITICAL - Required for all protected endpoints
**Estimated Time**: 1-2 weeks
**Dependencies**: Phase 1 (DB migrations, config)

**Key Deliverables**:
- Password hashing service
- JWT service (access + refresh)
- Auth controllers (login, refresh, logout)
- Auth guards
- Permissions guard with decorator
- Security features (CSRF, rate limiting, password policy)

**Files**: See `chunk-02-authentication.md`

---

### Phase 3: Users Management (Chunk 03)
**Priority**: HIGH - Core admin functionality
**Estimated Time**: 1 week
**Dependencies**: Phase 2 (Auth guards)

**Key Deliverables**:
- Users repository
- Users service
- Users controller (CRUD)
- DTO validation
- Permissions seeding script

**Files**: See `chunk-03-users.md`

---

### Phase 4: Patients Management (Chunk 04)
**Priority**: HIGH - Core clinical functionality
**Estimated Time**: 1 week
**Dependencies**: Phase 2 (Auth), Phase 1 (DB)

**Key Deliverables**:
- Person repository
- MRN generation with advisory locks
- Patients controller (CRUD + search)

**Files**: See `chunk-04-patients.md`

---

### Phase 5: Visits Management (Chunk 05)
**Priority**: HIGH - Core clinical functionality
**Estimated Time**: 1 week
**Dependencies**: Phase 4 (Patients)

**Key Deliverables**:
- Visit repository
- Visit service (overlap prevention)
- Visit controller (CRUD + filters)

**Files**: See `chunk-05-visits.md`

---

### Phase 6: Procedures & Medications (Chunk 06)
**Priority**: MEDIUM - Clinical data entry
**Estimated Time**: 1-2 weeks
**Dependencies**: Phase 4 (Patients), Phase 5 (Visits)

**Key Deliverables**:
- Procedures repository & controller
- Medications repository & controller
- Concept validation

**Files**: See `chunk-06-procedures-medications.md`

---

### Phase 7: Documents Management (Chunk 07)
**Priority**: MEDIUM - File upload functionality
**Estimated Time**: 1 week
**Dependencies**: Phase 2 (Auth), Phase 4 (Patients)

**Key Deliverables**:
- S3/MinIO client service
- Presigned URL generation
- Document confirmation
- Document listing with permissions

**Files**: See `chunk-07-documents.md`

---

### Phase 8: Terminology Service (Chunk 08)
**Priority**: MEDIUM - Supports clinical coding
**Estimated Time**: 1-2 weeks
**Dependencies**: Phase 1 (DB vocab tables)

**Key Deliverables**:
- Terminology repository
- Concept search endpoints
- Batch concept lookup
- External adapter (optional)
- Vocabulary import job

**Files**: See `chunk-08-terminology.md`

---

### Phase 9: FHIR & Reports (Chunk 09)
**Priority**: MEDIUM - Interoperability & analytics
**Estimated Time**: 2 weeks
**Dependencies**: Phase 4, 5, 6 (Clinical data)

**Key Deliverables**:
- FHIR mappers (OMOP → FHIR R4)
- FHIR read endpoints
- Reporting repository
- Reports controller

**Files**: See `chunk-09-fhir-reports.md`

---

### Phase 10: Security Hardening (Chunk 10)
**Priority**: HIGH - Production readiness
**Estimated Time**: 1-2 weeks
**Dependencies**: All previous phases

**Key Deliverables**:
- Input validation hardening
- PHI redaction
- Security headers
- Audit interceptor
- Secrets management

**Files**: See `chunk-10-security-hardening.md`

---

### Phase 11: Telemetry & Observability (Chunk 11)
**Priority**: MEDIUM - Production monitoring
**Estimated Time**: 1 week
**Dependencies**: Phase 1 (Logging)

**Key Deliverables**:
- Request/DB correlation
- Feature flags

**Files**: See `chunk-11-telemetry.md`

---

### Phase 12: Testing Infrastructure (Chunk 12)
**Priority**: HIGH - Quality assurance
**Estimated Time**: 3-4 weeks (parallel with development)
**Dependencies**: All feature phases

**Key Deliverables**:
- Test harness setup
- Unit tests
- Integration tests
- Contract tests
- Load tests
- Security tests

**Files**: See `chunk-12-testing.md`

---

### Phase 13: CI/CD & DevOps (Chunk 13)
**Priority**: HIGH - Deployment readiness
**Estimated Time**: 2 weeks
**Dependencies**: Phase 12 (Tests)

**Key Deliverables**:
- OpenAPI/Swagger docs
- CI pipeline
- Security scanning
- Deploy pipeline
- Documentation

**Files**: See `chunk-13-cicd.md`

---

### Phase 14: Database Optimization (Chunk 14)
**Priority**: MEDIUM - Performance tuning
**Estimated Time**: 1 week
**Dependencies**: All phases (for query analysis)

**Key Deliverables**:
- Index optimization
- Constraint review
- Pagination helpers
- Sample data scripts

**Files**: See `chunk-14-database-optimization.md`

---

## Recommended Execution Order

### Sprint 1-2: Foundation (Phases 1-2)
- Setup infrastructure
- Database migrations
- Authentication system

### Sprint 3-4: Core Features (Phases 3-5)
- Users management
- Patients management
- Visits management

### Sprint 5-6: Clinical Features (Phases 6-7)
- Procedures & Medications
- Documents

### Sprint 7-8: Advanced Features (Phases 8-9)
- Terminology
- FHIR & Reports

### Sprint 9-10: Production Readiness (Phases 10-11, 14)
- Security hardening
- Telemetry
- Database optimization

### Sprint 11-12: Quality & Deployment (Phases 12-13)
- Comprehensive testing
- CI/CD setup
- Documentation

## Parallel Work Streams

1. **Backend Development**: Phases 1-11, 14
2. **Testing**: Phase 12 (can start after Phase 2)
3. **DevOps**: Phase 13 (can start after Phase 1)

## Critical Path

1. Phase 1 (Foundation) → Blocks everything
2. Phase 2 (Auth) → Blocks protected endpoints
3. Phase 4 (Patients) → Blocks clinical features
4. Phase 12 (Testing) → Blocks production deployment

## Risk Mitigation

- **Database Schema Changes**: All migrations in Phase 1, review before proceeding
- **Auth Security**: Security review after Phase 2
- **Performance**: Load testing in Phase 12, optimization in Phase 14
- **Integration**: Contract tests in Phase 12 catch API drift

## Success Criteria

- All 120 tasks completed
- ≥80% test coverage
- Zero P1 security issues
- All SLOs met
- OpenAPI docs complete
- Production deployment successful

