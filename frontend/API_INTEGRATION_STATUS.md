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
- ✅ `PATCH /users/:id` - Update user
- ✅ `DELETE /users/:id` - Delete user

### Patient Management
- ✅ `GET /patients` - Search patients with filters
- ✅ `POST /patients` - Create patient
- ✅ `GET /patients/:person_id` - Get patient by ID
- ✅ `GET /patients/mrn/:mrn` - Get patient by MRN
- ✅ `PATCH /patients/:person_id` - Update patient

### Visit Management
- ✅ `GET /visits` - Search visits with filters
- ✅ `POST /visits` - Create visit
- ✅ `GET /visits/:id` - Get visit by ID
- ✅ `GET /visits/visit-number/:visit_number` - Get visit by visit number
- ✅ `GET /visits/active-inpatient/:person_id` - Get active inpatients
- ✅ `PATCH /visits/:id` - Update visit

### Medication Management
- ✅ `GET /medications` - Search medications with filters
- ✅ `POST /medications` - Create medication (API available)
- ✅ `PATCH /medications/:id` - Update medication (API available)
- ✅ `GET /medications/:id` - Get medication by ID (API available)

### Document Management
- ✅ `GET /documents` - List documents with filters
- ✅ `GET /documents/:document_id` - Get document by ID with download URL
- ✅ `POST /documents/presign` - Get presigned URL for upload
- ✅ `POST /documents/confirm` - Confirm file upload
- ✅ `DELETE /documents/:document_id` - Delete document

### Reports
- ✅ `GET /reports/daily-counts` - Get daily visit counts
- ✅ `GET /reports/statistics` - Get visit statistics summary
- ✅ `GET /reports/active-inpatients` - Get active inpatients report

## ✅ Fully Integrated APIs (Previously Missing)

### Procedures
- ✅ `GET /procedures` - List procedures with filters
- ✅ `POST /procedures` - Create procedure
- ✅ `GET /procedures/:id` - Get procedure by ID
- ✅ `PATCH /procedures/:id` - Update procedure

### Terminology Services
- ✅ `GET /terminology/concepts` - Search concepts with filters
- ✅ `POST /terminology/concepts/batch` - Batch lookup concepts

### FHIR Resources
- ✅ `GET /fhir/R4/Patient/:id` - Get FHIR Patient by person ID
- ✅ `GET /fhir/R4/Patient` - Search FHIR Patient by MRN
- ✅ `GET /fhir/R4/Encounter/:id` - Get FHIR Encounter by visit ID

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

## ✅ Implementation Complete

All APIs from the API documentation have been successfully integrated into the frontend:

1. ✅ User update functionality (PATCH /users/:id) - Implemented in UserManagement page
2. ✅ Document upload functionality (presign/confirm endpoints) - Implemented in DocumentUpload page
3. ✅ Procedures API (full CRUD) - Implemented in ProceduresList and ProcedureForm pages
4. ✅ Terminology API integration - Implemented in ConceptSearch page with search and batch lookup
5. ✅ FHIR endpoints - Implemented in FHIRViewer page for Patient and Encounter resources
6. ✅ Patient lookup by MRN - Integrated in PatientsList and PatientDetails pages
7. ✅ Visit lookup by visit number - Integrated in AppointmentsList page
8. ✅ Active inpatients report - Integrated in Reports page and PatientDetails page

## 📍 New Pages Added

- `/procedures` - Procedures list and management
- `/procedures/new` - Create new procedure
- `/procedures/:id` - View/edit procedure
- `/terminology` - Concept search and batch lookup
- `/fhir` - FHIR resource viewer
- `/medical-records/upload` - Document upload

## 🔧 Services Created

- `lib/terminology-service.ts` - Terminology API service functions
- `lib/fhir-service.ts` - FHIR API service functions

