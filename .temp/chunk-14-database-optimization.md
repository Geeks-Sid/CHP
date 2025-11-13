# Chunk 14: Database Optimization & Review

## Tasks: 95, 96, 97, 98, 111

### Phase 14.1: Index Review (Task 95)
- [ ] EXPLAIN on top 10 queries
- [ ] Add composite indexes
- [ ] Fillfactor tuning where needed

### Phase 14.2: Constraints & FKs Review (Task 96)
- [ ] Cascade policies
- [ ] ON DELETE behavior
- [ ] Deferred constraints if needed

### Phase 14.3: Timezone Policy (Task 97)
- [ ] Store timestamps as `timestamptz`
- [ ] Convert at edge
- [ ] Verify in tests

### Phase 14.4: Pagination Helpers (Task 98)
- [ ] Cursor encoding/decoding (opaque)
- [ ] Default page size
- [ ] Hard max

### Phase 14.5: Sample Data Scripts (Task 111)
- [ ] Generate ~100 persons/visits for dev & demo

## Files to Create:
```
database/
├── migrations/
│   └── V013__index_optimizations.sql
├── scripts/
│   └── generate-sample-data.ts
└── utils/
    └── pagination.util.ts
```

