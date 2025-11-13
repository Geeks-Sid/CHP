# Chunk 09: FHIR & Reports

## Tasks: 57, 58, 59, 60, 61, 106

### Phase 9.1: FHIR Mapper Utilities (Task 57)
- [ ] OMOP rows → FHIR R4 JSON
- [ ] Patient mapper
- [ ] Encounter mapper
- [ ] Procedure mapper
- [ ] Medication mapper

### Phase 9.2: FHIR Controllers (Tasks 58, 59)
- [ ] GET `/fhir/R4/Patient/:id` - Task 58
- [ ] GET `/fhir/R4/Encounter/:id` - Task 58
- [ ] GET `/fhir/R4/Patient?identifier=...` - search (Task 59)
- [ ] Content-type: `application/fhir+json`

### Phase 9.3: Reporting Repository (Task 60)
- [ ] Read-only queries
- [ ] Active inpatients
- [ ] Daily counts
- [ ] Optional read replica support

### Phase 9.4: Reports Controller (Task 61)
- [ ] GET `/api/v1/reports/*`
- [ ] Strict permissions
- [ ] Time-window bounds

### Phase 9.5: Daily Job Templates (Task 106)
- [ ] Example scheduled report query
- [ ] Crontab setup (BullMQ optional)

## Files to Create:
```
backend/src/
├── fhir/
│   ├── fhir.module.ts
│   ├── fhir.controller.ts
│   ├── fhir.service.ts
│   ├── mappers/
│   │   ├── patient.mapper.ts
│   │   ├── encounter.mapper.ts
│   │   ├── procedure.mapper.ts
│   │   └── medication.mapper.ts
│   └── dto/
│       └── fhir-response.dto.ts
└── reports/
    ├── reports.module.ts
    ├── reports.controller.ts
    ├── reports.service.ts
    └── reports.repository.ts
```

## Dependencies:
- FHIR R4 schema validation (optional)

