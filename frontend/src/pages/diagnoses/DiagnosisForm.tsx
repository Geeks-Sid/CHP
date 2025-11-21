import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { diagnosesApi, Diagnosis, CreateDiagnosisDto } from '@/lib/diagnoses.api';
import { Concept } from '@/lib/terminology-service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { DiagnosisSelector } from './components/DiagnosisSelector';

interface Patient {
  person_id: number;
  first_name?: string;
  last_name?: string;
  mrn: string;
}

// Diagnosis type concept IDs
const DIAGNOSIS_TYPES = {
  CHRONIC: 32817,
  ACUTE: 32827,
  EMERGENCY: 32828,
  PRINCIPAL: 32879,
  PROVISIONAL: 32880,
};

const DiagnosisForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // Get patient/visit from location state
  const initialPatientId = location.state?.personId;
  const initialVisitId = location.state?.visitId;

  const [formData, setFormData] = useState({
    person_id: initialPatientId ? String(initialPatientId) : '',
    visit_occurrence_id: initialVisitId ? String(initialVisitId) : '',
    condition_concept_id: '',
    condition_start_date: new Date().toISOString().split('T')[0],
    condition_type_concept_id: String(DIAGNOSIS_TYPES.ACUTE),
    diagnosis_category: 'Primary' as 'Primary' | 'Additional',
    is_principal_diagnosis: false,
    notes: '',
  });

  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  // Fetch patients for dropdown
  const { data: patientsData } = useQuery<{ items: Patient[] }>({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api-client');
      return apiClient.get<{ items: Patient[] }>('/patients?limit=100');
    },
  });

  // Fetch diagnosis data if editing
  const { data: diagnosisData, isLoading: diagnosisLoading } = useQuery<Diagnosis>({
    queryKey: ['diagnosis', id],
    queryFn: async () => {
      if (!id) throw new Error('Diagnosis ID is required');
      return diagnosesApi.getById(parseInt(id, 10));
    },
    enabled: isEditMode && !!id,
  });

  // Populate form when diagnosis data is loaded
  useEffect(() => {
    if (diagnosisData && isEditMode) {
      setFormData({
        person_id: String(diagnosisData.person_id),
        visit_occurrence_id: diagnosisData.visit_occurrence_id ? String(diagnosisData.visit_occurrence_id) : '',
        condition_concept_id: String(diagnosisData.condition_concept_id),
        condition_start_date: diagnosisData.condition_start_date,
        condition_type_concept_id: String(diagnosisData.condition_type_concept_id),
        diagnosis_category: (diagnosisData.diagnosis_category as 'Primary' | 'Additional') || 'Primary',
        is_principal_diagnosis: diagnosisData.is_principal_diagnosis,
        notes: diagnosisData.notes || '',
      });

      // Set selected concept if available
      if (diagnosisData.condition_concept_id) {
        setSelectedConcept({
          concept_id: diagnosisData.condition_concept_id,
          concept_name: diagnosisData.condition_concept_name || '',
          concept_code: diagnosisData.condition_concept_code || '',
          vocabulary_id: 'ICD10CM',
        });
      }
    }
  }, [diagnosisData, isEditMode]);

  // Create/Update diagnosis mutation
  const diagnosisMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedConcept) {
        throw new Error('Please select a diagnosis');
      }

      const requestBody: CreateDiagnosisDto = {
        person_id: parseInt(data.person_id, 10),
        condition_concept_id: selectedConcept.concept_id,
        condition_start_date: data.condition_start_date,
        condition_type_concept_id: parseInt(data.condition_type_concept_id, 10),
        diagnosis_category: data.diagnosis_category,
        is_principal_diagnosis: data.is_principal_diagnosis,
        notes: data.notes || undefined,
        provider_id: user?.id,
      };

      if (data.visit_occurrence_id) {
        requestBody.visit_occurrence_id = parseInt(data.visit_occurrence_id, 10);
      }

      if (isEditMode && id) {
        return diagnosesApi.update(parseInt(id, 10), requestBody);
      } else {
        return diagnosesApi.create(requestBody);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
      toast({
        title: isEditMode ? "Diagnosis Updated" : "Diagnosis Created",
        description: `The diagnosis has been ${isEditMode ? 'updated' : 'created'} successfully.`,
      });
      
      // Navigate back to visit or patient page if available
      if (formData.visit_occurrence_id) {
        navigate(`/visits/${formData.visit_occurrence_id}`);
      } else if (formData.person_id) {
        navigate(`/patients/${formData.person_id}`);
      } else {
        navigate("/diagnoses");
      }
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${isEditMode ? 'update' : 'create'} diagnosis`,
      });
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.person_id || !selectedConcept || !formData.condition_start_date) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    diagnosisMutation.mutate(formData);
  };

  const patients = patientsData?.items || [];

  if (diagnosisLoading && isEditMode) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">
          <p className="text-muted-foreground">Loading diagnosis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Diagnosis' : 'Create Diagnosis'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diagnosis Information</CardTitle>
          <CardDescription>
            {isEditMode ? 'Update diagnosis details' : 'Enter diagnosis information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="person_id">Patient *</Label>
                <Select
                  value={formData.person_id}
                  onValueChange={(value) => handleChange("person_id", value)}
                  disabled={!!initialPatientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.person_id} value={String(patient.person_id)}>
                        {patient.first_name} {patient.last_name} (MRN: {patient.mrn})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visit_occurrence_id">Visit ID (Optional)</Label>
                <Input
                  id="visit_occurrence_id"
                  type="number"
                  value={formData.visit_occurrence_id}
                  onChange={(e) => handleChange('visit_occurrence_id', e.target.value)}
                  placeholder="Link to visit/appointment"
                />
              </div>

              <div className="md:col-span-2">
                <DiagnosisSelector
                  value={selectedConcept?.concept_id}
                  onSelect={setSelectedConcept}
                />
              </div>

              <div>
                <Label htmlFor="condition_start_date">Diagnosis Date *</Label>
                <Input
                  id="condition_start_date"
                  type="date"
                  value={formData.condition_start_date}
                  onChange={(e) => handleChange('condition_start_date', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="condition_type_concept_id">Diagnosis Type *</Label>
                <Select
                  value={formData.condition_type_concept_id}
                  onValueChange={(value) => handleChange("condition_type_concept_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(DIAGNOSIS_TYPES.ACUTE)}>Acute</SelectItem>
                    <SelectItem value={String(DIAGNOSIS_TYPES.CHRONIC)}>Chronic</SelectItem>
                    <SelectItem value={String(DIAGNOSIS_TYPES.EMERGENCY)}>Emergency</SelectItem>
                    <SelectItem value={String(DIAGNOSIS_TYPES.PRINCIPAL)}>Principal</SelectItem>
                    <SelectItem value={String(DIAGNOSIS_TYPES.PROVISIONAL)}>Provisional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="diagnosis_category">Category</Label>
                <Select
                  value={formData.diagnosis_category}
                  onValueChange={(value) => handleChange("diagnosis_category", value as 'Primary' | 'Additional')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary">Primary</SelectItem>
                    <SelectItem value="Additional">Additional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.visit_occurrence_id && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_principal_diagnosis"
                    checked={formData.is_principal_diagnosis}
                    onChange={(e) => handleChange('is_principal_diagnosis', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_principal_diagnosis" className="cursor-pointer">
                    Principal diagnosis for this visit
                  </Label>
                </div>
              )}

              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional notes about the diagnosis..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={diagnosisMutation.isPending}>
                {diagnosisMutation.isPending ? 'Saving...' : isEditMode ? 'Update Diagnosis' : 'Create Diagnosis'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosisForm;

