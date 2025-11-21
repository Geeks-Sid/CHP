# Diagnosis Update Feature - Implementation Plan

## Overview
This document outlines the detailed plan for implementing the ability for doctors to update patient diagnoses when entering patient information during appointments. The implementation follows OMOP CDM standards using the `condition_occurrence` table and integrates with the existing visit/appointment system.

---

## 1. Database Schema

### 1.1 Migration: `V021__condition_occurrence.sql`

**Table: `condition_occurrence`**
- Stores patient diagnoses/conditions following OMOP CDM standard
- Links to visits, patients, and concepts (ICD-10 codes)
- Supports diagnosis types (Chronic, Acute, Emergency, Principal, Provisional)
- Supports diagnosis categories (Primary, Additional)

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS condition_occurrence (
  condition_occurrence_id SERIAL PRIMARY KEY,
  person_id INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  condition_concept_id INT NOT NULL REFERENCES concept(concept_id),
  condition_start_date DATE NOT NULL,
  condition_start_datetime TIMESTAMPTZ,
  condition_end_date DATE,
  condition_end_datetime TIMESTAMPTZ,
  condition_type_concept_id INT NOT NULL, -- Diagnosis type (Chronic, Acute, etc.)
  condition_status_concept_id INT, -- Active, Resolved, etc.
  stop_reason TEXT,
  provider_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  visit_occurrence_id INT REFERENCES visit_occurrence(visit_occurrence_id) ON DELETE SET NULL,
  visit_detail_id INT,
  condition_source_value TEXT, -- Original diagnosis text if not from vocabulary
  condition_source_concept_id INT,
  condition_status_source_value TEXT,
  diagnosis_category VARCHAR(20) CHECK (diagnosis_category IN ('Primary', 'Additional')),
  is_principal_diagnosis BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_condition_person ON condition_occurrence(person_id);
CREATE INDEX IF NOT EXISTS idx_condition_visit ON condition_occurrence(visit_occurrence_id);
CREATE INDEX IF NOT EXISTS idx_condition_concept ON condition_occurrence(condition_concept_id);
CREATE INDEX IF NOT EXISTS idx_condition_dates ON condition_occurrence(condition_start_date, condition_end_date);
CREATE INDEX IF NOT EXISTS idx_condition_provider ON condition_occurrence(provider_id);
CREATE INDEX IF NOT EXISTS idx_condition_principal ON condition_occurrence(person_id, is_principal_diagnosis) WHERE is_principal_diagnosis = true;

-- Timestamp trigger
CREATE TRIGGER condition_set_timestamp
BEFORE UPDATE ON condition_occurrence
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
```

**Key Fields:**
- `condition_concept_id`: ICD-10 code from concept table
- `condition_type_concept_id`: Maps to diagnosis types (Chronic=32817, Acute=32827, Emergency=32828, Principal=32879, Provisional=32880)
- `diagnosis_category`: Primary or Additional
- `is_principal_diagnosis`: Flags the main diagnosis for a visit
- `condition_start_date`: When diagnosis was made
- `condition_end_date`: When condition resolved (null for active conditions)
- `visit_occurrence_id`: Links to the appointment/visit

---

## 2. Backend Implementation

### 2.1 Module Structure

**Directory: `backend/src/diagnoses/`**

```
diagnoses/
├── diagnoses.module.ts          # NestJS module
├── diagnoses.controller.ts      # REST API endpoints
├── diagnoses.service.ts         # Business logic
├── diagnoses.repository.ts      # Database operations
└── dto/
    ├── create-diagnosis.dto.ts  # Create diagnosis DTO
    ├── update-diagnosis.dto.ts  # Update diagnosis DTO
    └── diagnosis-response.dto.ts # Response DTO
```

### 2.2 DTOs (Data Transfer Objects)

**`create-diagnosis.dto.ts`:**
```typescript
import { IsInt, IsString, IsOptional, IsBoolean, IsDateString, IsEnum, IsUUID, Min, MaxLength } from 'class-validator';

export enum DiagnosisType {
  CHRONIC = 32817,
  ACUTE = 32827,
  EMERGENCY = 32828,
  PRINCIPAL = 32879,
  PROVISIONAL = 32880,
}

export enum DiagnosisCategory {
  PRIMARY = 'Primary',
  ADDITIONAL = 'Additional',
}

export class CreateDiagnosisDto {
  @IsInt()
  @Min(1)
  person_id: number;

  @IsInt()
  @Min(1)
  condition_concept_id: number; // ICD-10 concept ID

  @IsDateString()
  condition_start_date: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  condition_start_datetime?: string; // ISO timestamp

  @IsOptional()
  @IsDateString()
  condition_end_date?: string; // YYYY-MM-DD (null for active)

  @IsOptional()
  @IsDateString()
  condition_end_datetime?: string;

  @IsInt()
  @Min(1)
  condition_type_concept_id: number; // Diagnosis type

  @IsOptional()
  @IsInt()
  condition_status_concept_id?: number; // Active, Resolved, etc.

  @IsOptional()
  @IsString()
  @MaxLength(500)
  stop_reason?: string;

  @IsOptional()
  @IsUUID()
  provider_id?: string; // Doctor who made diagnosis

  @IsOptional()
  @IsInt()
  visit_occurrence_id?: number; // Link to visit/appointment

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  condition_source_value?: string; // Original diagnosis text

  @IsOptional()
  @IsEnum(DiagnosisCategory)
  diagnosis_category?: DiagnosisCategory;

  @IsOptional()
  @IsBoolean()
  is_principal_diagnosis?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
```

**`update-diagnosis.dto.ts`:**
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateDiagnosisDto } from './create-diagnosis.dto';
import { IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateDiagnosisDto extends PartialType(CreateDiagnosisDto) {
  @IsOptional()
  @IsDateString()
  condition_end_date?: string; // To mark as resolved

  @IsOptional()
  @IsBoolean()
  is_principal_diagnosis?: boolean; // Can change principal diagnosis
}
```

**`diagnosis-response.dto.ts`:**
```typescript
export class DiagnosisResponseDto {
  condition_occurrence_id: number;
  person_id: number;
  condition_concept_id: number;
  condition_concept_name?: string; // Joined from concept table
  condition_concept_code?: string; // ICD-10 code
  condition_start_date: string;
  condition_start_datetime?: string;
  condition_end_date?: string;
  condition_end_datetime?: string;
  condition_type_concept_id: number;
  condition_type_name?: string; // Chronic, Acute, etc.
  condition_status_concept_id?: number;
  condition_status_name?: string;
  stop_reason?: string;
  provider_id?: string;
  provider_name?: string; // Joined from users
  visit_occurrence_id?: number;
  visit_number?: string; // Joined from visit_occurrence
  diagnosis_category?: string;
  is_principal_diagnosis: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}
```

### 2.3 Repository (`diagnoses.repository.ts`)

**Key Methods:**
- `createDiagnosis(data: CreateDiagnosisData): Promise<Diagnosis>`
- `findById(conditionId: number): Promise<Diagnosis | null>`
- `findByPersonId(personId: number, filters?: DiagnosisFilters): Promise<Diagnosis[]>`
- `findByVisitId(visitId: number): Promise<Diagnosis[]>`
- `updateDiagnosis(conditionId: number, data: UpdateDiagnosisData): Promise<Diagnosis>`
- `deleteDiagnosis(conditionId: number): Promise<void>`
- `getPrincipalDiagnosisForVisit(visitId: number): Promise<Diagnosis | null>`
- `setPrincipalDiagnosis(conditionId: number, visitId: number): Promise<void>`

**Features:**
- Transaction support for atomic operations
- Automatic principal diagnosis management (only one principal per visit)
- Join with concept table for ICD-10 codes and names
- Join with users table for provider names
- Join with visit_occurrence for visit details

### 2.4 Service (`diagnoses.service.ts`)

**Key Methods:**
- `createDiagnosis(data: CreateDiagnosisDto, userId?: string): Promise<DiagnosisResponseDto>`
- `getDiagnosisById(conditionId: number): Promise<DiagnosisResponseDto>`
- `getDiagnosesByPatient(personId: number, filters?: { active_only?: boolean, visit_id?: number }): Promise<DiagnosisResponseDto[]>`
- `getDiagnosesByVisit(visitId: number): Promise<DiagnosisResponseDto[]>`
- `updateDiagnosis(conditionId: number, data: UpdateDiagnosisDto, userId?: string): Promise<DiagnosisResponseDto>`
- `deleteDiagnosis(conditionId: number): Promise<void>`
- `setPrincipalDiagnosis(conditionId: number, visitId: number): Promise<DiagnosisResponseDto>`

**Business Logic:**
- Validate concept_id exists in concept table
- Validate visit_id exists if provided
- Ensure only one principal diagnosis per visit
- Auto-set condition_start_datetime if not provided
- Validate date ranges (end_date >= start_date)
- Check user permissions (clinicians only)

### 2.5 Controller (`diagnoses.controller.ts`)

**Endpoints:**
```
POST   /diagnoses                    # Create new diagnosis
GET    /diagnoses/:id                # Get diagnosis by ID
GET    /diagnoses/patient/:personId # Get all diagnoses for patient
GET    /diagnoses/visit/:visitId    # Get diagnoses for a visit
PATCH  /diagnoses/:id                # Update diagnosis
DELETE /diagnoses/:id                # Delete diagnosis (soft delete or hard)
PATCH  /diagnoses/:id/principal      # Set as principal diagnosis for visit
```

**Authorization:**
- Create/Update/Delete: `clinician` role required
- Read: `clinician`, `nurse`, `receptionist` roles allowed
- Patient can read their own diagnoses

**Request/Response Examples:**
```typescript
// POST /diagnoses
{
  "person_id": 123,
  "condition_concept_id": 440383, // ICD-10 code concept
  "condition_start_date": "2024-01-15",
  "condition_type_concept_id": 32827, // Acute
  "visit_occurrence_id": 456,
  "diagnosis_category": "Primary",
  "is_principal_diagnosis": true,
  "notes": "Patient presents with acute symptoms"
}

// Response includes joined data
{
  "condition_occurrence_id": 789,
  "condition_concept_name": "Acute upper respiratory infection",
  "condition_concept_code": "J06.9",
  "provider_name": "Dr. Smith",
  "visit_number": "V2024-001234",
  ...
}
```

### 2.6 Logging Integration

**Logger Usage:**
```typescript
// In service methods
logger.info(
  { 
    conditionId: diagnosis.condition_occurrence_id, 
    personId: data.person_id,
    visitId: data.visit_occurrence_id,
    userId 
  },
  'Diagnosis created'
);

logger.warn(
  { conditionId, oldPrincipal, newPrincipal },
  'Principal diagnosis changed for visit'
);

logger.error(
  { error, data },
  'Failed to create diagnosis'
);
```

**Audit Log:**
- Automatically captured by `AuditInterceptor` for all endpoints
- Records: CREATE, READ, UPDATE, DELETE actions
- Includes: user_id, resource_type='diagnosis', resource_id, IP, user_agent

---

## 3. Frontend Implementation

### 3.1 Component Structure

**Directory: `frontend/src/pages/diagnoses/`**

```
diagnoses/
├── DiagnosisForm.tsx           # Form for creating/editing diagnosis
├── DiagnosisList.tsx           # List of diagnoses for a patient
├── DiagnosisDetails.tsx        # View single diagnosis details
└── components/
    ├── DiagnosisSelector.tsx   # ICD-10 code search/select component
    ├── DiagnosisTypeSelector.tsx # Diagnosis type dropdown
    └── DiagnosisCard.tsx        # Reusable diagnosis display card
```

### 3.2 Integration Points

**1. Visit Details Page Enhancement**
- Add "Diagnoses" section to visit details
- Show existing diagnoses for the visit
- Add "Add Diagnosis" button for clinicians
- Display principal diagnosis prominently

**2. Patient Details Page Enhancement**
- Add "Diagnoses" tab/section
- Show all patient diagnoses (active and historical)
- Filter by active/resolved
- Link to related visits

**3. Appointment Form Enhancement (Optional)**
- Quick diagnosis entry during appointment creation
- Or link to diagnosis form after appointment creation

### 3.3 Key Components

**`DiagnosisForm.tsx`:**
```typescript
// Features:
- Patient selection (if not pre-selected)
- Visit selection (if not pre-selected)
- ICD-10 code search/autocomplete (concept search)
- Diagnosis type selection (Chronic, Acute, Emergency, Principal, Provisional)
- Diagnosis category (Primary, Additional)
- Principal diagnosis checkbox
- Start date picker
- End date picker (optional, for resolved conditions)
- Notes textarea
- Validation
- Submit/Cancel buttons
```

**`DiagnosisSelector.tsx` (ICD-10 Search):**
```typescript
// Features:
- Search by ICD-10 code or diagnosis name
- Autocomplete dropdown
- Display: code + name
- Filter by domain_id='Condition'
- Uses /concepts/search endpoint
- Debounced search
```

**`DiagnosisList.tsx`:**
```typescript
// Features:
- Table/card view of diagnoses
- Filter by: active/resolved, visit, date range
- Sort by: date, type, category
- Highlight principal diagnosis
- Show ICD-10 code and name
- Show provider name
- Show visit link
- Actions: Edit, Delete, Set as Principal
- Pagination
```

### 3.4 API Integration

**API Client Methods:**
```typescript
// In api-client.ts or diagnoses.api.ts
export const diagnosesApi = {
  create: (data: CreateDiagnosisDto) => 
    apiClient.post<DiagnosisResponseDto>('/diagnoses', data),
  
  getById: (id: number) => 
    apiClient.get<DiagnosisResponseDto>(`/diagnoses/${id}`),
  
  getByPatient: (personId: number, filters?: DiagnosisFilters) => 
    apiClient.get<DiagnosisResponseDto[]>(`/diagnoses/patient/${personId}`, { params: filters }),
  
  getByVisit: (visitId: number) => 
    apiClient.get<DiagnosisResponseDto[]>(`/diagnoses/visit/${visitId}`),
  
  update: (id: number, data: UpdateDiagnosisDto) => 
    apiClient.patch<DiagnosisResponseDto>(`/diagnoses/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete(`/diagnoses/${id}`),
  
  setPrincipal: (id: number, visitId: number) => 
    apiClient.patch<DiagnosisResponseDto>(`/diagnoses/${id}/principal`, { visit_id: visitId }),
};
```

### 3.5 React Query Integration

```typescript
// Use React Query for data fetching and mutations
const { data: diagnoses } = useQuery({
  queryKey: ['diagnoses', 'visit', visitId],
  queryFn: () => diagnosesApi.getByVisit(visitId),
});

const createMutation = useMutation({
  mutationFn: diagnosesApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries(['diagnoses']);
    toast({ title: 'Diagnosis created successfully' });
  },
});
```

### 3.6 UI/UX Considerations

**Design:**
- Use existing design system (shadcn/ui components)
- Consistent with other medical record forms
- Clear visual distinction for principal diagnosis
- Color coding for diagnosis types (optional)
- Responsive design for mobile/tablet

**User Flow:**
1. Doctor opens visit/appointment details
2. Clicks "Add Diagnosis" or "Update Diagnosis"
3. Searches/selects ICD-10 code
4. Selects diagnosis type and category
5. Optionally marks as principal
6. Adds notes
7. Saves diagnosis
8. Diagnosis appears in visit details and patient history

**Validation:**
- Required fields: patient, concept_id, start_date, type
- Date validation: end_date >= start_date
- Only one principal diagnosis per visit
- Concept_id must exist in vocabulary

---

## 4. Logger Implementation

### 4.1 Structured Logging

**Log Levels:**
- `info`: Successful diagnosis creation/update
- `warn`: Principal diagnosis changes, validation warnings
- `error`: Failed operations, database errors
- `debug`: Detailed operation flow (development only)

**Log Context:**
```typescript
{
  conditionId: number,
  personId: number,
  visitId?: number,
  userId: string,
  action: 'create' | 'update' | 'delete' | 'set_principal',
  diagnosisType?: string,
  icd10Code?: string,
  isPrincipal?: boolean,
  timestamp: string
}
```

### 4.2 Audit Trail

**Automatic Audit Logging:**
- Handled by `AuditInterceptor` (already implemented)
- Records all API calls to diagnosis endpoints
- Stores in `audit_log` table
- Includes: user_id, action, resource_type='diagnosis', resource_id, IP, user_agent, timestamp

**Manual Audit Events:**
```typescript
// For important business events
logger.info(
  {
    conditionId,
    personId,
    visitId,
    userId,
    previousPrincipalId,
    newPrincipalId
  },
  'Principal diagnosis changed'
);
```

### 4.3 Error Logging

```typescript
// In catch blocks
logger.error(
  {
    error: error.message,
    stack: error.stack,
    conditionId,
    personId,
    userId,
    operation: 'create_diagnosis'
  },
  'Failed to create diagnosis'
);
```

### 4.4 Performance Logging

```typescript
// For slow operations
const start = Date.now();
// ... operation ...
logger.debug(
  { duration: Date.now() - start, operation: 'search_diagnoses' },
  'Diagnosis search completed'
);
```

---

## 5. Testing Plan

### 5.1 Backend Tests

**Unit Tests:**
- Repository methods (create, update, find, delete)
- Service business logic (validation, principal diagnosis management)
- DTO validation

**Integration Tests:**
- API endpoints (create, read, update, delete)
- Database transactions
- Permission checks
- Audit logging

**Test Cases:**
- Create diagnosis with valid data
- Create diagnosis with invalid concept_id
- Set principal diagnosis (should unset previous)
- Update diagnosis end_date (mark as resolved)
- Delete diagnosis
- Get diagnoses by patient
- Get diagnoses by visit
- Permission checks (non-clinician cannot create)

### 5.2 Frontend Tests

**Component Tests:**
- DiagnosisForm validation
- DiagnosisSelector search functionality
- DiagnosisList display and filtering

**Integration Tests:**
- Form submission flow
- API error handling
- Success notifications

**E2E Tests:**
- Doctor creates diagnosis during appointment
- Doctor updates diagnosis
- Doctor sets principal diagnosis
- View diagnoses in patient history

---

## 6. Security Considerations

### 6.1 Authorization

- **Create/Update/Delete**: Only `clinician` role
- **Read**: `clinician`, `nurse`, `receptionist` roles
- **Patient**: Can read own diagnoses only
- **Admin**: Full access for management

### 6.2 Data Validation

- Server-side validation of all inputs
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize user inputs)
- Concept ID validation (must exist in vocabulary)

### 6.3 PHI Protection

- PHI redaction in logs (handled by `PhiRedactionInterceptor`)
- Audit trail for all diagnosis changes
- Access logging for compliance

---

## 7. Implementation Phases

### Phase 1: Database & Backend Core (Week 1)
- [ ] Create database migration `V021__condition_occurrence.sql`
- [ ] Create diagnoses module structure
- [ ] Implement repository with basic CRUD
- [ ] Implement service with business logic
- [ ] Implement controller with endpoints
- [ ] Add DTOs with validation
- [ ] Write unit tests

### Phase 2: Backend Integration (Week 1-2)
- [ ] Integrate with concept table (ICD-10 codes)
- [ ] Integrate with visit_occurrence table
- [ ] Add principal diagnosis management
- [ ] Add logging and audit trail
- [ ] Write integration tests
- [ ] API documentation

### Phase 3: Frontend Core (Week 2)
- [ ] Create DiagnosisForm component
- [ ] Create DiagnosisSelector (ICD-10 search)
- [ ] Create DiagnosisList component
- [ ] Create API client methods
- [ ] Add React Query hooks

### Phase 4: Frontend Integration (Week 2-3)
- [ ] Integrate with Visit Details page
- [ ] Integrate with Patient Details page
- [ ] Add routing and navigation
- [ ] Add error handling and notifications
- [ ] Write component tests

### Phase 5: Testing & Polish (Week 3)
- [ ] End-to-end testing
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Documentation
- [ ] User acceptance testing

---

## 8. Dependencies

### Backend
- Existing: `@nestjs/common`, `pg`, `pino` (logger)
- New: None (use existing infrastructure)

### Frontend
- Existing: `react`, `react-query`, `shadcn/ui`, `date-fns`
- New: None (use existing components)

### Database
- Existing: `concept` table (for ICD-10 codes)
- New: `condition_occurrence` table

---

## 9. Future Enhancements

1. **Diagnosis Templates**: Pre-defined common diagnoses for quick entry
2. **Diagnosis History Timeline**: Visual timeline of diagnosis changes
3. **Bulk Diagnosis Import**: Import diagnoses from external systems
4. **Diagnosis Alerts**: Notifications for chronic conditions requiring follow-up
5. **Diagnosis Analytics**: Reports on common diagnoses, trends
6. **Multi-language Support**: ICD-10 codes in multiple languages
7. **Diagnosis Validation Rules**: Custom validation rules per hospital
8. **Diagnosis Workflow**: Approval workflow for certain diagnosis types

---

## 10. Notes

- Follows OMOP CDM standard for healthcare data interoperability
- ICD-10 codes stored in `concept` table (vocabulary system)
- Principal diagnosis ensures only one main diagnosis per visit
- Soft delete option: Add `deleted_at` column if needed
- Consider adding `diagnosis_confidence` field for provisional diagnoses
- Consider adding `diagnosis_source` field (Clinical, Lab, Imaging, etc.)

---

## Appendix: Concept IDs Reference

**Diagnosis Types (condition_type_concept_id):**
- Chronic: 32817
- Acute: 32827
- Emergency: 32828
- Principal: 32879
- Provisional: 32880

**Condition Status (condition_status_concept_id):**
- Active: 32902
- Resolved: 32903
- Inactive: 32904

*Note: These concept IDs should be verified against your concept table after ICD-10 import.*

