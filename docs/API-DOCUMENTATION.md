# Hospital Management System - API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api/v1`  
**API Documentation (Swagger):** `http://localhost:3000/api/docs`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Common Patterns](#common-patterns)
3. [Health & Status](#health--status)
4. [Authentication Endpoints](#authentication-endpoints)
5. [User Management](#user-management)
6. [Patient Management](#patient-management)
7. [Visit Management](#visit-management)
8. [Medication Management](#medication-management)
9. [Procedure Management](#procedure-management)
10. [Document Management](#document-management)
11. [Terminology Services](#terminology-services)
11. [FHIR Resources](#fhir-resources)
12. [Reports](#reports)
13. [Error Handling](#error-handling)
14. [Permissions & Authorization](#permissions--authorization)

---

## Authentication

All endpoints (except health checks and authentication) require JWT authentication.

### Authentication Header

```
Authorization: Bearer <access_token>
```

### Token Flow

1. **Login** → Receive `accessToken` and `refreshToken`
2. **Use `accessToken`** → Include in `Authorization` header for API calls
3. **Token Expires** → Use `refreshToken` to get new `accessToken`
4. **Logout** → Revoke refresh tokens

---

## Common Patterns

### Pagination

Most list endpoints support cursor-based pagination:

**Query Parameters:**
- `limit` (optional): Number of items per page (max 100, default 20)
- `cursor` (optional): Base64-encoded cursor for next page

**Response Format:**
```json
{
  "items": [...],
  "nextCursor": "eyJwZXJzb25faWQiOjEyM30="
}
```

**Example:**
```bash
GET /api/v1/patients?limit=20
GET /api/v1/patients?limit=20&cursor=eyJwZXJzb25faWQiOjEyM30=
```

### Date Formats

- **Date strings:** `YYYY-MM-DD` (e.g., `2024-01-15`)
- **DateTime strings:** ISO 8601 format (e.g., `2024-01-15T10:00:00Z`)

### Gender Concept IDs

Common OMOP gender concept IDs:
- `8507` - Male
- `8532` - Female

### Visit Types

- `OPD` - Outpatient Department
- `IPD` - Inpatient Department
- `ER` - Emergency Room

---

## Health & Status

### GET `/health`

Liveness probe - checks if service is running.

**Authentication:** None

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

### GET `/ready`

Readiness probe - checks database connectivity and migrations.

**Authentication:** None

**Response (200):**
```json
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Response (503):**
```json
{
  "status": "not_ready",
  "database": "disconnected",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## Authentication Endpoints

### POST `/auth/login`

Authenticate user and receive access tokens.

**Authentication:** None  
**Rate Limit:** 5 attempts per minute

**Request Body:**
```json
{
  "username": "admin",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "expiresIn": 900,
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "email": "admin@hospital.com",
    "roles": ["Admin"]
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `423` - Account locked (too many failed attempts)

---

### POST `/auth/refresh`

Refresh access token using refresh token.

**Authentication:** None  
**Rate Limit:** 10 attempts per minute

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "b2c3d4e5f6g7...",
  "expiresIn": 900
}
```

**Error Responses:**
- `401` - Invalid or expired refresh token

---

### POST `/auth/logout`

Logout and revoke refresh token(s).

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "allDevices": false
}
```

**Response (204):** No content

**Error Responses:**
- `401` - Unauthorized

---

### GET `/auth/me`

Get current authenticated user information.

**Authentication:** Required (JWT)

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "admin",
  "email": "admin@hospital.com",
  "roles": ["Admin"]
}
```

**Error Responses:**
- `401` - Unauthorized

---

## User Management

**Base Path:** `/users`  
**Required Permissions:** See individual endpoints

### POST `/users`

Create a new user.

**Authentication:** Required  
**Permission:** `user.create`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role_ids": [2, 3]
}
```

**Response (201):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john@example.com",
  "active": true,
  "roles": ["Doctor", "Nurse"],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Username or email already exists
- `403` - Insufficient permissions

---

### GET `/users`

List users with pagination and filters.

**Authentication:** Required  
**Permission:** `user.read`

**Query Parameters:**
- `limit` (optional): Items per page (max 100)
- `cursor` (optional): Pagination cursor
- `role` (optional): Filter by role name
- `active` (optional): Filter by active status (`true`/`false`)
- `search` (optional): Search username or email

**Example:**
```bash
GET /api/v1/users?role=Doctor&active=true&limit=20&search=john
```

**Response (200):**
```json
{
  "items": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "email": "john@example.com",
      "active": true,
      "roles": ["Doctor"],
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "nextCursor": "eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMVQwMDowMDowMC4wMDBaIn0="
}
```

---

### GET `/users/roles`

Get all available roles.

**Authentication:** Required  
**Permission:** `user.read`

**Response (200):**
```json
[
  {
    "role_id": 1,
    "role_name": "Admin",
    "description": "System administrator"
  },
  {
    "role_id": 2,
    "role_name": "Doctor",
    "description": "Clinician"
  }
]
```

---

### GET `/users/:id`

Get user by ID.

**Authentication:** Required  
**Permission:** `user.read`

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john@example.com",
  "active": true,
  "roles": ["Doctor"],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**
- `404` - User not found

---

### PATCH `/users/:id`

Update user.

**Authentication:** Required  
**Permission:** `user.update`

**Request Body (all fields optional):**
```json
{
  "email": "newemail@example.com",
  "password": "NewSecurePassword123!",
  "roles": [2, 3],
  "active": false
}
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "newemail@example.com",
  "active": false,
  "roles": ["Doctor", "Nurse"],
  "updated_at": "2024-01-15T11:00:00Z"
}
```

**Error Responses:**
- `400` - Validation error
- `404` - User not found
- `409` - Email already exists

---

### DELETE `/users/:id`

Delete user (soft delete by default).

**Authentication:** Required  
**Permission:** `user.delete`

**Query Parameters:**
- `hard` (optional): Hard delete if `true` (default: `false`)

**Example:**
```bash
DELETE /api/v1/users/550e8400-e29b-41d4-a716-446655440000?hard=true
```

**Response (204):** No content

**Error Responses:**
- `404` - User not found

---

## Patient Management

**Base Path:** `/patients`  
**Required Permissions:** See individual endpoints

### POST `/patients`

Create a new patient.

**Authentication:** Required  
**Permission:** `patient.create`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1980-05-15",
  "gender_concept_id": 8507,
  "race_concept_id": 8527,
  "ethnicity_concept_id": 38003564,
  "contact": {
    "phone": "+1234567890",
    "email": "john.doe@example.com"
  },
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201):**
```json
{
  "person_id": 123,
  "first_name": "John",
  "last_name": "Doe",
  "gender_concept_id": 8507,
  "year_of_birth": 1980,
  "month_of_birth": 5,
  "day_of_birth": 15,
  "mrn": "MRN-2024-000123",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**
- `400` - Validation error
- `409` - User already linked to another patient
- `403` - Insufficient permissions

---

### GET `/patients`

Search patients with filters.

**Authentication:** Required  
**Permission:** `patient.read`

**Query Parameters:**
- `limit` (optional): Items per page (max 100)
- `cursor` (optional): Pagination cursor
- `search` (optional): Search by name or MRN
- `dob` (optional): Filter by date of birth (YYYY-MM-DD)
- `gender_concept_id` (optional): Filter by gender concept ID

**Example:**
```bash
GET /api/v1/patients?search=John&limit=20
```

**Response (200):**
```json
{
  "items": [
    {
      "person_id": 123,
      "first_name": "John",
      "last_name": "Doe",
      "gender_concept_id": 8507,
      "year_of_birth": 1980,
      "mrn": "MRN-2024-000123",
      "contact": {
        "phone": "+1234567890",
        "email": "john.doe@example.com"
      }
    }
  ],
  "nextCursor": "eyJwZXJzb25faWQiOjEyM30="
}
```

---

### GET `/patients/mrn/:mrn`

Get patient by Medical Record Number (MRN).

**Authentication:** Required  
**Permission:** `patient.read`

**Response (200):**
```json
{
  "person_id": 123,
  "first_name": "John",
  "last_name": "Doe",
  "gender_concept_id": 8507,
  "year_of_birth": 1980,
  "month_of_birth": 5,
  "day_of_birth": 15,
  "mrn": "MRN-2024-000123",
  "contact": {
    "phone": "+1234567890",
    "email": "john.doe@example.com"
  }
}
```

**Error Responses:**
- `404` - Patient not found

---

### GET `/patients/:person_id`

Get patient by person ID.

**Authentication:** Required  
**Permission:** `patient.read`

**Response (200):** Same as GET `/patients/mrn/:mrn`

**Error Responses:**
- `404` - Patient not found

---

### PATCH `/patients/:person_id`

Update patient.

**Authentication:** Required  
**Permission:** `patient.update`

**Request Body (all fields optional):**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "contact": {
    "phone": "+1987654321",
    "email": "jane.smith@example.com"
  }
}
```

**Response (200):**
```json
{
  "person_id": 123,
  "first_name": "Jane",
  "last_name": "Smith",
  "gender_concept_id": 8507,
  "year_of_birth": 1980,
  "mrn": "MRN-2024-000123",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

**Error Responses:**
- `400` - Validation error
- `404` - Patient not found

---

## Visit Management

**Base Path:** `/visits`  
**Required Permissions:** See individual endpoints

### POST `/visits`

Create a new visit.

**Authentication:** Required  
**Permission:** `visit.create`

**Request Body:**
```json
{
  "person_id": 123,
  "visit_type": "OPD",
  "visit_start": "2024-01-15T10:00:00Z",
  "visit_end": "2024-01-15T11:00:00Z",
  "department_id": 5,
  "provider_id": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "Routine checkup"
}
```

**Response (201):**
```json
{
  "visit_occurrence_id": 456,
  "person_id": 123,
  "visit_type": "OPD",
  "visit_number": "VIS-2024-000456",
  "visit_start": "2024-01-15T10:00:00Z",
  "visit_end": "2024-01-15T11:00:00Z",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Overlapping inpatient visit exists
- `403` - Insufficient permissions

---

### GET `/visits`

Search visits with filters.

**Authentication:** Required  
**Permission:** `visit.read`

**Query Parameters:**
- `limit` (optional): Items per page (max 100)
- `cursor` (optional): Pagination cursor
- `person_id` (optional): Filter by patient ID
- `provider_id` (optional): Filter by provider UUID
- `type` (optional): Filter by visit type (`OPD`, `IPD`, `ER`)
- `date_from` (optional): Filter visits from date (ISO 8601)
- `date_to` (optional): Filter visits to date (ISO 8601)

**Example:**
```bash
GET /api/v1/visits?person_id=123&type=OPD&date_from=2024-01-01T00:00:00Z
```

**Response (200):**
```json
{
  "items": [
    {
      "visit_occurrence_id": 456,
      "person_id": 123,
      "visit_type": "OPD",
      "visit_number": "VIS-2024-000456",
      "visit_start": "2024-01-15T10:00:00Z",
      "visit_end": "2024-01-15T11:00:00Z"
    }
  ],
  "nextCursor": "eyJ2aXNpdF9vY2N1cnJlbmNlX2lkIjo0NTZ9"
}
```

---

### GET `/visits/active-inpatient/:person_id`

Get active inpatient visits for a patient.

**Authentication:** Required  
**Permission:** `visit.read`

**Response (200):**
```json
[
  {
    "visit_occurrence_id": 456,
    "person_id": 123,
    "visit_type": "IPD",
    "visit_start": "2024-01-15T10:00:00Z",
    "visit_end": null
  }
]
```

---

### GET `/visits/visit-number/:visit_number`

Get visit by visit number.

**Authentication:** Required  
**Permission:** `visit.read`

**Response (200):** Same format as GET `/visits/:id`

**Error Responses:**
- `404` - Visit not found

---

### GET `/visits/:id`

Get visit by ID.

**Authentication:** Required  
**Permission:** `visit.read`

**Response (200):**
```json
{
  "visit_occurrence_id": 456,
  "person_id": 123,
  "visit_type": "OPD",
  "visit_number": "VIS-2024-000456",
  "visit_start": "2024-01-15T10:00:00Z",
  "visit_end": "2024-01-15T11:00:00Z"
}
```

**Error Responses:**
- `404` - Visit not found

---

### PATCH `/visits/:id`

Update visit.

**Authentication:** Required  
**Permission:** `visit.update`

**Request Body (all fields optional):**
```json
{
  "visit_end": "2024-01-15T12:00:00Z",
  "reason": "Extended consultation"
}
```

**Response (200):**
```json
{
  "visit_occurrence_id": 456,
  "visit_end": "2024-01-15T12:00:00Z",
  "reason": "Extended consultation",
  "updated_at": "2024-01-15T11:30:00Z"
}
```

**Error Responses:**
- `400` - Validation error
- `404` - Visit not found
- `409` - Overlapping inpatient visit exists

---

## Medication Management

**Base Path:** `/medications`  
**Required Permissions:** See individual endpoints

### POST `/medications`

Create a new medication (drug exposure).

**Authentication:** Required  
**Permission:** `medication.create`

**Request Body:**
```json
{
  "person_id": 123,
  "visit_occurrence_id": 456,
  "drug_concept_id": 19019073,
  "drug_exposure_start_date": "2024-01-15",
  "drug_exposure_end_date": "2024-01-22",
  "quantity": 30,
  "refills": 1
}
```

**Response (201):**
```json
{
  "drug_exposure_id": 789,
  "person_id": 123,
  "visit_occurrence_id": 456,
  "drug_concept_id": 19019073,
  "drug_exposure_start_date": "2024-01-15",
  "drug_exposure_end_date": "2024-01-22",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### GET `/medications`

Search medications with filters.

**Authentication:** Required  
**Permission:** `medication.read`

**Query Parameters:**
- `limit` (optional): Items per page (max 100)
- `cursor` (optional): Pagination cursor
- `person_id` (optional): Filter by patient ID
- `visit_occurrence_id` (optional): Filter by visit ID
- `date_from` (optional): Filter medications from date (ISO 8601)
- `date_to` (optional): Filter medications to date (ISO 8601)

**Response (200):**
```json
{
  "items": [
    {
      "drug_exposure_id": 789,
      "person_id": 123,
      "drug_concept_id": 19019073,
      "drug_exposure_start_date": "2024-01-15",
      "drug_exposure_end_date": "2024-01-22"
    }
  ],
  "nextCursor": "eyJkcnVnX2V4cG9zdXJlX2lkIjo3ODl9"
}
```

---

### GET `/medications/:id`

Get medication by ID.

**Authentication:** Required  
**Permission:** `medication.read`

**Response (200):** Same format as POST response

**Error Responses:**
- `404` - Medication not found

---

### PATCH `/medications/:id`

Update medication.

**Authentication:** Required  
**Permission:** `medication.update`

**Request Body (all fields optional):**
```json
{
  "drug_exposure_end_date": "2024-01-25",
  "quantity": 60
}
```

**Response (200):** Updated medication object

**Error Responses:**
- `400` - Validation error
- `404` - Medication not found

---

## Procedure Management

**Base Path:** `/procedures`  
**Required Permissions:** See individual endpoints

### POST `/procedures`

Create a new procedure.

**Authentication:** Required  
**Permission:** `procedure.create`

**Request Body:**
```json
{
  "person_id": 123,
  "visit_occurrence_id": 456,
  "procedure_concept_id": 2000001,
  "procedure_date": "2024-01-15",
  "procedure_type_concept_id": 38000268
}
```

**Response (201):**
```json
{
  "procedure_occurrence_id": 101,
  "person_id": 123,
  "visit_occurrence_id": 456,
  "procedure_concept_id": 2000001,
  "procedure_date": "2024-01-15",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### GET `/procedures`

Search procedures with filters.

**Authentication:** Required  
**Permission:** `procedure.read`

**Query Parameters:**
- `limit` (optional): Items per page (max 100)
- `cursor` (optional): Pagination cursor
- `person_id` (optional): Filter by patient ID
- `visit_occurrence_id` (optional): Filter by visit ID
- `date_from` (optional): Filter procedures from date (ISO 8601)
- `date_to` (optional): Filter procedures to date (ISO 8601)

**Response (200):**
```json
{
  "items": [
    {
      "procedure_occurrence_id": 101,
      "person_id": 123,
      "procedure_concept_id": 2000001,
      "procedure_date": "2024-01-15"
    }
  ],
  "nextCursor": "eyJwcm9jZWR1cmVfb2NjdXJyZW5jZV9pZCI6MTAxfQ=="
}
```

---

### GET `/procedures/:id`

Get procedure by ID.

**Authentication:** Required  
**Permission:** `procedure.read`

**Response (200):** Same format as POST response

**Error Responses:**
- `404` - Procedure not found

---

### PATCH `/procedures/:id`

Update procedure.

**Authentication:** Required  
**Permission:** `procedure.update`

**Request Body (all fields optional):**
```json
{
  "procedure_date": "2024-01-16"
}
```

**Response (200):** Updated procedure object

**Error Responses:**
- `400` - Validation error
- `404` - Procedure not found

---

## Document Management

**Base Path:** `/documents`  
**Required Permissions:** See individual endpoints

### POST `/documents/presign`

Get presigned URL for file upload.

**Authentication:** Required  
**Permission:** `document.upload`

**Request Body:**
```json
{
  "filename": "medical-report.pdf",
  "content_type": "application/pdf",
  "patient_person_id": 123
}
```

**Response (200):**
```json
{
  "upload_id": "550e8400-e29b-41d4-a716-446655440000",
  "presigned_url": "https://minio.example.com/bucket/file?signature=...",
  "expires_in": 3600
}
```

---

### POST `/documents/confirm`

Confirm file upload and create document record.

**Authentication:** Required  
**Permission:** `document.upload`

**Request Body:**
```json
{
  "upload_id": "550e8400-e29b-41d4-a716-446655440000",
  "patient_person_id": 123,
  "document_type": "medical_report",
  "description": "Annual checkup report"
}
```

**Response (201):**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "patient_person_id": 123,
  "filename": "medical-report.pdf",
  "document_type": "medical_report",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### GET `/documents`

List documents with filters.

**Authentication:** Required  
**Permission:** `document.read`

**Query Parameters:**
- `limit` (optional): Items per page (max 100)
- `cursor` (optional): Pagination cursor
- `patient_person_id` (optional): Filter by patient ID
- `owner_user_id` (optional): Filter by owner user ID

**Response (200):**
```json
{
  "items": [
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "patient_person_id": 123,
      "filename": "medical-report.pdf",
      "document_type": "medical_report",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "nextCursor": "eyJkb2N1bWVudF9pZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9"
}
```

---

### GET `/documents/:document_id`

Get document by ID with download URL.

**Authentication:** Required  
**Permission:** `document.read`

**Response (200):**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "patient_person_id": 123,
  "filename": "medical-report.pdf",
  "document_type": "medical_report",
  "download_url": "https://minio.example.com/bucket/file?signature=...",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**
- `404` - Document not found

---

### DELETE `/documents/:document_id`

Delete document (soft delete).

**Authentication:** Required  
**Permission:** `document.delete`

**Response (204):** No content

**Error Responses:**
- `404` - Document not found

---

## Terminology Services

**Base Path:** `/terminology`  
**Required Permissions:** `fhir.read`

### GET `/terminology/concepts`

Search concepts with filters.

**Authentication:** Required  
**Permission:** `fhir.read`

**Query Parameters:**
- `q` (optional): Text search query
- `code` (optional): Exact concept code
- `system` (optional): Vocabulary system (`SNOMED`, `ICD10`, `RXNORM`, `LOINC`)
- `vocabulary_id` (optional): Vocabulary ID
- `limit` (optional): Items per page (max 100)
- `cursor` (optional): Pagination cursor

**Example:**
```bash
GET /api/v1/terminology/concepts?q=diabetes&system=SNOMED&limit=20
```

**Response (200):**
```json
{
  "items": [
    {
      "concept_id": 201820,
      "concept_name": "Type 2 diabetes mellitus",
      "concept_code": "44054006",
      "vocabulary_id": "SNOMED",
      "domain_id": "Condition"
    }
  ],
  "nextCursor": "eyJjb25jZXB0X2lkIjoyMDE4MjB9"
}
```

---

### POST `/terminology/concepts/batch`

Batch lookup concepts by IDs or codes.

**Authentication:** Required  
**Permission:** `fhir.read`

**Request Body:**
```json
{
  "concept_ids": [201820, 201821],
  "concept_codes": ["44054006", "73211009"]
}
```

**Response (200):**
```json
[
  {
    "concept_id": 201820,
    "concept_name": "Type 2 diabetes mellitus",
    "concept_code": "44054006",
    "vocabulary_id": "SNOMED"
  }
]
```

---

## FHIR Resources

**Base Path:** `/fhir/R4`  
**Required Permissions:** `fhir.read`  
**Content-Type:** `application/fhir+json`

### GET `/fhir/R4/Patient/:id`

Get FHIR Patient resource by person ID.

**Authentication:** Required  
**Permission:** `fhir.read`

**Query Parameters:**
- `baseUrl` (optional): Base URL for resource references

**Response (200):**
```json
{
  "resourceType": "Patient",
  "id": "123",
  "identifier": [
    {
      "system": "http://hospital.example.com/mrn",
      "value": "MRN-2024-000123"
    }
  ],
  "name": [
    {
      "family": "Doe",
      "given": ["John"]
    }
  ],
  "gender": "male",
  "birthDate": "1980-05-15"
}
```

**Error Responses:**
- `404` - Patient not found

---

### GET `/fhir/R4/Patient`

Search FHIR Patient by identifier (MRN).

**Authentication:** Required  
**Permission:** `fhir.read`

**Query Parameters:**
- `identifier` (optional): MRN identifier
- `baseUrl` (optional): Base URL for resource references

**Example:**
```bash
GET /api/v1/fhir/R4/Patient?identifier=MRN-2024-000123
```

**Response (200):**
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "123",
        "identifier": [
          {
            "system": "http://hospital.example.com/mrn",
            "value": "MRN-2024-000123"
          }
        ]
      }
    }
  ]
}
```

---

### GET `/fhir/R4/Encounter/:id`

Get FHIR Encounter resource by visit ID.

**Authentication:** Required  
**Permission:** `fhir.read`

**Query Parameters:**
- `baseUrl` (optional): Base URL for resource references

**Response (200):**
```json
{
  "resourceType": "Encounter",
  "id": "456",
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "subject": {
    "reference": "Patient/123"
  },
  "period": {
    "start": "2024-01-15T10:00:00Z",
    "end": "2024-01-15T11:00:00Z"
  }
}
```

**Error Responses:**
- `404` - Encounter not found

---

## Reports

**Base Path:** `/reports`  
**Required Permissions:** `reports.view`

### GET `/reports/active-inpatients`

Get active inpatients report.

**Authentication:** Required  
**Permission:** `reports.view`

**Response (200):**
```json
[
  {
    "person_id": 123,
    "first_name": "John",
    "last_name": "Doe",
    "visit_occurrence_id": 456,
    "visit_start": "2024-01-15T10:00:00Z",
    "days_inpatient": 5
  }
]
```

---

### GET `/reports/daily-counts`

Get daily visit counts.

**Authentication:** Required  
**Permission:** `reports.view`

**Query Parameters:**
- `date_from` (optional): Start date (YYYY-MM-DD)
- `date_to` (optional): End date (YYYY-MM-DD)
- `visit_type` (optional): Filter by visit type (`OPD`, `IPD`, `ER`)

**Example:**
```bash
GET /api/v1/reports/daily-counts?date_from=2024-01-01&date_to=2024-01-31&visit_type=OPD
```

**Response (200):**
```json
[
  {
    "date": "2024-01-15",
    "count": 25,
    "visit_type": "OPD"
  },
  {
    "date": "2024-01-16",
    "count": 30,
    "visit_type": "OPD"
  }
]
```

---

### GET `/reports/statistics`

Get visit statistics summary.

**Authentication:** Required  
**Permission:** `reports.view`

**Query Parameters:**
- `date_from` (optional): Start date (YYYY-MM-DD)
- `date_to` (optional): End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "total_visits": 150,
  "opd_visits": 100,
  "ipd_visits": 40,
  "er_visits": 10,
  "date_range": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `423` - Locked (account locked)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (readiness check failed)

### Common Error Scenarios

**Invalid Token:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Insufficient Permissions:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required: patient.create"
}
```

**Validation Error:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "dob": ["dob must be a valid ISO 8601 date string"],
    "gender_concept_id": ["gender_concept_id must be a positive number"]
  }
}
```

**Resource Not Found:**
```json
{
  "statusCode": 404,
  "message": "Patient not found"
}
```

---

## Permissions & Authorization

### Permission System

The system uses Role-Based Access Control (RBAC) with fine-grained permissions.

### Available Permissions

| Permission | Description |
|------------|-------------|
| `user.create` | Create users |
| `user.read` | Read users |
| `user.update` | Update users |
| `user.delete` | Delete users |
| `patient.create` | Create patients |
| `patient.read` | Read patients |
| `patient.update` | Update patients |
| `patient.delete` | Delete patients |
| `visit.create` | Create visits |
| `visit.read` | Read visits |
| `visit.update` | Update visits |
| `visit.delete` | Delete visits |
| `procedure.create` | Create procedures |
| `procedure.read` | Read procedures |
| `medication.create` | Create drug exposures |
| `medication.read` | Read drug exposures |
| `document.upload` | Upload documents |
| `document.read` | Read documents |
| `document.delete` | Delete documents |
| `fhir.read` | Read FHIR resources |
| `reports.view` | View reports |
| `audit.view` | View audit logs |

### Available Roles

- **Admin** - Full system access
- **Doctor** - Clinical permissions (patient.read, visit.create, etc.)
- **Nurse** - Nursing permissions
- **Receptionist** - Front desk permissions (patient.create, visit.create)
- **Pharmacist** - Pharmacy permissions (medication.read, medication.create)
- **Patient** - Patient self-service permissions

### Permission Checking

All endpoints (except health and authentication) require:
1. Valid JWT token in `Authorization` header
2. User must have the required permission for the endpoint

If a user lacks the required permission, a `403 Forbidden` response is returned.

---

## Rate Limiting

Some endpoints have rate limiting to prevent abuse:

- **Login:** 5 attempts per minute
- **Refresh Token:** 10 attempts per minute

When rate limit is exceeded, a `429 Too Many Requests` response is returned.

---

## API Versioning

The API is versioned via URL path:
- Current version: `/api/v1`
- Future versions: `/api/v2`, etc.

---

## Swagger Documentation

Interactive API documentation is available at:
- **URL:** `http://localhost:3000/api/docs`
- **Features:**
  - Try out endpoints directly
  - View request/response schemas
  - See authentication requirements
  - Download OpenAPI specification

---

## Support & Contact

For API support or questions:
1. Check Swagger documentation: `http://localhost:3000/api/docs`
2. Review this documentation
3. Check backend logs for detailed error messages

---

**Last Updated:** 2024-01-15  
**API Version:** 1.0

