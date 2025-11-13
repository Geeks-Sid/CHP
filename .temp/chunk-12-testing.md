# Chunk 12: Testing Infrastructure

## Tasks: 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 112, 113

### Phase 12.1: Test Harness Setup (Task 77)
- [ ] Jest setup with ts-jest
- [ ] fast-check (optional) for property tests
- [ ] Testcontainers for integration tests

### Phase 12.2: Unit Tests
- [ ] Auth services (hashing, JWT) - Task 78
- [ ] Guards/decorators (permission matrix) - Task 79
- [ ] Repos (mock pool + test DB) - Task 80

### Phase 12.3: Integration Tests
- [ ] Auth flow (login→access, refresh, logout) - Task 81
- [ ] Users admin (CRUD, RBAC) - Task 82
- [ ] Person (create, search, update, MRN uniqueness) - Task 83
- [ ] Visits (create, list, no overlaps) - Task 84
- [ ] Procedures (create/list, invalid codes) - Task 85
- [ ] Drug exposures (create/list, date range) - Task 86
- [ ] Documents (presign→upload→confirm→get) - Task 87
- [ ] Terminology (text search, code lookup, cache) - Task 88
- [ ] FHIR Patient/Encounter (R4 schema validation) - Task 89

### Phase 12.4: Contract Tests (Task 90)
- [ ] Every endpoint round-trips vs OpenAPI
- [ ] Status codes & bodies validation

### Phase 12.5: Load Tests (Task 91)
- [ ] k6 scenarios: auth, patient create, visit create, concepts lookup
- [ ] SLO baselines

### Phase 12.6: Security Tests (Tasks 92, 93, 94)
- [ ] Weak password rejection - Task 92
- [ ] JWT tampering - Task 92
- [ ] IDOR attempts - Task 92
- [ ] Rate limit triggers - Task 92
- [ ] SQL injection tests - Task 93
- [ ] PHI redaction test - Task 94

### Phase 12.7: Snapshot & CDC Tests (Tasks 112, 113)
- [ ] Snapshot tests for OpenAPI - Task 112
- [ ] CDC tests for migrations - Task 113

## Files to Create:
```
backend/
├── tests/
│   ├── setup.ts
│   ├── helpers.ts
│   ├── unit/
│   │   ├── auth/
│   │   ├── guards/
│   │   └── repos/
│   ├── integration/
│   │   ├── auth.int.test.ts
│   │   ├── users.int.test.ts
│   │   ├── patients.int.test.ts
│   │   ├── visits.int.test.ts
│   │   ├── procedures.int.test.ts
│   │   ├── medications.int.test.ts
│   │   ├── documents.int.test.ts
│   │   ├── terminology.int.test.ts
│   │   └── fhir.int.test.ts
│   ├── contract/
│   │   └── openapi.contract.test.ts
│   ├── security/
│   │   ├── password-policy.test.ts
│   │   ├── jwt-tampering.test.ts
│   │   ├── sql-injection.test.ts
│   │   └── phi-redaction.test.ts
│   └── load/
│       └── k6-scenarios.js
├── jest.config.ts
└── jest-e2e.config.ts
```

## Dependencies:
- jest, ts-jest
- @nestjs/testing
- testcontainers
- supertest
- k6 (for load testing)
- fast-check (optional)

