
awesome — here’s a super-granular, serial backlog you can spread across teams. It’s backend-only (Node.js + NestJS), PostgreSQL-first (raw SQL via pg/slonik; **no Prisma**), and test-heavy. After the backlog you’ll find concise API input/output docs so implementers know exactly what args and shapes to use.

---

# Scope & assumptions (quick)

* Stack: **NestJS (Fastify)**, **pg/slonik** for DB access, **Flyway/Liquibase** for SQL migrations, **JWT** auth, **RBAC** via roles→permissions tables, **OpenAPI/Swagger** docs.
* Data: OMOP-on-FHIR alignment for `person`, `visit_occurrence`, `procedure_occurrence`, `drug_exposure`, vocab tables (`concept`, etc.).
* Testing: Jest (unit/integration), supertest (API), contract tests vs OpenAPI, Playwright/Cypress optional for E2E.
* Security: HIPAA-grade logging/audit, PHI redaction, rate limiting, TLS (env/ingress).
* Versioning: `/api/v1/*` and `/fhir/R4/*`.

---

# Serial task backlog (assignable across teams)

> Legend: [PM]=Program Mgmt, [Platform], [DB], [Auth], [Users], [People], [Visits], [Procedures], [Meds], [Docs]=Documents, [Term]=Terminology, [FHIR], [Msg]=Messaging, [Reports], [Telemetry], [Sec], [QA], [DevEx], [CI/CD].

1. [PM] Establish RAID log & dependency map — write cross-module dependencies and risks; publish as living doc.
2. [DevEx] Repo bootstrap — monorepo folders, lint/format configs, commit hooks; enable TypeScript strict mode.
3. [Platform] NestJS app scaffold — `main.ts` with Fastify, global pipes/filters, CORS, Helmet, rate limiting.
4. [Platform] Configuration module — typed env validation (zod/joi) for DB/Redis/JWT/S3/config flags.
5. [DB] Pick migration tool (Flyway/Liquibase) — pin version, create `infra/migrations` with baseline.
6. [DB] Create `roles`, `permissions`, `role_permissions` tables — unique constraints, FK cascades.
7. [DB] Create `users`, `user_roles` tables — UUID PK, timestamp trigger, email uniqueness.
8. [DB] Create `audit_log` table — fields: id, user_id, action, resource, resource_id, ip, ua, details JSONB, ts.
9. [DB] Create `person` (OMOP-light) table — required demographics, FK optional link to `users`.
10. [DB] Create `visit_occurrence` table — start/end, type, provider/care_site nullable, indexes on person/date.
11. [DB] Create `procedure_occurrence` table — date/type/visit link, indexes.
12. [DB] Create `drug_exposure` table — start/end/type/visit link, quantity, indexes.
13. [DB] Create `document` table — owner_user_id, patient_person_id, paths, size, soft delete.
14. [DB] Create vocab tables `concept`, `concept_relationship`, `concept_ancestor`, `vocabulary` — keys & indexes.
15. [DB] Seed `roles`, `permissions`, `role_permissions` — Admin/Doctor/Nurse/Receptionist/Pharmacist/Patient.
16. [DB] Seed an initial admin user with strong bcrypt/argon hash — rotate after first login procedure.
17. [DB] Add advisory-lock function(s) for MRN/Visit number generation — prevent race conditions.
18. [DB] Write DB function for audit insertion — `log_audit(p_user, p_action, p_res, p_id, p_details)`.
19. [Platform] PostgreSQL pool wrapper — pg or slonik pool, timeouts, retries, cancelation, healthchecks.
20. [Platform] Error mapper — map SQLSTATE errors → HTTP errors with consistent shape.
21. [Platform] Request ID middleware — inject `req.id` and propagate in logs.
22. [Telemetry] Pino (or pino-http) structured logs — redact PHI fields, include request_id, user_id, route, status.
23. [Telemetry] Prometheus metrics endpoint `/metrics` — request latency, DB pool usage, queue sizes.
24. [Telemetry] OpenTelemetry basic tracing — Fastify, Nest handlers, DB spans.
25. [Auth] Password hashing service — bcrypt/argon2 with per-user salt and cost controls.
26. [Auth] JWT service — access (15m) + refresh (7d), RSA or HS256; key rotation support.
27. [Auth] Refresh token store — hashed tokens table: id, user_id, hash, device meta, issued_at, revoked_at.
28. [Auth] Login controller — `/api/v1/auth/login`; set HttpOnly cookie (optional) + return JSON.
29. [Auth] Refresh controller — `/api/v1/auth/refresh`; rotate token, revoke old, issue new.
30. [Auth] Logout controller — revoke refresh token(s) per device or all sessions.
31. [Auth] Auth guard — verify JWT, attach `req.user`.
32. [Auth] Permissions guard — decorator `@Permissions(...)` + DB/cached check.
33. [Sec] CSRF strategy (if using cookies) — same-site strict + CSRF token for write ops (configurable).
34. [Sec] Rate limiting policies — higher sensitivity on auth routes, IP/user scopes via Redis.
35. [Users] Users repo — CRUD with transactions; unique checks; soft delete strategy (if needed).
36. [Users] Users controller — admin endpoints list/create/update/delete users with pagination & filters.
37. [Users] Users service — enforce role/permission checks and email uniqueness rules.
38. [Users] DTO validation — `create`/`update` DTOs with class-validator; strong constraints.
39. [People] Person repo — insert/update person, by person_id; link optional user.
40. [People] Person controller — `/api/v1/patients` create/read/update; search by name/DOB/phone/email.
41. [People] Person service — MRN generation using advisory lock & deterministic format.
42. [Visits] Visit repo — create visit (atomic) with generated visit_number.
43. [Visits] Visit controller — create/read/list with cursor pagination; filters: date range, provider, type.
44. [Visits] Visit service — prevent overlapping inpatient visits; compute derived fields.
45. [Procedures] Procedure repo — CRUD; link to person & visit.
46. [Procedures] Procedures controller — create/read/list; validation for code/type concepts.
47. [Meds] Drug exposure repo — CRUD with nullable quantity; stop_reason handling.
48. [Meds] Medications controller — create/read/list; supports patient and visit filters.
49. [Docs] S3/MinIO client service — presigned PUT URLs, server-side encryption flags.
50. [Docs] Documents controller (presign) — `/documents/presign` → url, fields, `upload_id`, expiry.
51. [Docs] Documents controller (confirm) — `/documents/confirm` → persist metadata, tie to patient/user.
52. [Docs] Documents controller (get/list) — secure read with permission checks, soft delete.
53. [Term] Terminology repo — concept lookup by code/system, text search (trgm or full-text), caching.
54. [Term] Terminology controller — search endpoints; batch concepts by IDs/codes.
55. [Term] External terminology adapter interface — optional Ontoserver/Snowstorm HTTP client.
56. [Term] Vocabulary import job — COPY CSVs into vocab tables; analyze; index maintenance.
57. [FHIR] FHIR mapper utilities — OMOP rows → FHIR R4 JSON for Patient, Encounter, Procedure, Medication.
58. [FHIR] FHIR controllers (read) — `/fhir/R4/Patient/:id`, `/Encounter/:id` etc., content-type `application/fhir+json`.
59. [FHIR] FHIR search (narrow) — `/fhir/R4/Patient?identifier=…|…` minimal parameters for parity.
60. [Reports] Reporting repo — read-only queries (e.g., active inpatients, daily counts); optional read replica.
61. [Reports] Reports controller — `/api/v1/reports/*` with strict permissions & time-window bounds.
62. [Msg] Messaging tables — minimal internal messages (if in scope now) with PHI constraints.
63. [Msg] Messaging endpoints — create/list threads with strict role checks (optional; can defer).
64. [Platform] Health endpoints — `/health` (liveness), `/ready` (DB ping), include migration version.
65. [Platform] Global exception filter — normalize error shape per spec; hide internal messages.
66. [Sec] Input validation hardening — payload size limits, JSON parser limits, disallow prototype pollution.
67. [Sec] Output filtering — ensure no secrets/PII leak in errors; redaction middleware for logs.
68. [Sec] Security headers — HSTS, noSniff, XSS, referrer; CSP template (frontend comes later).
69. [Telemetry] Audit interceptor — capture read/write events and store in `audit_log` via async queue.
70. [Telemetry] Log sampling policy — sample high-volume read logs; keep full logs for writes/errors.
71. [DevEx] OpenAPI/Swagger generation — decorate controllers; expose `/docs` (auth-protected in non-dev).
72. [DevEx] OpenAPI CI check — fail build if controllers & spec drift (openapi-diff or spectral).
73. [CI/CD] Backend CI pipeline — install, lint, type-check, unit tests, integration tests (DB service), Docker build.
74. [CI/CD] Security scanning — `npm audit`, snyk; block on critical vulns; SARIF upload.
75. [CI/CD] Migrations in CI — run Flyway/Liquibase migrate against ephemeral DB; post version.
76. [CI/CD] Deploy pipeline — image push, Helm/k8s rollout, health gates, auto-rollback.
77. [QA] Unit test harness — Jest setup with ts-jest, fast-check (optional) for property tests.
78. [QA] Unit tests: auth services — hashing, JWT issue/verify/expiry/rotation.
79. [QA] Unit tests: guards/decorators — permission matrix decisions, edge cases.
80. [QA] Unit tests: repos — mock pool + run against test DB for SQL shape and result mapping.
81. [QA] Integration: auth flow — login→access, refresh rotation, logout; cookie & bearer modes.
82. [QA] Integration: users admin — create/update/delete/list; RBAC checks and 403s.
83. [QA] Integration: person — create with constraints, search, update; MRN uniqueness under load.
84. [QA] Integration: visits — create (in/out-patient), list filters, no overlaps, visit_number format.
85. [QA] Integration: procedures — create/list; invalid concept codes → 400.
86. [QA] Integration: drug exposures — create/list; date range & quantity rules.
87. [QA] Integration: documents — presign→upload (mock S3)→confirm→get/list; soft delete.
88. [QA] Integration: terminology — text search, code/system lookup, cache hits.
89. [QA] Integration: FHIR Patient/Encounter — response validates against R4 schemas.
90. [QA] Contract tests — every endpoint round-trips vs generated OpenAPI (status codes & bodies).
91. [QA] Load tests — k6 scenarios: auth, patient create, visit create, concepts lookup; SLO baselines.
92. [QA] Security tests — weak password rejection, JWT tampering, IDOR attempts, rate limit triggers.
93. [QA] SQL injection tests — ensure parameterization everywhere; union/drop attempts rejected.
94. [QA] PHI redaction test — logs inspected to ensure no PHI leakage on errors.
95. [DB] Index review — EXPLAIN on top 10 queries; add composite indexes; fillfactor tuning where needed.
96. [DB] Constraints & FKs review — cascade policies, ON DELETE behavior, deferred constraints if needed.
97. [DB] Timezone policy — store timestamps as `timestamptz`; convert at edge; verify in tests.
98. [DB] Pagination helpers — cursor encoding/decoding (opaque), default page size, hard max.
99. [Platform] Standard response wrapper — success envelope vs raw; adhere to error schema below.
100. [Platform] Header contracts — enforce `X-Request-ID`, optional `X-Client-Version`.
101. [Auth] Device metadata capture — IP/UA/fingerprint on refresh tokens; revoke per device.
102. [Sec] Password policy — min length, complexity, breach check (HIBP offline list optional).
103. [Sec] Account lockout/backoff — exponential lock after N failures; audit entries.
104. [Sec] Permissions seeding script — idempotent seeding JSON→SQL; used in CI and prod.
105. [Term] Background cache warmer — preload hot vocab concepts into Redis.
106. [Reports] Daily job templates — example scheduled report query with crontab (BullMQ optional later).
107. [Telemetry] Request/DB correlation — propagate trace id to SQL comment (pg_stat_activity visibility).
108. [Platform] Feature flags — .env toggles for FHIR write, external terminology adapter, etc.
109. [Platform] Multi-tenant hooks (if future) — tenant_id column stubs guarded behind flag.
110. [DevEx] Local `docker-compose` — Postgres, Redis, MinIO; make targets to run seeds & migrations.
111. [DevEx] Sample data scripts — generate ~100 persons/visits for dev & demo.
112. [QA] Snapshot tests for OpenAPI — keep spec diffs visible in PRs.
113. [QA] CDC tests for migrations — migrate up/down on sample DB; verify data safety.
114. [CI/CD] SBOM generation — `npm sbom`/`syft` attach to image; artifact retention.
115. [Sec] Secrets handling — pull runtime secrets from Vault/SM; never log secrets; rotate keys.
116. [Sec] Access reviews — DB roles least-privilege; separate app vs admin role; audit quarterly.
117. [Platform] Readiness gates — do not report ready before DB migrated + seed complete.
118. [PM] Cutover plan doc — staged routing, rollback checklist, success metrics.
119. [PM] Runbook — oncall SOP: common failures, dashboards, queries, playbooks.
120. [All] Final acceptance review — pass SLOs, tests ≥80% coverage, zero P1 security issues.

> **Definition of Done (applies to every task):** code + tests + docs + lint/type-check clean; logs/metrics added if applicable; access control verified; failure modes documented.

---

# API contracts (v1) — inputs & outputs

## Conventions

* Auth: `Authorization: Bearer <access_jwt>` (cookies optional in web contexts).
* Pagination: `limit` (int ≤ 100), `cursor` (opaque base64), `sort`, `order` (`asc|desc`).
* Content-Type: `application/json` (FHIR uses `application/fhir+json`).
* Errors (standard shape):

```json
{ "statusCode": 400, "error": "Bad Request", "message": "Validation failed", "details": {"field":"reason"} }
```

---

## Auth

### POST `/api/v1/auth/login`

* **Body**: `{ "username": "string", "password": "string" }`
* **200**: `{ "accessToken": "jwt", "refreshToken": "string", "user": { "user_id": "uuid", "username": "string", "email":"", "roles":["Admin"] } }`
* **401** invalid creds; **423** locked.

### POST `/api/v1/auth/refresh`

* **Body**: `{ "refreshToken": "string" }`
* **200**: `{ "accessToken": "jwt", "refreshToken": "string" }`
* **401** expired/revoked.

### POST `/api/v1/auth/logout`

* **Body**: `{ "allDevices": false }`
* **204**: no content.

---

## Users (Admin)

### GET `/api/v1/users`

* **Query**: `limit,cursor,role,active,search`
* **200**: `{ "items":[{ "user_id":"uuid","username":"","email":"","roles":[""] }], "nextCursor":"..." }`

### POST `/api/v1/users`

* **Body**: `{ "username":"", "email":"", "password":"", "roles":["Admin"] }`
* **201**: `{ "user_id":"uuid","username":"","email":"","roles":["Admin"] }`
* **409** duplicate email/username.

### GET `/api/v1/users/:id`

* **200**: user object.

### PATCH `/api/v1/users/:id`

* **Body**: any of `{ "email","password","roles","active" }`
* **200**: updated user.

### DELETE `/api/v1/users/:id`

* **204**.

---

## Patients (Person)

### POST `/api/v1/patients`

* **Body**:

```json
{
  "first_name":"string","last_name":"string",
  "dob":"YYYY-MM-DD","gender_concept_id":8507,
  "race_concept_id":null,"ethnicity_concept_id":null,
  "contact":{"phone":"string","email":"string"}
}
```

* **201**: `{ "person_id":123,"mrn":"MRN-2025-000123","created_at":"ISO8601" }`

### GET `/api/v1/patients/:person_id`

* **200**: patient demographics + MRN.

### GET `/api/v1/patients`

* **Query**: `limit,cursor,search,dob,gender_concept_id`
* **200**: list with pagination.

### PATCH `/api/v1/patients/:person_id`

* **Body**: partial update; server maintains audit trail.
* **200**: updated person.

---

## Visits

### POST `/api/v1/visits`

* **Body**:

```json
{
  "person_id":123,
  "visit_type":"OPD|IPD|ER",
  "visit_start":"ISO",
  "visit_end":"ISO|null",
  "department_id":5,
  "provider_id":"uuid",
  "reason":"string"
}
```

* **201**: `{ "visit_occurrence_id":987, "visit_number":"V-2025-000987", "created_at":"ISO" }`

### GET `/api/v1/visits/:id`

* **200**: visit details.

### GET `/api/v1/visits`

* **Query**: `person_id,provider_id,type,date_from,date_to,limit,cursor`
* **200**: list.

---

## Procedures

### POST `/api/v1/procedures`

* **Body**:

```json
{
  "person_id":123,
  "procedure_concept_id":123456,
  "procedure_date":"ISO",
  "procedure_type_concept_id":4478661,
  "visit_occurrence_id":987
}
```

* **201**: `{ "procedure_occurrence_id":456 }`

### GET `/api/v1/procedures`

* **Query**: `person_id,visit_occurrence_id,date_from,date_to,limit,cursor`
* **200**: list.

---

## Medications (Drug Exposure)

### POST `/api/v1/medications`

* **Body**:

```json
{
  "person_id":123,
  "drug_concept_id":19122137,
  "drug_exposure_start_date":"ISO",
  "drug_exposure_end_date":"ISO|null",
  "drug_type_concept_id":38000177,
  "quantity": 14,
  "visit_occurrence_id":987,
  "instructions":"string"
}
```

* **201**: `{ "drug_exposure_id":321 }`

### GET `/api/v1/medications`

* **Query**: `person_id,visit_occurrence_id,date_from,date_to,limit,cursor`
* **200**: list.

---

## Documents

### POST `/api/v1/documents/presign`

* **Body**: `{ "file_name":"report.pdf","content_type":"application/pdf","size_bytes":12345,"patient_person_id":123 }`
* **200**:

```json
{ "upload_id":"uuid","url":"https://...","fields":{"key":"..."},"expires_at":"ISO" }
```

### POST `/api/v1/documents/confirm`

* **Body**: `{ "upload_id":"uuid","file_path":"s3://bucket/key","checksum":"sha256" }`
* **201**: `{ "document_id":"uuid","patient_person_id":123,"file_type":"application/pdf","size_bytes":12345 }`

### GET `/api/v1/documents/:document_id`

* **200**: metadata (+ signed GET URL if allowed).

### GET `/api/v1/documents`

* **Query**: `patient_person_id,owner_user_id,limit,cursor`
* **200**: list.

---

## Terminology

### GET `/api/v1/terminology/concepts`

* **Query**: `q` (text), `code`, `system` (`SNOMED|ICD10|RXNORM|LOINC`), `vocabulary_id`, `limit,cursor`
* **200**:

```json
{ "items":[{"concept_id":123,"concept_name":"", "vocabulary_id":"SNOMED", "concept_code":"123456"}], "nextCursor":"..." }
```

### POST `/api/v1/terminology/concepts/batch`

* **Body**: `{ "concept_ids":[1,2,3] }`
* **200**: concepts by IDs.

---

## FHIR (R4)

### GET `/fhir/R4/Patient/:id`

* **200**: FHIR Patient JSON (R4).
* **404**: if person not found.

### GET `/fhir/R4/Encounter/:id`

* **200**: FHIR Encounter JSON (R4).

> **Headers:** `Accept: application/fhir+json`.
> **Notes:** Only read endpoints in phase 1; write endpoints are feature-flagged/off by default.

---

# Field notes & arguments (to avoid doubts)

* **IDs**: `user_id` is UUID; `person_id/visit_occurrence_id/...` are integers (serial). `document_id` UUID.
* **Dates**: Send/return **ISO 8601** (`YYYY-MM-DDTHH:mm:ssZ`); server stores UTC (`timestamptz`).
* **Pagination**: If `cursor` omitted, start from newest created; return `nextCursor` or omit if end.
* **Search**: For patients, `search` matches name/email/phone with case-insensitive partials; use indexes.
* **RBAC**: Use permission strings (e.g., `patient.create`, `visit.read`). Controllers must decorate with `@Permissions(...)`.
* **Auditing**: Every read/write adds an audit row with `action` (`READ|CREATE|UPDATE|DELETE`), resource, id, success/failure.
* **Documents**: Upload is two-step (presign→client PUT→confirm). We never proxy file bytes through the API.
* **Terminology**: Prefer local vocab tables; adapter can be toggled per env.

# Backend SQL & Next.js API Scaffolds (Postgres + pg/slonik)

This canvas contains:

* **Flyway/Liquibase-style SQL migrations** (PostgreSQL-first, no Prisma) for core schema, seeds, audit, and identifiers.
* A **Next.js (App Router) backend scaffold** using **raw `pg` / slonik** with modular repos/services.
* **API route handlers** for key endpoints (Auth, Patients, Visits, Documents, Terminology, FHIR-read) aligned to the earlier contracts.
* **Tests** via Jest + Testcontainers examples.

> All code favors: direct SQL, typed DTOs, strict validation, auditable operations, and clear separation of concerns.

---

## 1) SQL Migrations (Flyway-style `infra/migrations`)

> File ordering assumes Flyway naming `V###__description.sql`. Adjust if you use Liquibase XML/YAML.

### `V000__extensions_and_baseline.sql`

```sql
-- Enable useful extensions once per DB
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- text search accel

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### `V001__roles_permissions.sql`

```sql
CREATE TABLE IF NOT EXISTS roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  permission_id SERIAL PRIMARY KEY,
  permission_name VARCHAR(150) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

### `V002__users.sql`

```sql
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TRIGGER users_set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Refresh tokens (hashed) for rotation and device management
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip INET,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
```

### `V003__audit_log.sql`

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  audit_id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  action VARCHAR(20) NOT NULL,   -- READ|CREATE|UPDATE|DELETE|AUTH
  resource_type VARCHAR(50) NOT NULL,
  resource_id TEXT,
  ip INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION log_audit(
  p_user UUID, p_action TEXT, p_res_type TEXT, p_res_id TEXT, p_ip INET, p_ua TEXT, p_details JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_log(user_id, action, resource_type, resource_id, ip, user_agent, details)
  VALUES (p_user, p_action, p_res_type, p_res_id, p_ip, p_ua, p_details);
END;$$ LANGUAGE plpgsql;
```

### `V004__person.sql`

```sql
CREATE TABLE IF NOT EXISTS person (
  person_id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  gender_concept_id INT NOT NULL,
  year_of_birth INT NOT NULL,
  month_of_birth INT,
  day_of_birth INT,
  birth_datetime TIMESTAMPTZ,
  race_concept_id INT,
  ethnicity_concept_id INT,
  person_source_value VARCHAR(100),
  mrn VARCHAR(40) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_person_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_person_user_id ON person(user_id);
CREATE INDEX IF NOT EXISTS idx_person_name ON person USING GIN ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE TRIGGER person_set_timestamp
BEFORE UPDATE ON person
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
```

### `V005__visit_occurrence.sql`

```sql
CREATE TABLE IF NOT EXISTS visit_occurrence (
  visit_occurrence_id SERIAL PRIMARY KEY,
  person_id INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  visit_concept_id INT NOT NULL,
  visit_start TIMESTAMPTZ NOT NULL,
  visit_end TIMESTAMPTZ,
  visit_type VARCHAR(10) NOT NULL,   -- OPD|IPD|ER
  department_id INT,
  provider_id UUID,
  reason TEXT,
  visit_number VARCHAR(40) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_person ON visit_occurrence(person_id);
CREATE INDEX IF NOT EXISTS idx_visit_dates ON visit_occurrence(visit_start, visit_end);

CREATE TRIGGER visit_set_timestamp
BEFORE UPDATE ON visit_occurrence
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
```

### `V006__procedure_occurrence.sql`

```sql
CREATE TABLE IF NOT EXISTS procedure_occurrence (
  procedure_occurrence_id SERIAL PRIMARY KEY,
  person_id INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  procedure_concept_id INT NOT NULL,
  procedure_date TIMESTAMPTZ NOT NULL,
  procedure_type_concept_id INT NOT NULL,
  visit_occurrence_id INT REFERENCES visit_occurrence(visit_occurrence_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proc_person ON procedure_occurrence(person_id);
CREATE INDEX IF NOT EXISTS idx_proc_visit ON procedure_occurrence(visit_occurrence_id);

CREATE TRIGGER proc_set_timestamp
BEFORE UPDATE ON procedure_occurrence
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
```

### `V007__drug_exposure.sql`

```sql
CREATE TABLE IF NOT EXISTS drug_exposure (
  drug_exposure_id SERIAL PRIMARY KEY,
  person_id INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  drug_concept_id INT NOT NULL,
  drug_exposure_start TIMESTAMPTZ NOT NULL,
  drug_exposure_end TIMESTAMPTZ,
  drug_type_concept_id INT NOT NULL,
  quantity NUMERIC,
  visit_occurrence_id INT REFERENCES visit_occurrence(visit_occurrence_id) ON DELETE SET NULL,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drug_person ON drug_exposure(person_id);
CREATE INDEX IF NOT EXISTS idx_drug_visit ON drug_exposure(visit_occurrence_id);

CREATE TRIGGER drug_set_timestamp
BEFORE UPDATE ON drug_exposure
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
```

### `V008__document.sql`

```sql
CREATE TABLE IF NOT EXISTS document (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  patient_person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT,
  content_type VARCHAR(100),
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES users(user_id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_doc_owner ON document(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_doc_patient ON document(patient_person_id);
```

### `V009__vocabulary_core.sql`

```sql
CREATE TABLE IF NOT EXISTS vocabulary (
  vocabulary_id VARCHAR(20) PRIMARY KEY,
  vocabulary_name TEXT
);

CREATE TABLE IF NOT EXISTS concept (
  concept_id INT PRIMARY KEY,
  concept_name TEXT NOT NULL,
  vocabulary_id VARCHAR(20) NOT NULL REFERENCES vocabulary(vocabulary_id),
  concept_code TEXT NOT NULL,
  domain_id TEXT,
  concept_class_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_concept_vocab ON concept(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_concept_code ON concept(concept_code);
CREATE INDEX IF NOT EXISTS idx_concept_name_trgm ON concept USING GIN (concept_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS concept_relationship (
  concept_id_1 INT NOT NULL REFERENCES concept(concept_id) ON DELETE CASCADE,
  concept_id_2 INT NOT NULL REFERENCES concept(concept_id) ON DELETE CASCADE,
  relationship_id TEXT NOT NULL,
  PRIMARY KEY (concept_id_1, concept_id_2, relationship_id)
);

CREATE TABLE IF NOT EXISTS concept_ancestor (
  ancestor_concept_id INT NOT NULL REFERENCES concept(concept_id) ON DELETE CASCADE,
  descendant_concept_id INT NOT NULL REFERENCES concept(concept_id) ON DELETE CASCADE,
  min_levels_of_separation INT,
  max_levels_of_separation INT,
  PRIMARY KEY (ancestor_concept_id, descendant_concept_id)
);
```

### `V010__identifiers_and_locks.sql`

```sql
-- Sequence tables for MRN and Visits (string formats composed in app layer)
CREATE SEQUENCE IF NOT EXISTS seq_mrn START 100000;
CREATE SEQUENCE IF NOT EXISTS seq_visit START 100000;

-- Advisory lock helpers (patterns only; locking done in app layer with pg_try_advisory_lock)
-- No SQL function needed here; we will use SELECT pg_advisory_lock(key) in code.
```

### `V011__seed_roles_permissions.sql`

```sql
INSERT INTO roles (role_name, description) VALUES
  ('Admin','System administrator'),
  ('Doctor','Clinician'),
  ('Nurse','Nursing'),
  ('Receptionist','Front desk'),
  ('Pharmacist','Pharmacy'),
  ('Patient','Patient self-service')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO permissions (permission_name, description) VALUES
  ('user.create','Create users'), ('user.read','Read users'), ('user.update','Update users'), ('user.delete','Delete users'),
  ('patient.create','Create patients'), ('patient.read','Read patients'), ('patient.update','Update patients'), ('patient.delete','Delete patients'),
  ('visit.create','Create visits'), ('visit.read','Read visits'), ('visit.update','Update visits'), ('visit.delete','Delete visits'),
  ('procedure.create','Create procedures'), ('procedure.read','Read procedures'),
  ('medication.create','Create drug exposures'), ('medication.read','Read drug exposures'),
  ('document.upload','Upload documents'), ('document.read','Read documents'), ('document.delete','Delete documents'),
  ('fhir.read','Read FHIR resources'), ('reports.view','View reports'), ('audit.view','View audits')
ON CONFLICT (permission_name) DO NOTHING;

-- Map roles to permissions (subset examples)
WITH rp AS (
  SELECT role_id FROM roles WHERE role_name = 'Admin'
)
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Admin'
ON CONFLICT DO NOTHING;

-- Doctors: common clinical permissions
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p
WHERE r.role_name = 'Doctor' AND p.permission_name IN (
  'patient.read','patient.update','visit.create','visit.read','procedure.create','procedure.read','medication.create','medication.read','document.read','fhir.read'
) ON CONFLICT DO NOTHING;
```

### `V012__seed_admin_user.sql`

```sql
-- Replace the hash before deploying. This is an example bcrypt hash for "ChangeMe123!"
INSERT INTO users (username, password_hash, email)
VALUES ('admin', '$2b$12$5IOlL9h7o3q1oQ9u1G1O7eFq2kS7v3S6iN0X9x1m7y0uS1p1nR3Wa', 'admin@example.org')
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles(user_id, role_id)
SELECT u.user_id, r.role_id FROM users u CROSS JOIN roles r
WHERE u.username='admin' AND r.role_name='Admin'
ON CONFLICT DO NOTHING;
```

---

## 2) Next.js Backend Scaffold (App Router)

**Folder layout (excerpt)**

```
/ (repo root)
├─ infra/
│  └─ migrations/                 # SQL files above
├─ src/
│  └─ server/
│     ├─ config.ts
│     ├─ db/
│     │  ├─ pool.ts               # pg Pool
│     │  └─ slonik.ts             # optional slonik pool
│     ├─ auth/
│     │  ├─ jwt.ts
│     │  └─ permissions.ts
│     ├─ middleware/
│     │  └─ audit.ts
│     ├─ repos/
│     │  ├─ users.repo.ts
│     │  ├─ person.repo.ts
│     │  ├─ visits.repo.ts
│     │  ├─ procedures.repo.ts
│     │  ├─ drugs.repo.ts
│     │  ├─ documents.repo.ts
│     │  └─ terminology.repo.ts
│     ├─ services/
│     │  ├─ auth.service.ts
│     │  ├─ users.service.ts
│     │  ├─ patients.service.ts
│     │  ├─ visits.service.ts
│     │  ├─ documents.service.ts
│     │  └─ terminology.service.ts
│     ├─ utils/
│     │  ├─ errors.ts
│     │  ├─ pagination.ts
│     │  └─ validators.ts
│     └─ s3/
│        └─ client.ts
├─ app/
│  └─ api/
│     ├─ auth/
│     │  ├─ login/route.ts
│     │  ├─ refresh/route.ts
│     │  └─ logout/route.ts
│     ├─ users/route.ts
│     ├─ users/[id]/route.ts
│     ├─ patients/route.ts
│     ├─ patients/[person_id]/route.ts
│     ├─ visits/route.ts
│     ├─ visits/[id]/route.ts
│     ├─ procedures/route.ts
│     ├─ medications/route.ts
│     ├─ documents/
│     │  ├─ route.ts              # list
│     │  ├─ [id]/route.ts         # get by id
│     │  ├─ presign/route.ts
│     │  └─ confirm/route.ts
│     ├─ terminology/
│     │  ├─ concepts/route.ts
│     │  └─ concepts/batch/route.ts
│     └─ fhir/
│        └─ R4/
│           ├─ Patient/[id]/route.ts
│           └─ Encounter/[id]/route.ts
├─ tests/
│  ├─ setup.ts
│  ├─ helpers.ts
│  ├─ auth.login.int.test.ts
│  ├─ patients.int.test.ts
│  └─ visits.int.test.ts
├─ jest.config.ts
└─ package.json
```

---

### `src/server/config.ts`

```ts
export const config = {
  db: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'hospital',
    user: process.env.PGUSER || 'hospital',
    password: process.env.PGPASSWORD || 'password',
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  },
  jwt: {
    issuer: 'hospital-ms',
    accessTtlSec: Number(process.env.JWT_ACCESS_TTL || 900), // 15m
    refreshTtlSec: Number(process.env.JWT_REFRESH_TTL || 604800), // 7d
    secret: process.env.JWT_SECRET || 'replace-me',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKeyId: process.env.S3_ACCESS_KEY || 'minio',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minio123',
    bucket: process.env.S3_BUCKET || 'documents',
    region: process.env.S3_REGION || 'us-east-1',
  },
};
```

### `src/server/db/pool.ts`

```ts
import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  ssl: config.db.ssl as any,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function withTx<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

### `src/server/auth/jwt.ts`

```ts
import jwt from 'jsonwebtoken';
import { config } from '../config';

export type JwtClaims = { sub: string; roles: string[] };

export function signAccessToken(claims: JwtClaims) {
  return jwt.sign(claims, config.jwt.secret, {
    issuer: config.jwt.issuer,
    expiresIn: config.jwt.accessTtlSec,
  });
}

export function verifyAccessToken(token: string): JwtClaims {
  return jwt.verify(token, config.jwt.secret, { issuer: config.jwt.issuer }) as JwtClaims;
}
```

### `src/server/auth/permissions.ts`

```ts
import { pool } from '../db/pool';

export async function userHasPermissions(userId: string, required: string[]): Promise<boolean> {
  if (!required.length) return true;
  const { rows } = await pool.query(
    `SELECT p.permission_name
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.permission_id = rp.permission_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  const set = new Set(rows.map((r: any) => r.permission_name));
  return required.every((perm) => set.has(perm));
}
```

### `src/server/middleware/audit.ts`

```ts
import { pool } from '../db/pool';

export async function audit(
  userId: string | null,
  action: 'READ'|'CREATE'|'UPDATE'|'DELETE'|'AUTH',
  resourceType: string,
  resourceId: string | number | null,
  ip: string | null,
  userAgent: string | null,
  details: Record<string, any> | null
) {
  await pool.query(
    `SELECT log_audit($1,$2,$3,$4,$5,$6,$7)`,
    [userId, action, resourceType, resourceId?.toString() ?? null, ip, userAgent, details]
  );
}
```

---

## Repositories (examples)

### `src/server/repos/users.repo.ts`

```ts
import { PoolClient } from 'pg';

export async function createUser(client: PoolClient, input: {username:string; email:string; password_hash:string; role_ids?: number[]}) {
  const res = await client.query(
    `INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING *`,
    [input.username, input.email, input.password_hash]
  );
  const user = res.rows[0];
  if (input.role_ids?.length) {
    for (const rid of input.role_ids) {
      await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [user.user_id, rid]);
    }
  }
  return user;
}

export async function findByUsername(username: string) {
  const { rows } = await import('../db/pool').then(m => m.pool.query(`SELECT * FROM users WHERE username=$1`, [username]));
  return rows[0] || null;
}
```

### `src/server/repos/person.repo.ts`

```ts
import { PoolClient } from 'pg';

export async function insertPerson(client: PoolClient, p: any) {
  const nextMrnRes = await client.query(`SELECT nextval('seq_mrn') AS n`);
  const mrn = `MRN-${new Date().getUTCFullYear()}-${String(nextMrnRes.rows[0].n).padStart(6,'0')}`;
  const res = await client.query(
    `INSERT INTO person (user_id, first_name, last_name, gender_concept_id, year_of_birth, month_of_birth, day_of_birth, birth_datetime, race_concept_id, ethnicity_concept_id, person_source_value, mrn)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING person_id, mrn, created_at`,
     [p.user_id||null, p.first_name||null, p.last_name||null, p.gender_concept_id, p.year_of_birth, p.month_of_birth||null, p.day_of_birth||null, p.birth_datetime||null, p.race_concept_id||null, p.ethnicity_concept_id||null, p.person_source_value||null, mrn]
  );
  return res.rows[0];
}
```

### `src/server/repos/visits.repo.ts`

```ts
import { PoolClient } from 'pg';

export async function createVisit(client: PoolClient, v: any) {
  const nextRes = await client.query(`SELECT nextval('seq_visit') AS n`);
  const visit_number = `V-${new Date().getUTCFullYear()}-${String(nextRes.rows[0].n).padStart(6,'0')}`;
  const res = await client.query(
    `INSERT INTO visit_occurrence (person_id, visit_concept_id, visit_start, visit_end, visit_type, department_id, provider_id, reason, visit_number)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING visit_occurrence_id, visit_number, created_at`,
     [v.person_id, v.visit_concept_id, v.visit_start, v.visit_end||null, v.visit_type, v.department_id||null, v.provider_id||null, v.reason||null, visit_number]
  );
  return res.rows[0];
}
```

---

## Services (examples)

### `src/server/services/auth.service.ts`

```ts
import bcrypt from 'bcryptjs';
import { pool, withTx } from '../db/pool';
import { signAccessToken } from '../auth/jwt';

export async function login(username: string, password: string, meta:{ip?:string; ua?:string}) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE username=$1 AND active=true`, [username]);
  const user = rows[0];
  if (!user) throw new Error('INVALID_CREDENTIALS');
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');
  const accessToken = signAccessToken({ sub: user.user_id, roles: await fetchRoles(user.user_id) });
  // refresh token rotation example (hash stored)
  const refresh = cryptoRandom();
  const hash = await bcrypt.hash(refresh, 12);
  await pool.query(`INSERT INTO refresh_tokens(user_id, token_hash, user_agent, ip) VALUES($1,$2,$3,$4)`, [user.user_id, hash, meta.ua||null, meta.ip||null]);
  return { accessToken, refreshToken: refresh, user: { user_id: user.user_id, username: user.username, email: user.email, roles: await fetchRoles(user.user_id) } };
}

export async function fetchRoles(userId: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT r.role_name FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id WHERE ur.user_id = $1`,
    [userId]
  );
  return rows.map(r => r.role_name);
}

function cryptoRandom(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
```

### `src/server/services/patients.service.ts`

```ts
import { withTx } from '../db/pool';
import { insertPerson } from '../repos/person.repo';

export async function createPatient(input: any) {
  return withTx(async (client) => {
    // minimal validation assumed done in route layer
    const res = await insertPerson(client, input);
    return res; // { person_id, mrn, created_at }
  });
}
```

### `src/server/services/visits.service.ts`

```ts
import { withTx, pool } from '../db/pool';
import { createVisit } from '../repos/visits.repo';

export async function openVisit(v: any) {
  // Prevent overlapping IPD visits for same patient
  const overlap = await pool.query(
    `SELECT 1 FROM visit_occurrence WHERE person_id=$1 AND visit_type='IPD' AND visit_end IS NULL`,
    [v.person_id]
  );
  if (overlap.rowCount) throw new Error('OVERLAPPING_INPATIENT_VISIT');
  return withTx(async (client) => createVisit(client, v));
}
```

---

## API Routes (App Router) — examples

> Next.js 13+ `app/api/.../route.ts`. Keep logic in services; routes only parse/validate, authN/Z, audit, and return JSON.

### `app/api/auth/login/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/src/server/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body || {};
    if (!username || !password) return NextResponse.json({ message: 'username/password required' }, { status: 400 });
    const result = await login(username, password, { ip: req.ip ?? null, ua: req.headers.get('user-agent') ?? undefined });
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    const msg = e?.message === 'INVALID_CREDENTIALS' ? 'Invalid credentials' : 'Unexpected error';
    return NextResponse.json({ message: msg }, { status: msg==='Invalid credentials' ? 401 : 500 });
  }
}
```

### `app/api/patients/route.ts` (POST create; GET list)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createPatient } from '@/src/server/services/patients.service';
import { pool } from '@/src/server/db/pool';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.gender_concept_id || !body?.dob) return NextResponse.json({ message: 'missing required fields' }, { status: 400 });
  const dob = new Date(body.dob);
  const data = {
    user_id: null,
    first_name: body.first_name ?? null,
    last_name: body.last_name ?? null,
    gender_concept_id: body.gender_concept_id,
    year_of_birth: dob.getUTCFullYear(),
    month_of_birth: dob.getUTCMonth()+1,
    day_of_birth: dob.getUTCDate(),
    birth_datetime: dob.toISOString(),
    race_concept_id: body.race_concept_id ?? null,
    ethnicity_concept_id: body.ethnicity_concept_id ?? null,
    person_source_value: body.person_source_value ?? null,
  };
  const res = await createPatient(data);
  return NextResponse.json(res, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('search');
  const limit = Math.min(Number(searchParams.get('limit')||'20'), 100);
  const { rows } = await pool.query(
    q
      ? `SELECT person_id, first_name, last_name, mrn FROM person WHERE (first_name || ' ' || last_name) ILIKE '%'||$1||'%' ORDER BY person_id DESC LIMIT $2`
      : `SELECT person_id, first_name, last_name, mrn FROM person ORDER BY person_id DESC LIMIT $1`,
    q ? [q, limit] : [limit]
  );
  return NextResponse.json({ items: rows }, { status: 200 });
}
```

### `app/api/visits/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { openVisit } from '@/src/server/services/visits.service';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const required = ['person_id','visit_concept_id','visit_type','visit_start'];
  for (const k of required) if (!body?.[k]) return NextResponse.json({ message: `Missing ${k}` }, { status: 400 });
  const payload = {
    person_id: Number(body.person_id),
    visit_concept_id: Number(body.visit_concept_id),
    visit_type: String(body.visit_type),
    visit_start: new Date(body.visit_start).toISOString(),
    visit_end: body.visit_end ? new Date(body.visit_end).toISOString() : null,
    department_id: body.department_id ? Number(body.department_id) : null,
    provider_id: body.provider_id ?? null,
    reason: body.reason ?? null,
  };
  const res = await openVisit(payload);
  return NextResponse.json(res, { status: 201 });
}
```

---

## Documents (S3/MinIO) — examples

### `src/server/s3/client.ts`

```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

export const s3 = new S3Client({
  region: config.s3.region,
  endpoint: config.s3.endpoint,
  credentials: { accessKeyId: config.s3.accessKeyId, secretAccessKey: config.s3.secretAccessKey },
  forcePathStyle: true,
});

export async function presignPut(key: string, contentType: string, expires = 900) {
  const cmd = new PutObjectCommand({ Bucket: config.s3.bucket, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, cmd, { expiresIn: expires });
  return { url, fields: {}, expires_at: new Date(Date.now()+expires*1000).toISOString() };
}
```

### `app/api/documents/presign/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { presignPut } from '@/src/server/s3/client';
import { pool } from '@/src/server/db/pool';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { file_name, content_type, size_bytes, patient_person_id } = body || {};
  if (!file_name || !content_type) return NextResponse.json({ message: 'file_name & content_type required' }, { status: 400 });
  const key = `uploads/${crypto.randomUUID()}-${file_name}`;
  const link = await presignPut(key, content_type, 900);
  const { rows } = await pool.query(
    `INSERT INTO document (owner_user_id, patient_person_id, file_path, file_name, content_type, size_bytes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING document_id`,
    [null, patient_person_id || null, `s3://${process.env.S3_BUCKET || 'documents'}/${key}`, file_name, content_type, size_bytes || null]
  );
  return NextResponse.json({ upload_id: rows[0].document_id, ...link }, { status: 200 });
}
```

---

## Terminology lookup — example route

### `app/api/terminology/concepts/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/src/server/db/pool';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const code = searchParams.get('code');
  const vocabulary_id = searchParams.get('vocabulary_id');
  const limit = Math.min(Number(searchParams.get('limit')||'20'), 100);

  if (code && vocabulary_id) {
    const { rows } = await pool.query(
      `SELECT concept_id, concept_name, vocabulary_id, concept_code FROM concept WHERE concept_code=$1 AND vocabulary_id=$2 LIMIT $3`,
      [code, vocabulary_id, limit]
    );
    return NextResponse.json({ items: rows }, { status: 200 });
  }

  if (q) {
    const { rows } = await pool.query(
      `SELECT concept_id, concept_name, vocabulary_id, concept_code FROM concept
       WHERE concept_name ILIKE '%'||$1||'%' ORDER BY concept_name LIMIT $2`,
      [q, limit]
    );
    return NextResponse.json({ items: rows }, { status: 200 });
  }

  return NextResponse.json({ items: [] }, { status: 200 });
}
```

---

## FHIR (read-only) — example routes

### `app/api/fhir/R4/Patient/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/src/server/db/pool';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { rows } = await pool.query(`SELECT person_id, first_name, last_name, year_of_birth, month_of_birth, day_of_birth, gender_concept_id, mrn FROM person WHERE person_id=$1`, [id]);
  const p = rows[0];
  if (!p) return NextResponse.json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found' }] }, { status: 404, headers: { 'content-type': 'application/fhir+json' } });
  const birthDate = `${p.year_of_birth}-${String(p.month_of_birth||1).padStart(2,'0')}-${String(p.day_of_birth||1).padStart(2,'0')}`;
  const fhir = {
    resourceType: 'Patient',
    id: String(p.person_id),
    identifier: [{ system: 'http://hospital.example.org/mrn', value: p.mrn }],
    name: [{ use: 'official', family: p.last_name, given: [p.first_name].filter(Boolean) }],
    gender: p.gender_concept_id === 8507 ? 'male' : p.gender_concept_id === 8532 ? 'female' : 'unknown',
    birthDate,
  };
  return new NextResponse(JSON.stringify(fhir), { status: 200, headers: { 'content-type': 'application/fhir+json' } });
}
```

---

## Tests (Jest + Testcontainers) — examples

### `jest.config.ts`

```ts
import type { Config } from 'jest';
const config: Config = {
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000,
};
export default config;
```

### `tests/setup.ts`

```ts
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { pool } from '@/src/server/db/pool';
import fs from 'fs';
import path from 'path';

let container: StartedTestContainer;

beforeAll(async () => {
  container = await new GenericContainer('postgres:15')
    .withEnv('POSTGRES_DB','hospital')
    .withEnv('POSTGRES_USER','hospital')
    .withEnv('POSTGRES_PASSWORD','password')
    .withExposedPorts(5432)
    .start();

  process.env.PGHOST = container.getHost();
  process.env.PGPORT = String(container.getMappedPort(5432));
  process.env.PGDATABASE = 'hospital';
  process.env.PGUSER = 'hospital';
  process.env.PGPASSWORD = 'password';

  // Apply migrations
  const dir = path.join(process.cwd(), 'infra', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    await (await import('pg')).Client.prototype.query; // ensure pg imported
    const { Client } = await import('pg');
    const c = new Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT), database: 'hospital', user: 'hospital', password: 'password' });
    await c.connect();
    await c.query(sql);
    await c.end();
  }
});

afterAll(async () => {
  await pool.end?.();
  await container.stop();
});
```

### `tests/auth.login.int.test.ts`

```ts
import { pool } from '@/src/server/db/pool';
import { login } from '@/src/server/services/auth.service';
import bcrypt from 'bcryptjs';

describe('Auth login', () => {
  beforeAll(async () => {
    const hash = await bcrypt.hash('ChangeMe123!', 12);
    const u = await pool.query(`INSERT INTO users(username,email,password_hash) VALUES('jane','jane@x.com',$1) RETURNING user_id`, [hash]);
    // Make Doctor role if not exists, then map role
    await pool.query(`INSERT INTO roles(role_name) VALUES('Doctor') ON CONFLICT DO NOTHING`);
    const { rows } = await pool.query(`SELECT role_id FROM roles WHERE role_name='Doctor'`);
    await pool.query(`INSERT INTO user_roles(user_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [u.rows[0].user_id, rows[0].role_id]);
  });

  it('issues tokens on valid credentials', async () => {
    const res = await login('jane','ChangeMe123!', { ip: '127.0.0.1', ua: 'jest' });
    expect(res.accessToken).toBeTruthy();
    expect(res.refreshToken).toHaveLength(64);
    expect(res.user.username).toBe('jane');
  });
});
```

### `tests/patients.int.test.ts`

```ts
import { createPatient } from '@/src/server/services/patients.service';

describe('Patients', () => {
  it('creates a patient and returns MRN', async () => {
    const res = await createPatient({
      gender_concept_id: 8507,
      first_name: 'John',
      last_name: 'Smith',
      year_of_birth: 1980,
      month_of_birth: 5,
      day_of_birth: 5,
      birth_datetime: new Date('1980-05-05T00:00:00Z').toISOString(),
      race_concept_id: null,
      ethnicity_concept_id: null,
      person_source_value: 'imported',
    });
    expect(res.person_id).toBeGreaterThan(0);
    expect(res.mrn).toMatch(/^MRN-\d{4}-\d{6}$/);
  });
});
```

---

## package.json (scripts excerpt)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest --runInBand",
    "migrate:dev": "for f in infra/migrations/*.sql; do psql $POSTGRES_URL -f \"$f\"; done"
  },
  "dependencies": {
    "pg": "^8.12.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "@aws-sdk/client-s3": "^3.678.0",
    "@aws-sdk/s3-request-presigner": "^3.678.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "testcontainers": "^10.10.2",
    "typescript": "^5.6.3"
  }
}
```

---

### Notes

* Replace the sample admin password hash before production.
* Use environment secrets for JWT and DB.
* Add rate limiting and auth guards to route files as you integrate RBAC checks.
* Extend tests to cover errors, RBAC (403), and pagination.
