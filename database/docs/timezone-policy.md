# Timezone Policy & Best Practices

## Overview

All timestamps in the Hospital Management System are stored as `TIMESTAMPTZ` (timestamp with timezone) in PostgreSQL. This ensures consistent handling across different timezones and prevents timezone-related bugs.

## Storage Policy

### Database Level
- **All timestamp columns use `TIMESTAMPTZ`**
- PostgreSQL stores timestamps in UTC internally
- Timezone information is preserved

### Examples from Migrations

```sql
-- All timestamp columns use TIMESTAMPTZ
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
visit_start TIMESTAMPTZ NOT NULL,
birth_datetime TIMESTAMPTZ,
```

## Application Level

### Input Handling
- **Accept ISO 8601 strings** from API clients
- **Convert to UTC** before storing in database
- **Validate timezone** information if provided

### Output Handling
- **Return ISO 8601 strings** in UTC
- **Include timezone** information in responses
- **Format consistently** across all endpoints

### Example: NestJS DTO

```typescript
// Input DTO
export class CreateVisitDto {
  @IsISO8601()
  @Transform(({ value }) => new Date(value))
  visit_start: Date; // Automatically converted to UTC
}

// Repository
async createVisit(data: CreateVisitDto) {
  // Date is already in UTC when stored
  await this.db.query(
    'INSERT INTO visit_occurrence (visit_start) VALUES ($1)',
    [data.visit_start.toISOString()] // Explicit UTC conversion
  );
}
```

## Edge Conversion

### API Request → Database
1. Client sends: `"2024-01-15T10:00:00-05:00"` (EST)
2. Application converts to UTC: `"2024-01-15T15:00:00Z"`
3. Database stores: `2024-01-15 15:00:00+00` (UTC)

### Database → API Response
1. Database returns: `2024-01-15 15:00:00+00` (UTC)
2. Application formats: `"2024-01-15T15:00:00.000Z"`
3. Client receives: ISO 8601 string in UTC

## Best Practices

### ✅ DO

1. **Always use TIMESTAMPTZ in database**
   ```sql
   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   ```

2. **Use ISO 8601 format in API**
   ```json
   {
     "visit_start": "2024-01-15T10:00:00.000Z"
   }
   ```

3. **Convert to UTC at application boundary**
   ```typescript
   const utcDate = new Date(isoString); // Automatically converts to UTC
   ```

4. **Use database functions for current time**
   ```sql
   DEFAULT now() -- Always uses server timezone (UTC)
   ```

5. **Store timezone-aware dates**
   ```typescript
   new Date().toISOString() // Always UTC
   ```

### ❌ DON'T

1. **Don't use TIMESTAMP (without timezone)**
   ```sql
   -- BAD
   created_at TIMESTAMP NOT NULL
   
   -- GOOD
   created_at TIMESTAMPTZ NOT NULL
   ```

2. **Don't store local time without timezone**
   ```typescript
   // BAD
   new Date().toLocaleString()
   
   // GOOD
   new Date().toISOString()
   ```

3. **Don't assume server timezone**
   ```typescript
   // BAD
   new Date('2024-01-15 10:00:00') // Ambiguous
   
   // GOOD
   new Date('2024-01-15T10:00:00Z') // Explicit UTC
   ```

4. **Don't convert in database queries**
   ```sql
   -- BAD - converts in query
   SELECT visit_start AT TIME ZONE 'UTC'
   
   -- GOOD - already stored in UTC
   SELECT visit_start
   ```

## Testing

### Verify Timezone Handling

```typescript
describe('Timezone Handling', () => {
  it('should store dates in UTC', async () => {
    const date = new Date('2024-01-15T10:00:00-05:00'); // EST
    
    await repository.create({ visit_start: date });
    
    const result = await repository.findById(id);
    // Should be stored as UTC: 2024-01-15T15:00:00Z
    expect(result.visit_start.toISOString()).toBe('2024-01-15T15:00:00.000Z');
  });

  it('should return dates in UTC', async () => {
    const result = await repository.findById(id);
    
    // Response should be ISO 8601 in UTC
    expect(result.visit_start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
```

## Common Patterns

### Current Timestamp
```typescript
// Application
const now = new Date(); // Already in UTC
await db.query('INSERT INTO table (created_at) VALUES ($1)', [now]);

// Database (preferred)
await db.query('INSERT INTO table (created_at) VALUES (now())');
```

### Date Range Queries
```typescript
// Query for visits in date range
const start = new Date('2024-01-01T00:00:00Z');
const end = new Date('2024-01-31T23:59:59Z');

await db.query(
  'SELECT * FROM visit_occurrence WHERE visit_start BETWEEN $1 AND $2',
  [start, end]
);
```

### Age Calculation
```typescript
// Calculate age from birth date
const age = Math.floor(
  (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
);
```

## Migration Verification

All existing migrations use `TIMESTAMPTZ`:

- ✅ `V002__users.sql` - `created_at TIMESTAMPTZ`
- ✅ `V004__person.sql` - `birth_datetime TIMESTAMPTZ`
- ✅ `V005__visit_occurrence.sql` - `visit_start TIMESTAMPTZ`
- ✅ `V006__procedure_occurrence.sql` - `procedure_date TIMESTAMPTZ`
- ✅ `V007__drug_exposure.sql` - `drug_exposure_start TIMESTAMPTZ`
- ✅ `V008__document.sql` - `uploaded_at TIMESTAMPTZ`
- ✅ `V003__audit_log.sql` - `created_at TIMESTAMPTZ`

## Summary

- **Storage**: All timestamps stored as `TIMESTAMPTZ` in UTC
- **Input**: Accept ISO 8601 strings, convert to UTC
- **Output**: Return ISO 8601 strings in UTC
- **Conversion**: Handle at application edge (API layer)
- **Testing**: Verify UTC storage and ISO 8601 output

This policy ensures:
- ✅ Consistent behavior across timezones
- ✅ No ambiguity in date/time values
- ✅ Easy integration with frontend (JavaScript Date handles UTC)
- ✅ Proper sorting and comparison
- ✅ Compliance with international standards

