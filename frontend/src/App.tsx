
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/context/AuthContext';

// Layouts
import Layout from "@/components/layout/Layout";
import AuthLayout from "@/components/layout/AuthLayout";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

// Patient Pages
import PatientsList from "@/pages/patients/PatientsList";
import PatientDetails from "@/pages/patients/PatientDetails";
import PatientForm from "@/pages/patients/PatientForm";

// Appointment Pages
import AppointmentsList from "@/pages/appointments/AppointmentsList";
import AppointmentForm from "@/pages/appointments/AppointmentForm";

// Medical Record Pages
import MedicalRecordsList from "@/pages/medical-records/MedicalRecordsList";
import MedicalRecordDetails from "@/pages/medical-records/MedicalRecordDetails";

// Report Pages
import Reports from "@/pages/reports/Reports";

// Profile Page
import Profile from "@/pages/Profile";

// Pharmacy Pages
import MedicationsList from "@/pages/medications/MedicationsList";
import InventoryDashboard from "@/pages/inventory/InventoryDashboard";
import PrescriptionsList from "@/pages/prescriptions/PrescriptionsList";
import MessagesList from "@/pages/messages/MessagesList";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import HospitalStatistics from "@/pages/admin/HospitalStatistics";
import UserManagement from "@/pages/admin/UserManagement";
import SystemSettings from "@/pages/admin/SystemSettings";
import AuditLogs from "@/pages/admin/AuditLogs";

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
              
              {/* Medical Record Routes */}
              <Route path="/medical-records" element={<MedicalRecordsList />} />
              <Route path="/medical-records/:id" element={<MedicalRecordDetails />} />
              
              {/* Pharmacy Routes */}
              <Route path="/medications" element={<MedicationsList />} />
              <Route path="/inventory" element={<InventoryDashboard />} />
              <Route path="/prescriptions" element={<PrescriptionsList />} />
              <Route path="/messages" element={<MessagesList />} />
              
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
