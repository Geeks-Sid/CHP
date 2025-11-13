# Chunk 10: Security Hardening

## Tasks: 66, 67, 68, 69, 70, 86, 87, 115, 116

### Phase 10.1: Input Validation Hardening (Task 66)
- [ ] Payload size limits
- [ ] JSON parser limits
- [ ] Disallow prototype pollution

### Phase 10.2: Output Filtering (Task 67)
- [ ] Ensure no secrets/PII leak in errors
- [ ] Redaction middleware for logs

### Phase 10.3: Security Headers (Task 68)
- [ ] HSTS
- [ ] noSniff
- [ ] XSS protection
- [ ] Referrer policy
- [ ] CSP template

### Phase 10.4: Audit Interceptor (Task 69)
- [ ] Capture read/write events
- [ ] Store in audit_log via async queue

### Phase 10.5: Log Sampling Policy (Task 70)
- [ ] Sample high-volume read logs
- [ ] Keep full logs for writes/errors

### Phase 10.6: Secrets Handling (Task 115)
- [ ] Pull runtime secrets from Vault/SM
- [ ] Never log secrets
- [ ] Rotate keys

### Phase 10.7: Access Reviews (Task 116)
- [ ] DB roles least-privilege
- [ ] Separate app vs admin role
- [ ] Audit quarterly

## Files to Create:
```
backend/src/
├── security/
│   ├── security.module.ts
│   ├── interceptors/
│   │   ├── audit.interceptor.ts
│   │   └── phi-redaction.interceptor.ts
│   ├── middleware/
│   │   ├── payload-size.middleware.ts
│   │   └── security-headers.middleware.ts
│   └── services/
│       └── secrets.service.ts
```

