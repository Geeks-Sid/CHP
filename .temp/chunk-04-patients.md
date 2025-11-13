# Chunk 04: Patients (Person) Management

## Tasks: 39, 40, 41

### Phase 4.1: Person Repository (Task 39)
- [ ] Insert person
- [ ] Update person by person_id
- [ ] Optional link to users table
- [ ] Search by name/DOB/phone/email

### Phase 4.2: Person Service (Task 41)
- [ ] MRN generation using advisory lock
- [ ] Deterministic format: `MRN-YYYY-NNNNNN`
- [ ] Prevent race conditions

### Phase 4.3: Person Controller (Task 40)
- [ ] POST `/api/v1/patients` - create patient
- [ ] GET `/api/v1/patients/:person_id` - get patient
- [ ] GET `/api/v1/patients` - list with search/filters
- [ ] PATCH `/api/v1/patients/:person_id` - update patient

## Files to Create:
```
backend/src/
├── patients/
│   ├── patients.module.ts
│   ├── patients.controller.ts
│   ├── patients.service.ts
│   ├── patients.repository.ts
│   ├── dto/
│   │   ├── create-patient.dto.ts
│   │   ├── update-patient.dto.ts
│   │   └── patient-response.dto.ts
│   └── interfaces/
│       └── patient.interface.ts
```

## Dependencies:
- Advisory locks for MRN generation (pg advisory locks)

