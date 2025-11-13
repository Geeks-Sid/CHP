# Chunk 08: Terminology Service

## Tasks: 53, 54, 55, 56, 105

### Phase 8.1: Terminology Repository (Task 53)
- [ ] Concept lookup by code/system
- [ ] Text search (trgm or full-text)
- [ ] Caching support

### Phase 8.2: Terminology Controller (Task 54)
- [ ] GET `/api/v1/terminology/concepts` - search endpoints
- [ ] POST `/api/v1/terminology/concepts/batch` - batch concepts by IDs/codes

### Phase 8.3: External Terminology Adapter (Task 55)
- [ ] Optional Ontoserver/Snowstorm HTTP client
- [ ] Feature flag toggle

### Phase 8.4: Vocabulary Import Job (Task 56)
- [ ] COPY CSVs into vocab tables
- [ ] Analyze and index maintenance

### Phase 8.5: Background Cache Warmer (Task 105)
- [ ] Preload hot vocab concepts into Redis

## Files to Create:
```
backend/src/
├── terminology/
│   ├── terminology.module.ts
│   ├── terminology.controller.ts
│   ├── terminology.service.ts
│   ├── terminology.repository.ts
│   ├── adapters/
│   │   └── external-terminology.adapter.ts
│   └── dto/
│       ├── concept-search.dto.ts
│       └── concept-response.dto.ts
└── jobs/
    └── vocabulary-import.job.ts
```

## Dependencies:
- Redis client (for caching)
- CSV parser (for import)

