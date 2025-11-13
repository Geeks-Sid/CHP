# Chunk 03: Users Management

## Tasks: 35, 36, 37, 38, 104

### Phase 3.1: Users Repository (Task 35)
- [ ] CRUD operations with transactions
- [ ] Unique email/username checks
- [ ] Soft delete strategy (if needed)

### Phase 3.2: Users Service (Task 37)
- [ ] Enforce role/permission checks
- [ ] Email uniqueness rules
- [ ] Business logic for user operations

### Phase 3.3: Users Controller (Task 36)
- [ ] GET `/api/v1/users` - list with pagination & filters
- [ ] POST `/api/v1/users` - create user
- [ ] GET `/api/v1/users/:id` - get user
- [ ] PATCH `/api/v1/users/:id` - update user
- [ ] DELETE `/api/v1/users/:id` - delete user

### Phase 3.4: DTO Validation (Task 38)
- [ ] CreateUserDto with class-validator
- [ ] UpdateUserDto with class-validator
- [ ] Strong constraints

### Phase 3.5: Permissions Seeding Script (Task 104)
- [ ] Idempotent seeding JSON→SQL
- [ ] Used in CI and prod

## Files to Create:
```
backend/src/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   ├── update-user.dto.ts
│   │   └── user-response.dto.ts
│   └── interfaces/
│       └── user.interface.ts
└── database/
    └── seeds/
        └── permissions.seed.ts
```

## Dependencies:
- class-validator, class-transformer
- @nestjs/swagger (for DTOs documentation)

