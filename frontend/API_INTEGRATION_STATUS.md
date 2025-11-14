# API Integration Status

This document tracks the status of API integrations in the frontend application.

## ✅ Fully Integrated APIs

### Authentication
- ✅ `POST /auth/login` - User login
- ✅ `POST /auth/logout` - User logout  
- ✅ `GET /auth/me` - Get current user
- ✅ `POST /auth/refresh` - Token refresh (handled automatically by api-client)

### User Management
- ✅ `GET /users` - List users with filters
- ✅ `POST /users` - Create user
- ✅ `GET /users/roles` - Get available roles
- ✅ `GET /users/:id` - Get user by ID
- ✅ `DELETE /users/:id` - Delete user
- ⚠️ `PATCH /users/:id` - Update user (API available, UI not implemented)

### Patient Management
- ✅ `GET /patients` - Search patients with filters
- ✅ `POST /patients` - Create patient
- ✅ `GET /patients/:person_id` - Get patient by ID
- ✅ `PATCH /patients/:person_id` - Update patient
- ⚠️ `GET /patients/mrn/:mrn` - Get patient by MRN (API available, not used in UI)

### Visit Management
- ✅ `GET /visits` - Search visits with filters
- ✅ `POST /visits` - Create visit
- ✅ `GET /visits/:id` - Get visit by ID
- ✅ `PATCH /visits/:id` - Update visit
- ⚠️ `GET /visits/visit-number/:visit_number` - Get visit by visit number (API available, not used in UI)
- ⚠️ `GET /visits/active-inpatient/:person_id` - Get active inpatients (API available, not used in UI)

### Medication Management
- ✅ `GET /medications` - Search medications with filters
- ✅ `POST /medications` - Create medication (API available)
- ✅ `PATCH /medications/:id` - Update medication (API available)
- ✅ `GET /medications/:id` - Get medication by ID (API available)

### Document Management
- ✅ `GET /documents` - List documents with filters
- ✅ `GET /documents/:document_id` - Get document by ID with download URL
- ✅ `DELETE /documents/:document_id` - Delete document
- ⚠️ `POST /documents/presign` - Get presigned URL for upload (API available, UI not implemented)
- ⚠️ `POST /documents/confirm` - Confirm file upload (API available, UI not implemented)

### Reports
- ✅ `GET /reports/daily-counts` - Get daily visit counts
- ✅ `GET /reports/statistics` - Get visit statistics summary
- ⚠️ `GET /reports/active-inpatients` - Get active inpatients report (API available, not used in UI)

## ⚠️ Partially Integrated APIs

### Procedures
- ❌ `GET /procedures` - Not implemented in frontend
- ❌ `POST /procedures` - Not implemented in frontend
- ❌ `GET /procedures/:id` - Not implemented in frontend
- ❌ `PATCH /procedures/:id` - Not implemented in frontend

### Terminology Services
- ❌ `GET /terminology/concepts` - Not implemented in frontend
- ❌ `POST /terminology/concepts/batch` - Not implemented in frontend

### FHIR Resources
- ❌ `GET /fhir/R4/Patient/:id` - Not implemented in frontend
- ❌ `GET /fhir/R4/Patient` - Not implemented in frontend
- ❌ `GET /fhir/R4/Encounter/:id` - Not implemented in frontend

## 📝 Notes

1. **Medications**: The medications list page now uses real API data instead of mock data. The UI displays drug exposure records from the OMOP database.

2. **Medical Records**: The medical records list now uses the documents API instead of mock data. Document upload functionality (presign/confirm) is not yet implemented in the UI.

3. **Reports**: The reports page now uses real API data for daily counts and statistics. Patient demographics and medical conditions charts still use mock data as these endpoints are not available in the API.

4. **User Management**: User update (PATCH) functionality is available in the API but not yet implemented in the UI. Currently, users can only be created and deleted.

5. **Patient Lookup by MRN**: The API supports looking up patients by MRN (`/patients/mrn/:mrn`), but the frontend currently only uses person_id for lookups.

6. **Visit Lookup**: The API supports looking up visits by visit number and getting active inpatients, but these are not yet used in the frontend UI.

7. **Procedures**: The procedures API is fully available but not yet integrated into the frontend. This would require creating new pages/components.

8. **Terminology**: The terminology API is available for concept lookups (useful for autocomplete/search), but not yet integrated.

9. **FHIR**: FHIR resource endpoints are available but not yet integrated. These would be useful for interoperability with other systems.

## 🔄 Next Steps

1. Implement user update functionality (PATCH /users/:id)
2. Add document upload functionality (presign/confirm endpoints)
3. Integrate procedures API (create procedures management pages)
4. Add terminology API integration for concept lookups
5. Consider adding FHIR endpoints for interoperability
6. Add patient lookup by MRN in search functionality
7. Add visit lookup by visit number
8. Add active inpatients report to dashboard or reports page

