# Chunk 06: Procedures & Medications

## Tasks: 45, 46, 47, 48

### Phase 6.1: Procedures Repository (Task 45)
- [ ] CRUD operations
- [ ] Link to person & visit
- [ ] Indexes on person_id and visit_occurrence_id

### Phase 6.2: Procedures Controller (Task 46)
- [ ] POST `/api/v1/procedures` - create procedure
- [ ] GET `/api/v1/procedures` - list procedures
- [ ] Validation for code/type concepts

### Phase 6.3: Drug Exposure Repository (Task 47)
- [ ] CRUD with nullable quantity
- [ ] Stop_reason handling
- [ ] Link to person & visit

### Phase 6.4: Medications Controller (Task 48)
- [ ] POST `/api/v1/medications` - create medication
- [ ] GET `/api/v1/medications` - list medications
- [ ] Supports patient and visit filters

## Files to Create:
```
backend/src/
├── procedures/
│   ├── procedures.module.ts
│   ├── procedures.controller.ts
│   ├── procedures.service.ts
│   ├── procedures.repository.ts
│   └── dto/
│       ├── create-procedure.dto.ts
│       └── procedure-response.dto.ts
└── medications/
    ├── medications.module.ts
    ├── medications.controller.ts
    ├── medications.service.ts
    ├── medications.repository.ts
    └── dto/
        ├── create-medication.dto.ts
        └── medication-response.dto.ts
```

