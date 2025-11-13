# Chunk 11: Telemetry & Observability

## Tasks: 107, 108

### Phase 11.1: Request/DB Correlation (Task 107)
- [ ] Propagate trace id to SQL comment
- [ ] pg_stat_activity visibility

### Phase 11.2: Feature Flags (Task 108)
- [ ] .env toggles for FHIR write
- [ ] External terminology adapter
- [ ] Multi-tenant hooks (if future) - Task 109

## Files to Create:
```
backend/src/
├── telemetry/
│   ├── telemetry.module.ts
│   └── services/
│       └── correlation.service.ts
└── feature-flags/
    └── feature-flags.service.ts
```

