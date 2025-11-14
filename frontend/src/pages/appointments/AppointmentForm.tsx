
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface Patient {
  person_id: number;
  first_name?: string;
  last_name?: string;
  mrn: string;
}

interface Visit {
  visit_occurrence_id: number;
  person_id: number;
  visit_type: 'OPD' | 'IPD' | 'ER';
  visit_start: string;
  visit_end?: string;
  visit_number: string;
  reason?: string;
  provider_id?: string;
  department_id?: number;
}

const AppointmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // Get patient ID from location state (if coming from patient details page)
  const initialPatientId = location.state?.personId;

  const [formData, setFormData] = useState({
    person_id: initialPatientId ? String(initialPatientId) : '',
    visit_type: 'OPD' as 'OPD' | 'IPD' | 'ER',
    date: new Date(),
    time: '',
    reason: '',
    department_id: '',
    provider_id: user?.id || '',
  });

  // Fetch patients for dropdown
  const { data: patientsData } = useQuery<{ items: Patient[] }>({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      return apiClient.get<{ items: Patient[] }>('/patients?limit=100');
    },
  });

  // Fetch visit data if editing
  const { data: visitData, isLoading: visitLoading } = useQuery<Visit>({
    queryKey: ['visit', id],
    queryFn: async () => {
      if (!id) throw new Error('Visit ID is required');
      return apiClient.get<Visit>(`/visits/${id}`);
    },
    enabled: isEditMode && !!id,
  });

  // Populate form when visit data is loaded
  useEffect(() => {
    if (visitData && isEditMode) {
      const visitDate = new Date(visitData.visit_start);
      setFormData({
        person_id: String(visitData.person_id),
        visit_type: visitData.visit_type,
        date: visitDate,
        time: format(visitDate, 'HH:mm'),
        reason: visitData.reason || '',
        department_id: visitData.department_id ? String(visitData.department_id) : '',
        provider_id: visitData.provider_id || user?.id || '',
      });
    }
  }, [visitData, isEditMode, user?.id]);

  // Create/Update visit mutation
  const visitMutation = useMutation({
    mutationFn: async (data: any) => {
      const visitStart = new Date(data.date);
      const [hours, minutes] = data.time.split(':');
      visitStart.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      const requestBody: any = {
        person_id: parseInt(data.person_id, 10),
        visit_type: data.visit_type,
        visit_start: visitStart.toISOString(),
        reason: data.reason || undefined,
      };

      if (data.department_id) {
        requestBody.department_id = parseInt(data.department_id, 10);
      }

      if (data.provider_id) {
        requestBody.provider_id = data.provider_id;
      }

      if (isEditMode && id) {
        return apiClient.patch(`/visits/${id}`, requestBody);
      } else {
        return apiClient.post('/visits', requestBody);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast({
        title: isEditMode ? "Appointment Updated" : "Appointment Created",
        description: `The appointment has been ${isEditMode ? 'updated' : 'created'} successfully.`,
      });
      navigate("/appointments");
    },
    onError: (error: ApiClientError) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${isEditMode ? 'update' : 'create'} appointment`,
      });
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.person_id || !formData.time) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    visitMutation.mutate(formData);
  };

  const patients = patientsData?.items || [];

  const formatPatientName = (patient: Patient) => {
    const firstName = patient.first_name || '';
    const lastName = patient.last_name || '';
    return `${firstName} ${lastName}`.trim() || `MRN: ${patient.mrn}`;
  };

  if (visitLoading && isEditMode) {
    return (
      <div className="container mx-auto p-4 max-w-xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <p className="text-muted-foreground">Loading appointment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Appointment" : "New Appointment"}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              <Select
                value={formData.person_id}
                onValueChange={(value) => handleChange("person_id", value)}
                required
                disabled={!!initialPatientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.person_id} value={String(patient.person_id)}>
                      {formatPatientName(patient)} ({patient.mrn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {initialPatientId && (
                <p className="text-sm text-muted-foreground">Patient pre-selected from patient details</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_type">Visit Type *</Label>
              <Select
                value={formData.visit_type}
                onValueChange={(value) => handleChange("visit_type", value as 'OPD' | 'IPD' | 'ER')}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPD">OPD - Outpatient Department</SelectItem>
                  <SelectItem value="IPD">IPD - Inpatient Department</SelectItem>
                  <SelectItem value="ER">ER - Emergency Room</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && handleChange("date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleChange("time", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="e.g., Routine checkup, Follow-up"
              />
            </div>

            {user?.role === 'clinician' && (
              <div className="space-y-2">
                <Label htmlFor="provider_id">Provider</Label>
                <Input
                  id="provider_id"
                  value={formData.provider_id}
                  onChange={(e) => handleChange("provider_id", e.target.value)}
                  placeholder="Provider user ID (optional)"
                />
                <p className="text-sm text-muted-foreground">Leave empty to use your user ID</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="department_id">Department ID</Label>
              <Input
                id="department_id"
                type="number"
                value={formData.department_id}
                onChange={(e) => handleChange("department_id", e.target.value)}
                placeholder="Department ID (optional)"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => navigate("/appointments")}>
              Cancel
            </Button>
            <Button type="submit" disabled={visitMutation.isPending}>
              {visitMutation.isPending
                ? (isEditMode ? "Updating..." : "Creating...")
                : (isEditMode ? "Update Appointment" : "Create Appointment")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AppointmentForm;
