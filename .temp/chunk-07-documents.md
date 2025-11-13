# Chunk 07: Documents Management

## Tasks: 49, 50, 51, 52

### Phase 7.1: S3/MinIO Client Service (Task 49)
- [ ] Presigned PUT URLs
- [ ] Server-side encryption flags
- [ ] S3 client wrapper

### Phase 7.2: Documents Controllers (Tasks 50, 51, 52)
- [ ] POST `/api/v1/documents/presign` - get presigned URL (Task 50)
- [ ] POST `/api/v1/documents/confirm` - confirm upload (Task 51)
- [ ] GET `/api/v1/documents/:document_id` - get document (Task 52)
- [ ] GET `/api/v1/documents` - list documents (Task 52)
- [ ] Secure read with permission checks
- [ ] Soft delete support

## Files to Create:
```
backend/src/
├── documents/
│   ├── documents.module.ts
│   ├── documents.controller.ts
│   ├── documents.service.ts
│   ├── documents.repository.ts
│   ├── s3/
│   │   └── s3.service.ts
│   └── dto/
│       ├── presign-request.dto.ts
│       ├── confirm-upload.dto.ts
│       └── document-response.dto.ts
```

## Dependencies:
- @aws-sdk/client-s3
- @aws-sdk/s3-request-presigner

