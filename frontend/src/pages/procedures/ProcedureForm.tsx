
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Procedure {
  procedure_occurrence_id: number;
  person_id: number;
  visit_occurrence_id?: number;
  procedure_concept_id: number;
  procedure_date: string;
  procedure_type_concept_id?: number;
}

interface Patient {
  person_id: number;
  first_name?: string;
  last_name?: string;
  mrn: string;
}

const ProcedureForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    person_id: '',
    visit_occurrence_id: '',
    procedure_concept_id: '',
    procedure_date: new Date().toISOString().split('T')[0],
    procedure_type_concept_id: '',
  });

  // Fetch patients for dropdown
  const { data: patientsData } = useQuery<{ items: Patient[] }>({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      return apiClient.get<{ items: Patient[] }>('/patients?limit=100');
    },
  });

  // Fetch procedure data if editing
  const { data: procedureData, isLoading: procedureLoading } = useQuery<Procedure>({
    queryKey: ['procedure', id],
    queryFn: async () => {
      if (!id) throw new Error('Procedure ID is required');
      return apiClient.get<Procedure>(`/procedures/${id}`);
    },
    enabled: isEditMode && !!id,
  });

  // Populate form when procedure data is loaded
  useEffect(() => {
    if (procedureData && isEditMode) {
      setFormData({
        person_id: String(procedureData.person_id),
        visit_occurrence_id: procedureData.visit_occurrence_id ? String(procedureData.visit_occurrence_id) : '',
        procedure_concept_id: String(procedureData.procedure_concept_id),
        procedure_date: procedureData.procedure_date,
        procedure_type_concept_id: procedureData.procedure_type_concept_id ? String(procedureData.procedure_type_concept_id) : '',
      });
    }
  }, [procedureData, isEditMode]);

  // Create/Update procedure mutation
  const procedureMutation = useMutation({
    mutationFn: async (data: any) => {
      const requestBody: any = {
        person_id: parseInt(data.person_id, 10),
        procedure_concept_id: parseInt(data.procedure_concept_id, 10),
        procedure_date: data.procedure_date,
      };

      if (data.visit_occurrence_id) {
        requestBody.visit_occurrence_id = parseInt(data.visit_occurrence_id, 10);
      }

      if (data.procedure_type_concept_id) {
        requestBody.procedure_type_concept_id = parseInt(data.procedure_type_concept_id, 10);
      }

      if (isEditMode && id) {
        return apiClient.patch(`/procedures/${id}`, requestBody);
      } else {
        return apiClient.post('/procedures', requestBody);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast({
        title: isEditMode ? "Procedure Updated" : "Procedure Created",
        description: `The procedure has been ${isEditMode ? 'updated' : 'created'} successfully.`,
      });
      navigate("/procedures");
    },
    onError: (error: ApiClientError) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${isEditMode ? 'update' : 'create'} procedure`,
      });
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.person_id || !formData.procedure_concept_id || !formData.procedure_date) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    procedureMutation.mutate(formData);
  };

  const patients = patientsData?.items || [];

  if (procedureLoading && isEditMode) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/procedures')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Procedures
        </Button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Procedure' : 'Create Procedure'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Procedure Information</CardTitle>
          <CardDescription>
            {isEditMode ? 'Update procedure details' : 'Enter procedure information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="person_id">Patient *</Label>
                <select
                  id="person_id"
                  value={formData.person_id}
                  onChange={(e) => handleChange('person_id', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map((patient) => (
                    <option key={patient.person_id} value={patient.person_id}>
                      {patient.first_name} {patient.last_name} (MRN: {patient.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="procedure_concept_id">Procedure Concept ID *</Label>
                <Input
                  id="procedure_concept_id"
                  type="number"
                  value={formData.procedure_concept_id}
                  onChange={(e) => handleChange('procedure_concept_id', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="procedure_date">Procedure Date *</Label>
                <Input
                  id="procedure_date"
                  type="date"
                  value={formData.procedure_date}
                  onChange={(e) => handleChange('procedure_date', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="visit_occurrence_id">Visit ID (Optional)</Label>
                <Input
                  id="visit_occurrence_id"
                  type="number"
                  value={formData.visit_occurrence_id}
                  onChange={(e) => handleChange('visit_occurrence_id', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="procedure_type_concept_id">Procedure Type Concept ID (Optional)</Label>
                <Input
                  id="procedure_type_concept_id"
                  type="number"
                  value={formData.procedure_type_concept_id}
                  onChange={(e) => handleChange('procedure_type_concept_id', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate('/procedures')}>
                Cancel
              </Button>
              <Button type="submit" disabled={procedureMutation.isPending}>
                {procedureMutation.isPending ? 'Saving...' : isEditMode ? 'Update Procedure' : 'Create Procedure'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcedureForm;

