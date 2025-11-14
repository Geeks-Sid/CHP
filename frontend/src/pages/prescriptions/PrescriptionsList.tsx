
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircleIcon, ClockIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Prescription {
  drug_exposure_id: number;
  person_id: number;
  drug_concept_id: number;
  drug_exposure_start: string;
  drug_exposure_end?: string;
  quantity?: number;
  instructions?: string;
  prescription_status?: string;
  prescription_number?: string;
  patient_name?: string;
  medication_name?: string;
  prescriber_name?: string;
  created_at: string;
}

interface PrescriptionListResponse {
  items: Prescription[];
  nextCursor?: string;
}

const PrescriptionsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch prescriptions with React Query
  const { data, isLoading, error, refetch } = useQuery<PrescriptionListResponse>({
    queryKey: ['prescriptions', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (statusFilter) {
        params.append('prescription_status', statusFilter);
      }
      params.append('limit', '50');

      const queryString = params.toString();
      return apiClient.get<PrescriptionListResponse>(`/prescriptions${queryString ? `?${queryString}` : ''}`);
    },
  });

  // Fill prescription mutation
  const fillMutation = useMutation({
    mutationFn: async (prescriptionId: number) => {
      return apiClient.post(`/prescriptions/${prescriptionId}/fill`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast({
        title: 'Prescription filled',
        description: 'The prescription has been marked as filled.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'There was a problem filling the prescription.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching prescriptions',
        description: error instanceof ApiClientError ? error.message : 'There was a problem loading prescriptions.',
      });
    }
  }, [error, toast]);

  const handleFillPrescription = (prescriptionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    fillMutation.mutate(prescriptionId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDosage = (prescription: Prescription) => {
    if (prescription.quantity) {
      return `${prescription.quantity} units`;
    }
    return 'N/A';
  };

  const prescriptions = data?.items || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prescriptions</h1>
        {user?.role === 'clinician' && (
          <Button onClick={() => navigate('/prescriptions/new')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Prescription
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'Pending' ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter('Pending')}
          >
            <ClockIcon className="h-4 w-4 mr-1" />
            Pending
          </Button>
          <Button
            variant={statusFilter === 'Filled' ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter('Filled')}
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Filled
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Medication</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Prescribed By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading prescriptions...</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : prescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-muted-foreground">No prescriptions found</p>
                    {(searchTerm || statusFilter) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter(null);
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((prescription) => (
                <TableRow
                  key={prescription.drug_exposure_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/prescriptions/${prescription.drug_exposure_id}`)}
                >
                  <TableCell className="font-medium">
                    {prescription.patient_name || `Patient #${prescription.person_id}`}
                  </TableCell>
                  <TableCell>{prescription.medication_name || 'Unknown Medication'}</TableCell>
                  <TableCell>
                    {formatDosage(prescription)}
                    {prescription.instructions && ` - ${prescription.instructions}`}
                  </TableCell>
                  <TableCell>{prescription.prescriber_name || 'Unknown'}</TableCell>
                  <TableCell>{formatDate(prescription.drug_exposure_start)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${prescription.prescription_status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : prescription.prescription_status === 'Filled'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {prescription.prescription_status || 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {user?.role === 'pharmacy' && prescription.prescription_status === 'Pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleFillPrescription(prescription.drug_exposure_id, e)}
                        disabled={fillMutation.isPending}
                      >
                        {fillMutation.isPending ? 'Filling...' : 'Fill'}
                      </Button>
                    )}
                    {user?.role === 'clinician' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/prescriptions/${prescription.drug_exposure_id}/edit`);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PrescriptionsList;
