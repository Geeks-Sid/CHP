
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/context/AuthContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Layouts
import AuthLayout from "@/components/layout/AuthLayout";
import Layout from "@/components/layout/Layout";

// Pages
import Dashboard from "@/pages/Dashboard";
import Features from "@/pages/Features";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

// Patient Pages
import PatientDetails from "@/pages/patients/PatientDetails";
import PatientForm from "@/pages/patients/PatientForm";
import PatientsList from "@/pages/patients/PatientsList";

// Appointment Pages
import AppointmentForm from "@/pages/appointments/AppointmentForm";
import AppointmentsList from "@/pages/appointments/AppointmentsList";

// Medical Record Pages
import DocumentUpload from "@/pages/medical-records/DocumentUpload";
import MedicalRecordDetails from "@/pages/medical-records/MedicalRecordDetails";
import MedicalRecordsList from "@/pages/medical-records/MedicalRecordsList";

// Report Pages
import Reports from "@/pages/reports/Reports";

// Profile Page
import Profile from "@/pages/Profile";

// Pharmacy Pages
import MedicineInventoryDashboard from "@/pages/inventory/MedicineInventoryDashboard";
import WarehouseInventoryDashboard from "@/pages/inventory/WarehouseInventoryDashboard";
import MedicationsList from "@/pages/medications/MedicationsList";
import MessagesList from "@/pages/messages/MessagesList";
import PrescriptionsList from "@/pages/prescriptions/PrescriptionsList";

// Procedure Pages
import ProcedureForm from "@/pages/procedures/ProcedureForm";
import ProceduresList from "@/pages/procedures/ProceduresList";

// Diagnosis Pages
import DiagnosisForm from "@/pages/diagnoses/DiagnosisForm";

// Visit Pages
import VisitDetails from "@/pages/visits/VisitDetails";

// Terminology Pages
import ConceptSearch from "@/pages/terminology/ConceptSearch";

// FHIR Pages
import FHIRViewer from "@/pages/fhir/FHIRViewer";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AuditLogs from "@/pages/admin/AuditLogs";
import HospitalStatistics from "@/pages/admin/HospitalStatistics";
import SystemSettings from "@/pages/admin/SystemSettings";
import UserManagement from "@/pages/admin/UserManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/features" element={<Features />} />

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Patient Routes */}
              <Route path="/patients" element={<PatientsList />} />
              <Route path="/patients/new" element={<PatientForm />} />
              <Route path="/patients/:id" element={<PatientDetails />} />
              <Route path="/patients/:id/edit" element={<PatientForm />} />

              {/* Appointment Routes */}
              <Route path="/appointments" element={<AppointmentsList />} />
              <Route path="/appointments/new" element={<AppointmentForm />} />
              <Route path="/appointments/:id" element={<AppointmentForm />} />

              {/* Visit Routes */}
              <Route path="/visits/:id" element={<VisitDetails />} />

              {/* Medical Record Routes */}
              <Route path="/medical-records" element={<MedicalRecordsList />} />
              <Route path="/medical-records/upload" element={<DocumentUpload />} />
              <Route path="/medical-records/:id" element={<MedicalRecordDetails />} />

              {/* Inventory Routes */}
              <Route path="/inventory/warehouse" element={<WarehouseInventoryDashboard />} />
              <Route path="/inventory/medicine" element={<MedicineInventoryDashboard />} />

              {/* Pharmacy Routes */}
              <Route path="/medications" element={<MedicationsList />} />
              <Route path="/prescriptions" element={<PrescriptionsList />} />
              <Route path="/messages" element={<MessagesList />} />

              {/* Procedure Routes */}
              <Route path="/procedures" element={<ProceduresList />} />
              <Route path="/procedures/new" element={<ProcedureForm />} />
              <Route path="/procedures/:id" element={<ProcedureForm />} />
              <Route path="/procedures/:id/edit" element={<ProcedureForm />} />

              {/* Diagnosis Routes */}
              <Route path="/diagnoses/new" element={<DiagnosisForm />} />
              <Route path="/diagnoses/:id/edit" element={<DiagnosisForm />} />

              {/* Terminology Routes */}
              <Route path="/terminology" element={<ConceptSearch />} />

              {/* FHIR Routes */}
              <Route path="/fhir" element={<FHIRViewer />} />

              {/* Report Routes */}
              <Route path="/reports" element={<Reports />} />

              {/* Profile Route */}
              <Route path="/profile" element={<Profile />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/statistics" element={<HospitalStatistics />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/settings" element={<SystemSettings />} />
              <Route path="/admin/audit" element={<AuditLogs />} />
            </Route>

            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
