# Chunk 02: Authentication & Authorization

## Tasks: 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 101, 102, 103

### Phase 2.1: Password Hashing Service (Task 25)
- [ ] Bcrypt/Argon2 service
- [ ] Per-user salt
- [ ] Configurable cost controls

### Phase 2.2: JWT Service (Task 26)
- [ ] Access token (15m TTL)
- [ ] Refresh token (7d TTL)
- [ ] RSA or HS256 support
- [ ] Key rotation support

### Phase 2.3: Refresh Token Store (Task 27)
- [ ] Repository for refresh_tokens table
- [ ] Hash tokens before storage
- [ ] Device metadata (IP, UA, fingerprint) - Task 101

### Phase 2.4: Auth Controllers (Tasks 28, 29, 30)
- [ ] POST `/api/v1/auth/login` - Task 28
- [ ] POST `/api/v1/auth/refresh` - Task 29
- [ ] POST `/api/v1/auth/logout` - Task 30

### Phase 2.5: Auth Guards (Task 31)
- [ ] JWT verification guard
- [ ] Attach `req.user` with user context

### Phase 2.6: Permissions Guard (Task 32)
- [ ] `@Permissions(...)` decorator
- [ ] DB/cached permission checks
- [ ] RBAC enforcement

### Phase 2.7: Security Features (Tasks 33, 34, 102, 103)
- [ ] CSRF strategy (if using cookies) - Task 33
- [ ] Rate limiting policies - Task 34
- [ ] Password policy (min length, complexity) - Task 102
- [ ] Account lockout/backoff - Task 103

## Files to Create:
```
backend/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── permissions.guard.ts
│   ├── decorators/
│   │   ├── permissions.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── refresh.dto.ts
│   │   └── logout.dto.ts
│   └── services/
│       ├── password.service.ts
│       ├── jwt.service.ts
│       └── refresh-token.service.ts
└── security/
    ├── csrf.service.ts
    └── password-policy.service.ts
```

## Dependencies:
- @nestjs/jwt, @nestjs/passport, passport, passport-jwt
- bcryptjs or argon2
- jsonwebtoken
- @nestjs/throttler (for rate limiting)

