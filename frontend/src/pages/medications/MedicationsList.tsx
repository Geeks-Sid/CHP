
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Medication {
  drug_exposure_id: number;
  person_id: number;
  visit_occurrence_id?: number;
  drug_concept_id: number;
  drug_exposure_start_date: string;
  drug_exposure_end_date?: string;
  quantity?: number;
  refills?: number;
}

interface MedicationListResponse {
  items: Medication[];
  nextCursor?: string;
}

const MedicationsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch medications with React Query
  const { data, isLoading, error } = useQuery<MedicationListResponse>({
    queryKey: ['medications', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) {
        // Note: Backend may not support search by name directly
        // This would require terminology lookup or backend enhancement
      }
      params.append('limit', '50');
      
      const queryString = params.toString();
      return apiClient.get<MedicationListResponse>(`/medications${queryString ? `?${queryString}` : ''}`);
    },
  });

  // Show error toast
  if (error) {
    toast({
      variant: 'destructive',
      title: 'Error fetching medications',
      description: error instanceof ApiClientError ? error.message : 'There was a problem loading medications.',
    });
  }

  const medications = data?.items || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Medications</h1>
        <Button onClick={() => navigate('/medications/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <FilterIcon className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug Exposure ID</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <p className="text-muted-foreground">No medications found</p>
                  </TableCell>
                </TableRow>
              ) : (
                medications.map((medication) => (
                  <TableRow key={medication.drug_exposure_id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/medications/${medication.drug_exposure_id}`)}>
                    <TableCell className="font-medium">{medication.drug_exposure_id}</TableCell>
                    <TableCell>{medication.person_id}</TableCell>
                    <TableCell>{new Date(medication.drug_exposure_start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{medication.drug_exposure_end_date ? new Date(medication.drug_exposure_end_date).toLocaleDateString() : 'Ongoing'}</TableCell>
                    <TableCell>{medication.quantity || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/medications/${medication.drug_exposure_id}/edit`);
                      }}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default MedicationsList;
