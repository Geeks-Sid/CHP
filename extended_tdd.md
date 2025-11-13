# Technical Design Document — **Backend migrated to TypeScript (Node.js + NestJS + Prisma)**

> Summary: your original TDD has been preserved in intent and structure (OMOP-on-FHIR, PostgreSQL, RBAC, versioned APIs, dashboards, HIPAA, CI/CD, etc.). This document updates **only** the backend technology stack and all related implementation details: we replace the Go backend with a **TypeScript** backend built on **NestJS** (Fastify adapter), **Prisma** as the ORM + migrations engine, and modern Node tooling. Everything else (frontend Next.js plan, DB schema, OMOP mapping, API design, deployment, security, testing, monitoring) remains aligned with the original TDD and is adjusted where necessary for the TypeScript stack.

---

# 1. Executive summary

**New backend stack (high level)**

* Language & runtime: **TypeScript** (Node.js LTS)
* Framework: **NestJS** (modular, DI, scalable) with **Fastify** adapter for performance
* ORM / Migrations: **Prisma** (type-safe schema + Prisma Migrate)
* Authentication: **JWT** (Passport.js local/jwt strategies) + refresh tokens
* RBAC: NestJS **Guards** + decorators + permissions service
* FHIR: FHIR endpoints served as controllers that map OMOP tables → FHIR resources using a dedicated `fhir` module (utility mapping functions, validators)
* Terminologies: local OMOP vocabulary tables in PostgreSQL and optional external terminology service integration (Ontoserver or Snowstorm) via an adapter interface
* Testing: **Jest** (unit/integration), **Playwright/Cypress** for E2E
* Containerization: Docker, Kubernetes manifests / Helm charts
* CI/CD: GitHub Actions (or GitLab CI) for lint, test, build, publish
* Monitoring/Observability: Prometheus + Grafana, ELK/Opensearch for logs, distributed tracing via OpenTelemetry

Rationale: NestJS gives a structured application architecture, strong typing & decorators, built-in DI and testing utilities. Prisma gives a modern developer experience and safe migrations while mapping well to OMOP schema.

---

# 2. Goals & unchanged objectives

All goals from the original TDD remain valid:

* OMOP-on-FHIR for clinical interoperability
* Terminology integration (SNOMED/ICD-10/RxNorm/LOINC)
* API versioning, RBAC, HIPAA compliance, backups, monitoring
* Frontend remains Next.js as previously specified
* File storage via S3/MinIO
* CI/CD, containerization, blue/green or rolling updates

---

# 3. Updated System Architecture (backend-focused)

## 3.1 Modular layout (logical)

* `auth` module — login/register, JWT handling, refresh tokens, password hashing
* `users` module — users, roles, permissions, admin user management
* `people` module — OMOP `person` modeling (patients, doctors, admins)
* `visits` module — visit_occurrence (encounters)
* `procedures` module — procedure_occurrence
* `medications` module — drug_exposure
* `documents` module — file metadata, secure presigned uploads to S3/MinIO
* `terminology` module — concept / vocabulary management + external adapters
* `fhir` module — FHIR REST endpoints and mapping utilities
* `messaging` module — internal messaging between doctors/patients
* `reports` module — reporting queries, statistics (optionally read replicas)
* `common` module — shared DTOs, interceptors, pipes, filters, util functions
* `infrastructure` layer — Prisma client, caching (Redis), queue (BullMQ), email

## 3.2 High-level request flow

1. Client requests `/api/v1/auth/login`.
2. NestJS controller authenticates via `AuthService` → JWT returned in HTTP-only cookie + refresh token.
3. Protected endpoints guarded by `JwtAuthGuard` + `PermissionsGuard` which extract role and check permission matrix.
4. Services talk to Prisma client (Postgres) for CRUD operations.
5. For FHIR endpoints, `FhirController` maps OMOP rows → FHIR JSON and applies validation.

## 3.3 Terminology & Vocabulary Services

* **Primary**: local OMOP vocabulary tables (concept, concept_relationship, vocabulary, etc.) stored in PostgreSQL and accessible through `terminology` module.
* **Secondary (adapter)**: optional external terminology service adapter (Ontoserver / Snowstorm) for updates and authoritative lookups. Implement as an abstract interface so it can be swapped without impacting other modules.
* Cache frequent lookups with Redis for low-latency.

---

# 4. Backend Technology & Libraries (detailed)

* Node.js LTS + **TypeScript**
* **NestJS** (framework) — controllers, providers, modules, guards, interceptors
* **Fastify** adapter for Nest (performance)
* **Prisma ORM** + Prisma Migrate (Postgres schema + type-safe client)
* **PostgreSQL** (primary database)
* **Redis** (caching, sessions, rate-limiting store)
* **Passport.js** strategies for auth (`passport-jwt`, `passport-local`) integrated into Nest
* **class-validator / class-transformer** for DTO validation (Nest Pipes)
* **BullMQ** for background jobs (e.g., notifications, batch terminology imports)
* **OpenTelemetry** + **Prometheus** exporters for tracing/metrics
* **Winston / pino** for structured logging (JSON) with log shipping to ELK/Opensearch
* **Sentry** optional for error monitoring
* **Jest** for unit/integration tests; **supertest** for integration testing controllers
* **Cypress/Playwright** for E2E
* **Docker** & **Kubernetes / Helm** for orchestration
* **TypeDoc** or OpenAPI (Swagger) generation: NestJS Swagger module to produce OpenAPI docs
* **Helmet**, **rate-limiter-flexible**, **express-rate-limit** equivalent for Fastify (security)

---

# 5. Updated API Design & Versioning

All endpoints remain the same as your prior `/api/v1/*` design. Implementation notes:

* Nest controllers mapped to `/api/v1/...`
* Add common `ApiController` base and `Versioning` via URL (Nest supports this).
* FHIR endpoints live under `/fhir/` root (optionally versioned `/fhir/R4/`).
* API documentation via Swagger auto-generated from controllers/DTOs.

Security:

* Authorization enforced by custom `PermissionsGuard` reading permissions matrix from DB (or config).
* JWT in HTTP-only secure cookie (same-site) and refresh token stored in DB with rotation.
* Per-request audit logging (audit entries stored in audit_log table).

---

# 6. Database & Prisma schema (representative)

Use Prisma for schema modeling and migrations. Below is a **condensed** Prisma schema for the core tables (adapted from your SQL). This is intentionally representative — you'll expand all OMOP vocab tables analogously.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Role {
  role_id   Int      @id @default(autoincrement())
  role_name String   @unique
  users     UserRole[]
  RolePerms RolePermission[]
}

model Permission {
  permission_id   Int   @id @default(autoincrement())
  permission_name String @unique
  RolePerms       RolePermission[]
}

model RolePermission {
  role_id       Int
  permission_id Int
  role          Role      @relation(fields: [role_id], references: [role_id])
  permission    Permission @relation(fields: [permission_id], references: [permission_id])

  @@id([role_id, permission_id])
}

model User {
  user_id      String    @id @default(uuid())
  username     String    @unique
  passwordHash String
  email        String    @unique
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  person       Person?   @relation(fields: [personId], references: [person_id])
  personId     Int?
  roles        UserRole[]
  documents    Document[]
}

model UserRole {
  user_id String
  role_id Int
  user    User @relation(fields: [user_id], references: [user_id])
  role    Role @relation(fields: [role_id], references: [role_id])

  @@id([user_id, role_id])
}

model Person {
  person_id                   Int     @id @default(autoincrement())
  user                        User?   @relation
  gender_concept_id           Int
  year_of_birth               Int
  month_of_birth              Int?
  day_of_birth                Int?
  birth_datetime              DateTime?
  race_concept_id             Int
  ethnicity_concept_id        Int
  person_source_value         String?
  // ... other OMOP person fields
  visits                      Visit[]
  procedures                  ProcedureOccurrence[]
  drugExposures               DrugExposure[]
}

model Visit {
  visit_occurrence_id     Int      @id @default(autoincrement())
  person_id               Int
  visit_concept_id        Int
  visit_start_date        DateTime
  visit_end_date          DateTime
  visit_type_concept_id   Int
  provider_id             Int?
  care_site_id            Int?
  visit_source_value      String?
  person                  Person   @relation(fields: [person_id], references: [person_id])
  procedures              ProcedureOccurrence[]
  drugExposures           DrugExposure[]
}

model ProcedureOccurrence {
  procedure_occurrence_id Int    @id @default(autoincrement())
  person_id               Int
  procedure_concept_id    Int
  procedure_date          DateTime
  procedure_type_concept_id Int
  visit_occurrence_id     Int?
  person                  Person @relation(fields: [person_id], references: [person_id])
  visit                   Visit? @relation(fields: [visit_occurrence_id], references: [visit_occurrence_id])
}

model DrugExposure {
  drug_exposure_id           Int     @id @default(autoincrement())
  person_id                  Int
  drug_concept_id            Int
  drug_exposure_start_date   DateTime
  drug_exposure_end_date     DateTime
  drug_type_concept_id       Int
  stop_reason                String?
  quantity                   Float?
  person                     Person  @relation(fields: [person_id], references: [person_id])
  visit                      Visit?  @relation(fields: [visit_occurrence_id], references: [visit_occurrence_id])
  visit_occurrence_id        Int?
}

model Document {
  document_id String   @id @default(uuid())
  user_id     String
  file_path   String
  file_type   String
  uploaded_at DateTime @default(now())
  user        User     @relation(fields: [user_id], references: [user_id])
}

// OMOP vocabulary tables — simplified example
model Concept {
  concept_id       Int      @id
  concept_name     String
  vocabulary_id    String
  concept_code     String
  domain_id        String
  concept_class_id String
  // add indexes and relations as necessary
}
```

**Notes:**

* Keep the full OMOP vocabulary tables (concept_relationship, concept_ancestor, vocabulary) — they can be large; consider storing vocabularies in dedicated read replicas or separate DB for performance.
* Use `@@index` on frequently queried columns (e.g. `concept_id`, `person_id`, `user_id`).

---

# 7. Backend Project Structure (very detailed)

This is a **recommended monorepo** structure where frontend stays under `frontend` and backend under `backend` with TypeScript NestJS code. All file names included.

```
patient-ms-monorepo/
├─ docs/
│  ├─ TDD.md
│  ├─ API_Documentation/
│  └─ Compliance_Documents/
├─ backend/                              <-- TypeScript NestJS backend
│  ├─ README.md
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ nest-cli.json
│  ├─ prisma/
│  │   ├─ schema.prisma
│  │   ├─ seed.ts
│  │   └─ migrations/                     // Prisma migrations generated by `prisma migrate`
│  ├─ src/
│  │   ├─ main.ts                         // bootstraps Nest application (Fastify adapter)
│  │   ├─ app.module.ts                   // root module
│  │   ├─ config/
│  │   │   ├─ config.module.ts
│  │   │   ├─ configuration.ts            // reads env variables
│  │   │   └─ validation.schema.ts
│  │   ├─ infra/
│  │   │   ├─ prisma/
│  │   │   │   └─ prisma.service.ts       // Prisma client wrapper
│  │   │   ├─ redis.service.ts
│  │   │   └─ bullmq.service.ts
│  │   ├─ common/
│  │   │   ├─ dto/
│  │   │   ├─ exceptions/
│  │   │   │   └─ http-exception.filter.ts
│  │   │   ├─ interceptors/
│  │   │   │   └─ logging.interceptor.ts
│  │   │   ├─ pipes/
│  │   │   │   └─ validation.pipe.ts
│  │   │   ├─ guards/
│  │   │   │   └─ permissions.guard.ts
│  │   │   ├─ decorators/
│  │   │   │   └─ roles.decorator.ts
│  │   │   └─ utils/
│  │   │       └─ audit.util.ts
│  │   ├─ auth/
│  │   │   ├─ auth.module.ts
│  │   │   ├─ auth.controller.ts
│  │   │   ├─ auth.service.ts
│  │   │   ├─ jwt.strategy.ts
│  │   │   ├─ local.strategy.ts
│  │   │   └─ dto/
│  │   │       ├─ login.dto.ts
│  │   │       └─ register.dto.ts
│  │   ├─ users/
│  │   │   ├─ users.module.ts
│  │   │   ├─ users.controller.ts
│  │   │   ├─ users.service.ts
│  │   │   ├─ dto/
│  │   │   │   ├─ create-user.dto.ts
│  │   │   │   └─ update-user.dto.ts
│  │   │   └─ repositories/
│  │   │       └─ users.repository.ts
│  │   ├─ roles/
│  │   │   ├─ roles.module.ts
│  │   │   ├─ roles.service.ts
│  │   │   └─ roles.controller.ts
│  │   ├─ people/
│  │   │   ├─ people.module.ts
│  │   │   ├─ people.controller.ts
│  │   │   ├─ people.service.ts
│  │   │   └─ dto/
│  │   ├─ visits/
│  │   │   ├─ visits.module.ts
│  │   │   ├─ visits.controller.ts
│  │   │   ├─ visits.service.ts
│  │   │   └─ repositories/
│  │   ├─ procedures/
│  │   │   ├─ procedures.module.ts
│  │   │   ├─ procedures.controller.ts
│  │   │   └─ procedures.service.ts
│  │   ├─ medications/
│  │   │   ├─ medications.module.ts
│  │   │   ├─ medications.controller.ts
│  │   │   └─ medications.service.ts
│  │   ├─ documents/
│  │   │   ├─ documents.module.ts
│  │   │   ├─ documents.controller.ts
│  │   │   └─ documents.service.ts
│  │   ├─ terminology/
│  │   │   ├─ terminology.module.ts
│  │   │   ├─ terminology.service.ts
│  │   │   ├─ adapters/
│  │   │   │   └─ ontoserver.adapter.ts
│  │   │   └─ importers/
│  │   ├─ fhir/
│  │   │   ├─ fhir.module.ts
│  │   │   ├─ fhir.controller.ts
│  │   │   └─ fhir.mapper.ts
│  │   ├─ messaging/
│  │   ├─ reports/
│  │   └─ telemetry/
│  │       ├─ telemetry.module.ts
│  │       └─ otel.interceptor.ts
│  ├─ scripts/
│  │   ├─ start-local.sh
│  │   └─ seed-roles.ts
│  ├─ Dockerfile
│  └─ docker-compose.yml                   // dev compose: backend, postgres, redis, minio
├── frontend
│   ├── README.md
│   ├── bun.lockb
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public
│   │   ├── favicon.ico
│   │   ├── og-image.png
│   │   └── placeholder.svg
│   ├── src
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── components
│   │   │   ├── auth
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── layout
│   │   │   │   ├── AuthLayout.tsx
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── ui
│   │   │       ├── PageTransition.tsx
│   │   │       ├── accordion.tsx
│   │   │       ├── alert-dialog.tsx
│   │   │       ├── alert.tsx
│   │   │       ├── aspect-ratio.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── breadcrumb.tsx
│   │   │       ├── button.tsx
│   │   │       ├── calendar.tsx
│   │   │       ├── card.tsx
│   │   │       ├── carousel.tsx
│   │   │       ├── chart.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── collapsible.tsx
│   │   │       ├── command.tsx
│   │   │       ├── context-menu.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── drawer.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── form.tsx
│   │   │       ├── hover-card.tsx
│   │   │       ├── input-otp.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── menubar.tsx
│   │   │       ├── navigation-menu.tsx
│   │   │       ├── pagination.tsx
│   │   │       ├── popover.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── radio-group.tsx
│   │   │       ├── resizable.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── slider.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── table.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── toast.tsx
│   │   │       ├── toaster.tsx
│   │   │       ├── toggle-group.tsx
│   │   │       ├── toggle.tsx
│   │   │       ├── tooltip.tsx
│   │   │       └── use-toast.ts
│   │   ├── context
│   │   │   └── AuthContext.tsx
│   │   ├── hooks
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── index.css
│   │   ├── lib
│   │   │   └── utils.ts
│   │   ├── main.tsx
│   │   ├── pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Index.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── admin
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AuditLogs.tsx
│   │   │   │   ├── HospitalStatistics.tsx
│   │   │   │   ├── SystemSettings.tsx
│   │   │   │   └── UserManagement.tsx
│   │   │   ├── appointments
│   │   │   │   ├── AppointmentForm.tsx
│   │   │   │   └── AppointmentsList.tsx
│   │   │   ├── inventory
│   │   │   │   ├── InventoryDashboard.tsx
│   │   │   │   ├── MedicineInventoryDashboard.tsx
│   │   │   │   └── WarehouseInventoryDashboard.tsx
│   │   │   ├── medical-records
│   │   │   │   ├── MedicalRecordDetails.tsx
│   │   │   │   └── MedicalRecordsList.tsx
│   │   │   ├── medications
│   │   │   │   └── MedicationsList.tsx
│   │   │   ├── messages
│   │   │   │   └── MessagesList.tsx
│   │   │   ├── patients
│   │   │   │   ├── PatientDetails.tsx
│   │   │   │   ├── PatientForm.tsx
│   │   │   │   └── PatientsList.tsx
│   │   │   ├── prescriptions
│   │   │   │   └── PrescriptionsList.tsx
│   │   │   └── reports
│   │   │       └── Reports.tsx
│   │   └── vite-env.d.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
└── tdd.txt
├─ infra/
│  ├─ k8s/
│  │   ├─ backend-deployment.yaml
│  │   ├─ backend-service.yaml
│  │   ├─ postgres-statefulset.yaml
│  │   └─ redis-statefulset.yaml
│  └─ helm/
├─ .github/
│  └─ workflows/
│     ├─ backend-ci.yml
│     ├─ frontend-ci.yml
│     └─ deploy.yml
└─ README.md
```

**Key file responsibilities (excerpt)**

* `main.ts` — create Nest app, set global pipes, filters, enable Swagger, configure fastify, set CORS and security headers, register metrics endpoint.
* `prisma.service.ts` — singleton wrapping Prisma client; ensure graceful shutdown and transactions helper.
* `auth.service.ts` — password hashing (argon2 or bcrypt), JWT sign/verify, refresh token logic (rotate + store in DB).
* `permissions.guard.ts` — checks endpoint `@Permissions()` decorator and compares to user permissions.
* `fhir.mapper.ts` — mapping functions (OMOP row → FHIR JSON resource).
* `documents.service.ts` — generate pre-signed S3/MinIO URLs and persist metadata to `document` table.

---

# 8. Authentication & RBAC (TypeScript specifics)

* **JWT**: sign with strong secret or RSA keys; tokens expire (e.g., access 15m, refresh 7d).
* **Refresh token storage**: store hashed refresh tokens in DB with rotation and device metadata (IP, user-agent).
* **Guards**:

  * `JwtAuthGuard`: validates JWT, attaches user to `Request.user`.
  * `PermissionsGuard`: reads required permissions from route metadata (`@Permissions('medications.create')`) and checks DB or cached permission matrix.
  * `RolesGuard` (if needed): checks role presence.
* **Decorators**: `@CurrentUser()`, `@Permissions()` for readability.
* **Audit**: middleware or interceptor to record read/write operations to `audit_log` table (user_id, action, resource, resource_id, timestamp, ip).

---

# 9. FHIR support

* Implement `fhir` module exposing endpoints like `/fhir/Patient/:id`, `/fhir/Encounter/:id`.
* Use `class-validator` DTOs with schemas that produce FHIR-compliant JSON.
* Map OMOP entities → FHIR via `fhir.mapper.ts`; provide reverse mapping for creating resources via FHIR.
* Optional: add SMART-on-FHIR flows (OAuth2) if integrating with external EHR apps.

---

# 10. File Storage

* Use S3 or MinIO.
* `documents.service` issues **pre-signed PUT** URLs to client for uploads; client then informs backend to persist metadata.
* Files stored with encrypted-at-rest and server-side versioning enabled (if S3).

---

# 11. Testing strategy (updated for TS)

* **Unit tests**: Jest for services, controllers, and guards. Use Nest testing utilities to create testing modules with in-memory Prisma (sqlite) or using `prisma-test-utils`.
* **Integration tests**: Start test DB (Docker) and run supertest against Nest app with real Prisma migrations applied. Use `jest --runInBand` for DB seeding control.
* **E2E tests**: Cypress or Playwright hitting a deployed test/staging environment (also test S3 presigned uploads).
* **Contract tests**: For FHIR endpoints, include schema validation against FHIR R4 JSON schemas.

---

# 12. CI / CD (TypeScript-specific)

**GitHub Actions pipeline (summary)**

* `backend-ci.yml`:

  * Checkout, cache node, install, lint (ESLint/Prettier), type-check (`tsc --noEmit`), run unit tests (Jest), run Prisma schema validation, build docker image, push to registry.
  * Optionally run integration tests using services via `docker-compose` in job.
* `deploy.yml`:

  * On merge to `main` run release job: build image, push, update cluster via Helm or kubectl apply.
  * Use environment-specific variables and secret management (Vault / GitHub Secrets).

**Containerization**

* Multi-stage Dockerfile (build with `pnpm` / `npm ci`, build artifacts, then run `node dist/main.js`) — smallest runtime image (Alpine or node slim).
* Healthchecks and readiness endpoints.

---

# 13. Observability & Ops

* Structured logging (`pino`/`winston`) with JSON fields: `timestamp`, `level`, `service`, `requestId`, `userId`.
* Metrics: expose Prometheus `/metrics` endpoint (Nest Prometheus module).
* Tracing: OpenTelemetry instrumentation for Nest + Prisma + Fastify.
* Alerts: Prometheus alerts to Slack/pager for critical issues.
* Backups: Postgres backups via `pg_dump` or cloud provider snapshots; S3 object versioning + lifecycle rules.
* Scale: horizontal scale of NestJS instances behind LB; Redis for session/lock/queues.

---

# 14. Performance & Scalability

* Use Prisma query optimization; add indices in DB; use connection pooling (PgBouncer) for high throughput.
* Use Redis cache for terminology lookups and permission matrices.
* Separate read-replicas for heavy reporting queries.
* Use job queue (BullMQ) for heavy tasks (terminology import, reports, notification sending).

---

# 15. Security & Compliance (TypeScript specifics)

* Use `helmet` or Fastify security headers plugin.
* Use `fastify-rate-limit` (Redis-backed) to throttle suspicious activity.
* Dependency scanning (GitHub Dependabot / Snyk) as part of CI.
* Secrets live in Vault/AWS Secrets Manager; CI reads ephemeral credentials only.
* Logging: redact PHI in logs by default; ensure `audit_log` is stored separately and immutable where required.
* Pen-testing and vulnerability scanning (OWASP ZAP, Snyk) integrated in pipeline.

---

# 16. Migration plan from Go -> TypeScript

A recommended phased migration:

1. **Preparation**

   * Freeze schema changes in Go backend.
   * Add feature parity checklist (endpoints/batch jobs) and tests to capture behavior.
2. **Parallel deployment**

   * Implement TypeScript endpoints in the new backend while leaving Go services running.
   * Use feature flags / API gateway routing to route specific endpoints to new backend.
3. **Data parity tests**

   * Run side-by-side tests for identical requests to ensure responses and DB writes match.
4. **Cutover**

   * Route clients to new backend incrementally (e.g., read-only endpoints first).
   * Monitor logs/metrics and rollback plan ready.
5. **Retire Go services**

   * Once stable, remove Go codebase and update docs.

---

# 17. Detailed backend-to-frontend contract notes

* **Auth tokens**: backend sets HTTP-only Secure cookie `access_token`; provide `/auth/refresh` endpoint; frontend stores minimal state; use CSRF protection.
* **Pagination**: adopt cursor-based pagination for large lists (e.g., visits, procedures) — provide `nextCursor` and `limit`.
* **Error shape**: standardize error responses:

  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Validation failed",
    "details": { "field": "error" }
  }
  ```
* **FHIR responses**: FHIR endpoints return `application/fhir+json` with proper content-type header.

---

# 18. Updated API & File structure (full listing for backend, required by you)

Below is a **complete** expanded backend file tree with key files and short descriptions (repeat of the earlier tree but now with explicit file-by-file notes; no shortcuts):

```
backend/
├─ README.md                     # how to run, env variables, setup Postgres, Prisma, MinIO
├─ package.json                  # scripts: start, build, prisma:migrate, prisma:seed, test, lint
├─ tsconfig.json
├─ nest-cli.json
├─ prisma/
│  ├─ schema.prisma              # full schema (concept, person, users, roles, visit, procedure, drug_exposure, document)
│  ├─ seed.ts                    # seed roles/users
│  └─ migrations/                 # prisma migration folders
├─ src/
│  ├─ main.ts                    # bootstrap Nest app, global pipes, Swagger setup
│  ├─ app.module.ts              # import modules, configuration
│  ├─ config/
│  │  ├─ configuration.ts        # env schema
│  │  └─ config.module.ts
│  ├─ infra/
│  │  ├─ prisma/
│  │  │  └─ prisma.service.ts    # Prisma service wrapper
│  │  ├─ redis.service.ts
│  │  └─ queue.service.ts
│  ├─ common/
│  │  ├─ dto/
│  │  │  └─ pagination.dto.ts
│  │  ├─ decorators/
│  │  │  └─ permissions.decorator.ts
│  │  ├─ guards/
│  │  │  ├─ jwt-auth.guard.ts
│  │  │  └─ permissions.guard.ts
│  │  ├─ interceptors/
│  │  │  └─ metrics.interceptor.ts
│  │  ├─ pipes/
│  │  │  └─ validation.pipe.ts
│  │  └─ filters/
│  │     └─ http-exception.filter.ts
│  ├─ auth/
│  │  ├─ auth.module.ts
│  │  ├─ auth.controller.ts      # /auth/login, /auth/register, /auth/refresh, /auth/logout
│  │  ├─ auth.service.ts
│  │  ├─ strategies/
│  │  │  ├─ jwt.strategy.ts
│  │  │  └─ local.strategy.ts
│  │  └─ dto/
│  │     ├─ login.dto.ts
│  │     └─ register.dto.ts
│  ├─ users/
│  │  ├─ users.module.ts
│  │  ├─ users.controller.ts     # Admin routes: get/list/create/update/delete users
│  │  ├─ users.service.ts
│  │  └─ repositories/
│  │     └─ users.repository.ts
│  ├─ roles/
│  │  ├─ roles.module.ts
│  │  ├─ roles.controller.ts
│  │  └─ roles.service.ts
│  ├─ people/
│  │  ├─ people.module.ts
│  │  ├─ people.controller.ts   # patient/doctor person endpoints (create/update/view)
│  │  └─ people.service.ts
│  ├─ visits/
│  │  ├─ visits.module.ts
│  │  ├─ visits.controller.ts   # /api/v1/visits
│  │  ├─ visits.service.ts
│  │  └─ repositories/visits.repository.ts
│  ├─ procedures/
│  │  ├─ procedures.module.ts
│  │  ├─ procedures.controller.ts
│  │  └─ procedures.service.ts
│  ├─ medications/
│  │  ├─ medications.module.ts
│  │  ├─ medications.controller.ts
│  │  └─ medications.service.ts
│  ├─ documents/
│  │  ├─ documents.module.ts
│  │  ├─ documents.controller.ts  # upload metadata + presign endpoints
│  │  └─ documents.service.ts
│  ├─ terminology/
│  │  ├─ terminology.module.ts
│  │  ├─ terminology.service.ts
│  │  ├─ adapters/
│  │  │  └─ ontoserver.adapter.ts
│  │  └─ importers/
│  ├─ fhir/
│  │  ├─ fhir.module.ts
│  │  ├─ fhir.controller.ts     # /fhir/Patient/:id, /fhir/Encounter/:id, etc.
│  │  └─ fhir.mapper.ts
│  ├─ messaging/
│  │  ├─ messaging.module.ts
│  │  ├─ messaging.controller.ts
│  │  └─ messaging.service.ts
│  ├─ reports/
│  │  ├─ reports.module.ts
│  │  └─ reports.service.ts
│  └─ telemetry/
│     ├─ telemetry.module.ts
│     └─ otel.interceptor.ts
├─ scripts/
│  ├─ start-local.sh
│  └─ seed-roles.ts
├─ Dockerfile
└─ docker-compose.yml
```

---

# 19. Migrations and DB scripts

* Use `prisma migrate dev` for dev and `prisma migrate deploy` for CI/CD deployments.
* Provide SQL seeds for roles and critical system admin account.
* Backfill scripts for importing OMOP vocabularies run as controlled batch jobs (run via `scripts/terminology-import.ts` using BullMQ).

---

# 20. Testing & Quality gates (CI details)

* **Lint**: ESLint (TypeScript config), Prettier formatting
* **Type-check**: `tsc --noEmit`
* **Unit tests**: Jest coverage threshold (e.g., 80%) enforced
* **Integration**: job runs database migrations and runs the integration suite against ephemeral DB (Docker)
* **Security**: run `npm audit`, Snyk or Dependabot; fail pipeline if critical vulnerabilities exist
* **OpenAPI**: run a contract test to confirm generated docs vs controllers stay in sync

---

# 21. Developer experience & onboarding

* `./backend/README.md` includes:

  * environment variables template `.env.example`
  * commands:

    * `pnpm install` or `npm ci`
    * `pnpm prisma:migrate:dev`
    * `pnpm start:dev` (nodemon)
    * `pnpm test`
  * how to seed roles and admin user
  * how to run local stack via `docker-compose` (postgres, redis, minio)

---

# 22. Deliverables (what to produce next)

1. **Full Prisma schema** (complete OMOP + vocab tables) — extend the representative schema above into production-ready.
2. **NestJS module skeletons** for each module above (controllers, services, DTOs) with unit tests scaffolding.
3. **Prisma migrations** to create primary tables (`users`, `roles`, `person`, `visit_occurrence`, `procedure_occurrence`, `drug_exposure`, `document`).
4. **Dockerfile** + `docker-compose.yml` for local dev.
5. **CI pipelines** (GitHub Actions YAMLs).
6. **API Swagger** bootstrapped via NestJS Swagger module.
7. **Migration strategy doc** to co-run Go and TS backends for cutover.

---

# 23. Example code snippets (short, illustrative)

**Example: `permissions.decorator.ts`**

```ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

**Example: `permissions.guard.ts` (outline)**

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private permissionService: PermissionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required || required.length === 0) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    return this.permissionService.hasPermissions(user.id, required);
  }
}
```

---

# 24. Risks & mitigations

* **Risk**: Large OMOP vocabulary import time.
  **Mitigation**: run import in dedicated job workers, store in separate schema, use bulk COPY operations, utilize read-replicas for serving.
* **Risk**: Cutover complexity from Go → TS.
  **Mitigation**: parallel run, end-to-end contract tests, gradual traffic routing via API gateway.
* **Risk**: Type drift between Prisma models and actual DB.
  **Mitigation**: enforce `prisma generate` + `prisma migrate` on CI; include migration checks in pipeline.
* **Risk**: Performance regressions.
  **Mitigation**: benchmarking (k6), profiling Prisma queries; tune connection pool; add caching.

---

# 25. Next steps (practical, action-oriented)

1. Approve the TypeScript/NestJS + Prisma stack decision (if yes, proceed).
2. I will (if you want me to produce code):

   * generate `prisma/schema.prisma` full version for all tables you specified;
   * scaffold NestJS modules, controllers, services and sample tests; **or**
   * produce exact `Dockerfile`, `docker-compose.yml` and GitHub Actions YAML for the backend.
3. Decide whether to keep Go services running during cutover (recommended).
4. Provide credentials or environment conventions for CI/CD + secrets manager selection.

---

If you want, I can now:

* generate the **full** `prisma/schema.prisma` (complete OMOP subset you provided) and initial Prisma migrations, **and**
* scaffold the NestJS backend files (controllers/services/DTOs/guards) with example implementations and tests.

Tell me which of those two (or both) you want first and I’ll produce the files (Prisma schema + migrations, or the NestJS scaffold) in this conversation.


# 30. Continued: Database & Migration Strategy (Postgres-first, no Prisma)

## 30.1 Migration tooling options (choose one)

* **Recommended (production-proven):** Flyway or Liquibase — SQL-first migrations, simple rollbacks/versions.
* **Node-friendly alternative:** `node-pg-migrate` (javascript/SQL migrations), migrations stored in `/migrations`.
* **Why not Prisma:** you wanted direct control of SQL, large OMOP vocabulary loads, and pre-existing SQL assets. Flyway/Liquibase are ideal.

## 30.2 Migration directory layout (example)

```
infra/
└─ migrations/
   ├─ V000__create_roles_users.sql
   ├─ V001__create_person_table.sql
   ├─ V002__create_visit_occurrence.sql
   ├─ V003__create_procedure_occurrence.sql
   ├─ V004__create_drug_exposure.sql
   ├─ V005__create_document_table.sql
   ├─ V006__create_concept_tables.sql
   └─ V010__seed_roles_and_permissions.sql
```

## 30.3 Example SQL (production-ready patterns)

### Create roles & users (canonical)

```sql
-- V000__create_roles_users.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  role_id INT NOT NULL REFERENCES roles(role_id),
  permission_id INT NOT NULL REFERENCES permissions(permission_id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
```

### Person table (OMOP-light)

```sql
-- V001__create_person_table.sql
CREATE TABLE IF NOT EXISTS person (
  person_id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE,           -- link optional
  gender_concept_id INT NOT NULL,
  year_of_birth INT NOT NULL,
  month_of_birth INT,
  day_of_birth INT,
  birth_datetime TIMESTAMP WITH TIME ZONE,
  race_concept_id INT,
  ethnicity_concept_id INT,
  person_source_value VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_person_user_id ON person(user_id);
```

### Document metadata

```sql
-- V005__create_document_table.sql
CREATE TABLE IF NOT EXISTS document (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  patient_person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT,
  content_type VARCHAR(100),
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES users(user_id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_document_owner ON document(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_document_patient ON document(patient_person_id);
```

## 30.4 Bulk vocabulary import (OMOP concepts)

* Use `COPY` from CSV into `concept`, `concept_relationship` etc. — fast and memory efficient.
* Run import jobs on staging batch workers (dedicated DB user, disable foreign keys during import if necessary, then re-enable and analyze).
* Consider `pg_partman` for very large vocab tables or separate schema (`vocabulary.*`) read replica.

---

# 31. Backend Implementation Patterns (Node.js + TypeScript; no Prisma)

## 31.1 DB access stack choices

* `node-postgres (pg)` - low-level and battle-tested
* `slonik` - safer SQL string handling and type-friendly
* `pg-promise` - convenient helpers
* **Recommendation:** `slonik` for safer SQL templating + pools, or `pg` if team prefers raw queries.

## 31.2 Repository pattern (example)

* Each module has a repository that receives a `Pool` or `Slonik` connection and exposes typed functions.

Example `users.repository.ts` (with `pg`):

```ts
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

export class UsersRepository {
  constructor(private pool: Pool) {}

  async createUser({ username, email, password, role_id }): Promise<any> {
    const password_hash = await bcrypt.hash(password, 12);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query(
        `INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING *`,
        [username, password_hash, email]
      );
      const uid = userRes.rows[0].user_id;
      if (role_id) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
          [uid, role_id]
        );
      }
      await client.query('COMMIT');
      return userRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findByUsername(username: string) {
    const res = await this.pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    return res.rows[0] || null;
  }
}
```

## 31.3 Transactions

* Use explicit `BEGIN`/`COMMIT`/`ROLLBACK` per multi-step operations (admission + create visit + assign bed + billing).
* For large multi-step business logic, consider database advisory locks (Postgres `pg_advisory_lock`) to prevent race conditions (e.g., generating sequential MRNs or Visit Numbers).

## 31.4 SQL Helpers

* Provide a `sql` helper module with parameterized query builders and a uniform error mapping layer to standardize DB exceptions into HTTP errors.

---

# 32. API Contracts — concrete examples (request/response)

Below are canonical examples for important endpoints. Use these as exact contracts to implement clients and tests.

### 32.1 Login

**POST** `/api/v1/auth/login`
Request:

```json
{
  "username": "jane.doe",
  "password": "secret-password"
}
```

Response (200):

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<refresh-token>",
  "user": {
    "user_id": "uuid-...",
    "username": "jane.doe",
    "email": "jane@hospital.org",
    "roles": ["Receptionist"]
  }
}
```

### 32.2 Create patient

**POST** `/api/v1/patients` (Receptionist / Self-register)
Request:

```json
{
  "first_name": "John",
  "last_name": "Smith",
  "dob": "1980-05-05",
  "gender_concept_id": 8507,
  "contact": {
    "phone": "+1-555-555-5555",
    "email": "john@example.com"
  },
  "payers": {
    "type": "cash"
  }
}
```

Response (201):

```json
{
  "person_id": 123,
  "mrn": "MRN-2025-000123",
  "created_at": "2025-11-13T12:34:56Z"
}
```

### 32.3 Create outpatient visit

**POST** `/api/v1/visits`
Request:

```json
{
  "person_id": 123,
  "visit_type": "OPD",
  "visit_start": "2025-11-14T09:00:00Z",
  "department_id": 5,
  "provider_id": "uuid-doctor-1",
  "reason": "GENERAL_CHECKUP"
}
```

Response (201):

```json
{
  "visit_occurrence_id": 987,
  "visit_number": "V-2025-000987",
  "created_at": "2025-11-14T09:00:00Z"
}
```

### 32.4 Prescribe medication

**POST** `/api/v1/prescriptions`
Request:

```json
{
  "patient_id": 123,
  "doctor_id": "uuid-doctor-1",
  "items": [
    {
      "medication_id": 456,
      "medication_code": "RXN:12345",
      "dose": "500 mg",
      "route": "oral",
      "frequency": "BID",
      "duration_days": 7,
      "instructions": "Take after meals"
    }
  ],
  "notes": "Start antibiotic"
}
```

Response (201):

```json
{
  "prescription_id": 5555,
  "status": "active",
  "created_at": "2025-11-14T09:15:00Z"
}
```

---

# 33. Role & Permission Matrix (sample)

Provide a canonical list of permissions (strings) that your `permissions` table will host. Controllers use `@Permissions('prescription.create')` style metadata.

Examples:

* `user.create`, `user.read`, `user.update`, `user.delete`
* `patient.create`, `patient.read`, `patient.update`, `patient.delete`
* `visit.create`, `visit.read`, `visit.update`, `visit.delete`
* `prescription.create`, `prescription.read`, `prescription.fill`
* `inventory.manage`, `inventory.view`
* `billing.create`, `billing.read`, `payment.record`
* `document.upload`, `document.read`, `document.delete`
* `fhir.read`, `fhir.write` (if you allow writing via FHIR)
* `reports.view`, `audit.view`

Map roles to permissions in `role_permissions`. Seed initial roles: `Admin`, `Doctor`, `Nurse`, `Receptionist`, `Pharmacist`, `Patient`.

---

# 34. Security Details & PHI Handling

* **Transport:** TLS 1.2+; HSTS; secure cookies (HttpOnly, SameSite=Strict for session); prefer JWT in HttpOnly cookies.
* **PHI minimization in logs:** redact fields like `ssn`, `full_medical_notes` from standard logs; write full audit entries to `audit_log` with proper encryption at rest.
* **Encryption at rest:** enable DB-level encryption (cloud-managed disk encryption) and S3 server-side encryption for files.
* **Access controls:** database roles and least-privilege for service accounts; use separate DB users for app vs admin.
* **Audit trail:** insert records for read/write actions: `audit_log (id, user_id, action, resource_type, resource_id, details_json, created_at)`.
* **Retention & deletion:** implement data retention policies with scheduled jobs and soft-delete semantics (e.g., `deleted_at`), plus legal hold support.

---

# 35. Observability & Production Ops (concise checklist)

* Logs: JSON-structured logs with `request_id`, `user_id` (when present), `route`, `status`.
* Metrics: Expose Prometheus metrics (request latency, DB pool usage, job queue length).
* Tracing: OpenTelemetry instrument critical flows (auth, prescription, billing).
* Backups: Daily DB backups; weekly full exports of vocabulary tables; S3 lifecycle + versioning.
* Alerts: DB connection pool exhaustion, queue backlog > threshold, error-rate spikes.

---

# 36. Developer Onboarding & Commands (local dev)

**Local stack (recommended):**

* Postgres, Redis, MinIO (or local S3 mock), and optional mailhog.

**Example `docker-compose.yml` (dev):**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    env_file: .env
    environment:
      POSTGRES_DB: hospital
      POSTGRES_USER: hospital
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]
    volumes:
      - db-data:/var/lib/postgresql/data
  redis:
    image: redis:7
    ports: ["6379:6379"]
  minio:
    image: minio/minio
    command: server /data
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123
    ports: ["9000:9000"]
volumes:
  db-data:
```

**Dev scripts (package.json snippets)**

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/main.ts",
    "migrate": "flyway -url=jdbc:postgresql://localhost:5432/hospital -user=... -password=... migrate",
    "seed": "node ./scripts/seed_roles.js",
    "test": "jest --runInBand",
    "lint": "eslint 'src/**/*.ts' --fix"
  }
}
```

**Local setup steps**

1. `git clone ...`
2. `cp .env.example .env` and fill DB/S3/Redis creds
3. `docker compose up -d`
4. `npm ci`
5. `npm run migrate` (run Flyway/Liquibase)
6. `npm run seed`
7. `npm run dev`

---

# 37. Suggested File & Repo Structure (updated, no Prisma)

```
patient-ms-monorepo/
├─ backend/
│  ├─ README.md
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ src/
│  │  ├─ main.ts
│  │  ├─ app.module.ts
│  │  ├─ config/
│  │  │  └─ configuration.ts
│  │  ├─ infra/
│  │  │  ├─ db/
│  │  │  │  └─ pool.ts               # pg Pool wrapper
│  │  │  ├─ migrations/               # SQL folder for dev reference
│  │  │  └─ s3.service.ts
│  │  ├─ common/
│  │  ├─ auth/
│  │  ├─ users/
│  │  │  ├─ users.controller.ts
│  │  │  ├─ users.service.ts
│  │  │  └─ users.repository.ts      # raw SQL queries
│  │  ├─ patients/
│  │  ├─ visits/
│  │  ├─ medications/
│  │  ├─ pharmacy/
│  │  ├─ billing/
│  │  ├─ documents/
│  │  ├─ fhir/
│  │  └─ jobs/
│  ├─ scripts/
│  │  └─ seed_roles.js
│  ├─ dockerfile
│  └─ docker-compose.yml
├─ infra/
│  └─ migrations/                     # production migrations: Flyway / Liquibase
├─ frontend/
│  └─ <your existing frontend tree>
└─ .github/workflows/
```

---

# 38. Next concrete deliverables (I can produce now in this conversation)

I can produce any of these next items immediately — tell me which(s) you want and I will output them in this chat (no waiting):

1. Complete, ready-to-run SQL migration files for core schema (roles, users, person, visit_occurrence, procedure_occurrence, drug_exposure, document, concept tables) using Flyway-style `V###__description.sql` files.
2. A NestJS backend scaffold (controllers/services/repositories) that uses `pg` or `slonik` with sample endpoints and tests for: auth, patients, visits, prescriptions, documents.
3. Detailed endpoint OpenAPI YAML (Swagger) for all endpoints listed in Section 26 (full contract).
4. Seed scripts: `seed_roles.sql` + node `seed_roles.js` to create default roles and permissions.
5. Example stored procedures/triggers for MRN/Visit number generation with advisory locks to avoid collisions.

(If you want more than one, say which numbered items. If you prefer, I’ll start with 1: the full SQL migration files.)

---

# 39. Summary of what I changed/added

* Persisted your preference to use Postgres (no Prisma) to memory.
* Incorporated your old Hospital Management TDD and extended it — added:

  * Complete endpoint catalogue (mapped to the earlier OMOP-on-FHIR design).
  * Postgres-first migration strategy and sample SQL.
  * Repository patterns using `pg`/`slonik`.
  * Sample API contracts and request/response examples.
  * File structure for a NestJS + PostgreSQL backend without Prisma.
  * Developer onboarding commands and docker-compose dev stack.
  * Security, audits, and operational notes tailored for PHI/HIPAA.
* Gave explicit next-step deliverables I can produce instantly in this chat.

---

If you want me to generate any of the deliverables in **Section 38** now, say the item numbers (e.g., “Do 1 and 4”), and I’ll produce them in this conversation. If you'd prefer I start with the full SQL migrations (recommended), I’ll drop them right here.
