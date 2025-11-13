# Chunk 05: Visits Management

## Tasks: 42, 43, 44

### Phase 5.1: Visit Repository (Task 42)
- [ ] Create visit (atomic)
- [ ] Generated visit_number: `V-YYYY-NNNNNN`
- [ ] Link to person and provider

### Phase 5.2: Visit Service (Task 44)
- [ ] Prevent overlapping inpatient visits
- [ ] Compute derived fields
- [ ] Business logic validation

### Phase 5.3: Visit Controller (Task 43)
- [ ] POST `/api/v1/visits` - create visit
- [ ] GET `/api/v1/visits/:id` - get visit
- [ ] GET `/api/v1/visits` - list with cursor pagination
- [ ] Filters: date range, provider, type

## Files to Create:
```
backend/src/
├── visits/
│   ├── visits.module.ts
│   ├── visits.controller.ts
│   ├── visits.service.ts
│   ├── visits.repository.ts
│   ├── dto/
│   │   ├── create-visit.dto.ts
│   │   └── visit-response.dto.ts
│   └── interfaces/
│       └── visit.interface.ts
```

