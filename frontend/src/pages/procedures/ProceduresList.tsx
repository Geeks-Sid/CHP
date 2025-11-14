
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, SearchIcon } from 'lucide-react';
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

interface Procedure {
  procedure_occurrence_id: number;
  person_id: number;
  visit_occurrence_id?: number;
  procedure_concept_id: number;
  procedure_date: string;
  procedure_type_concept_id?: number;
  created_at?: string;
}

interface ProcedureListResponse {
  items: Procedure[];
  nextCursor?: string;
}

const ProceduresList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch procedures with React Query
  const { data, isLoading, error } = useQuery<ProcedureListResponse>({
    queryKey: ['procedures', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '50');
      
      const queryString = params.toString();
      return apiClient.get<ProcedureListResponse>(`/procedures${queryString ? `?${queryString}` : ''}`);
    },
  });

  // Show error toast
  if (error) {
    toast({
      variant: 'destructive',
      title: 'Error fetching procedures',
      description: error instanceof ApiClientError ? error.message : 'There was a problem loading procedures.',
    });
  }

  const procedures = data?.items || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Procedures</h1>
        <Button onClick={() => navigate('/procedures/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Procedure
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search procedures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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
                <TableHead>Procedure ID</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Visit ID</TableHead>
                <TableHead>Procedure Date</TableHead>
                <TableHead>Concept ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <p className="text-muted-foreground">No procedures found</p>
                  </TableCell>
                </TableRow>
              ) : (
                procedures.map((procedure) => (
                  <TableRow key={procedure.procedure_occurrence_id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/procedures/${procedure.procedure_occurrence_id}`)}>
                    <TableCell className="font-medium">{procedure.procedure_occurrence_id}</TableCell>
                    <TableCell>{procedure.person_id}</TableCell>
                    <TableCell>{procedure.visit_occurrence_id || 'N/A'}</TableCell>
                    <TableCell>{new Date(procedure.procedure_date).toLocaleDateString()}</TableCell>
                    <TableCell>{procedure.procedure_concept_id}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/procedures/${procedure.procedure_occurrence_id}/edit`);
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

export default ProceduresList;

