# API Quick Reference

Quick reference guide for common API operations.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

```bash
# Login
POST /auth/login
Body: { "username": "admin", "password": "..." }

# Use token
Authorization: Bearer <access_token>

# Refresh token
POST /auth/refresh
Body: { "refreshToken": "..." }
```

## Common Endpoints

### Patients

```bash
# List patients
GET /patients?search=John&limit=20

# Get patient
GET /patients/123

# Create patient
POST /patients
Body: {
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1980-05-15",
  "gender_concept_id": 8507,
  "contact": { "phone": "+1234567890", "email": "john@example.com" }
}

# Update patient
PATCH /patients/123
Body: { "first_name": "Jane" }
```

### Visits

```bash
# List visits
GET /visits?person_id=123&type=OPD

# Create visit
POST /visits
Body: {
  "person_id": 123,
  "visit_type": "OPD",
  "visit_start": "2024-01-15T10:00:00Z"
}

# Get visit
GET /visits/456
```

### Users

```bash
# List users
GET /users?role=Doctor&active=true

# Create user
POST /users
Body: {
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role_ids": [2]
}

# Get roles
GET /users/roles
```

### Medications

```bash
# List medications
GET /medications?person_id=123

# Create medication
POST /medications
Body: {
  "person_id": 123,
  "drug_concept_id": 19019073,
  "drug_exposure_start_date": "2024-01-15"
}
```

### Procedures

```bash
# List procedures
GET /procedures?person_id=123

# Create procedure
POST /procedures
Body: {
  "person_id": 123,
  "procedure_concept_id": 2000001,
  "procedure_date": "2024-01-15"
}
```

### Documents

```bash
# Get presigned upload URL
POST /documents/presign
Body: {
  "filename": "report.pdf",
  "content_type": "application/pdf",
  "patient_person_id": 123
}

# Confirm upload
POST /documents/confirm
Body: {
  "upload_id": "...",
  "patient_person_id": 123
}

# List documents
GET /documents?patient_person_id=123

# Get document
GET /documents/:document_id
```

### Reports

```bash
# Active inpatients
GET /reports/active-inpatients

# Daily counts
GET /reports/daily-counts?date_from=2024-01-01&date_to=2024-01-31

# Statistics
GET /reports/statistics?date_from=2024-01-01&date_to=2024-01-31
```

### FHIR

```bash
# Get FHIR Patient
GET /fhir/R4/Patient/123

# Search FHIR Patient
GET /fhir/R4/Patient?identifier=MRN-2024-000123

# Get FHIR Encounter
GET /fhir/R4/Encounter/456
```

### Terminology

```bash
# Search concepts
GET /terminology/concepts?q=diabetes&system=SNOMED

# Batch lookup
POST /terminology/concepts/batch
Body: {
  "concept_ids": [201820],
  "concept_codes": ["44054006"]
}
```

## Common Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `limit` | Items per page (max 100) | `?limit=20` |
| `cursor` | Pagination cursor | `?cursor=eyJ...` |
| `search` | Text search | `?search=John` |
| `date_from` | Start date (ISO 8601) | `?date_from=2024-01-01T00:00:00Z` |
| `date_to` | End date (ISO 8601) | `?date_to=2024-01-31T23:59:59Z` |

## Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `423` - Locked
- `429` - Too Many Requests

## Permissions Quick Reference

| Endpoint | Permission Required |
|----------|---------------------|
| `POST /users` | `user.create` |
| `GET /users` | `user.read` |
| `PATCH /users/:id` | `user.update` |
| `DELETE /users/:id` | `user.delete` |
| `POST /patients` | `patient.create` |
| `GET /patients` | `patient.read` |
| `PATCH /patients/:id` | `patient.update` |
| `POST /visits` | `visit.create` |
| `GET /visits` | `visit.read` |
| `PATCH /visits/:id` | `visit.update` |
| `POST /medications` | `medication.create` |
| `GET /medications` | `medication.read` |
| `POST /procedures` | `procedure.create` |
| `GET /procedures` | `procedure.read` |
| `POST /documents/presign` | `document.upload` |
| `GET /documents` | `document.read` |
| `DELETE /documents/:id` | `document.delete` |
| `GET /fhir/R4/*` | `fhir.read` |
| `GET /reports/*` | `reports.view` |

## Gender Concept IDs

- `8507` - Male
- `8532` - Female

## Visit Types

- `OPD` - Outpatient Department
- `IPD` - Inpatient Department
- `ER` - Emergency Room

