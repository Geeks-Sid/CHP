import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { diagnosesApi, Diagnosis } from '@/lib/diagnoses.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, Edit, Trash2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface DiagnosisListProps {
  personId?: number;
  visitId?: number;
  showActions?: boolean;
}

const DiagnosisList = ({ personId, visitId, showActions = true }: DiagnosisListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch diagnoses
  const { data: diagnoses, isLoading, error } = useQuery<Diagnosis[]>({
    queryKey: ['diagnoses', personId, visitId],
    queryFn: async () => {
      if (visitId) {
        return diagnosesApi.getByVisit(visitId);
      } else if (personId) {
        return diagnosesApi.getByPatient(personId);
      }
      return [];
    },
    enabled: !!personId || !!visitId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (conditionId: number) => diagnosesApi.delete(conditionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
      toast({
        title: 'Diagnosis deleted',
        description: 'The diagnosis has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete diagnosis',
      });
    },
  });

  // Set principal mutation
  const setPrincipalMutation = useMutation({
    mutationFn: ({ conditionId, visitId }: { conditionId: number; visitId: number }) =>
      diagnosesApi.setPrincipal(conditionId, visitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
      toast({
        title: 'Principal diagnosis set',
        description: 'The principal diagnosis has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to set principal diagnosis',
      });
    },
  });

  const handleDelete = (conditionId: number) => {
    if (window.confirm('Are you sure you want to delete this diagnosis?')) {
      deleteMutation.mutate(conditionId);
    }
  };

  const handleSetPrincipal = (conditionId: number, visitId: number) => {
    setPrincipalMutation.mutate({ conditionId, visitId });
  };

  const getDiagnosisTypeColor = (typeName?: string) => {
    switch (typeName?.toLowerCase()) {
      case 'acute':
        return 'bg-blue-100 text-blue-800';
      case 'chronic':
        return 'bg-orange-100 text-orange-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagnoses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading diagnoses...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagnoses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading diagnoses</p>
        </CardContent>
      </Card>
    );
  }

  const diagnosesList = diagnoses || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Diagnoses</CardTitle>
            <CardDescription>
              {visitId ? 'Diagnoses for this visit' : personId ? 'Patient diagnoses' : 'All diagnoses'}
            </CardDescription>
          </div>
          {showActions && user?.role === 'clinician' && (
            <Button
              onClick={() =>
                navigate('/diagnoses/new', {
                  state: { personId, visitId },
                })
              }
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Diagnosis
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {diagnosesList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No diagnoses found</p>
            {showActions && user?.role === 'clinician' && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  navigate('/diagnoses/new', {
                    state: { personId, visitId },
                  })
                }
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Diagnosis
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                {visitId && <TableHead>Principal</TableHead>}
                {showActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {diagnosesList.map((diagnosis) => (
                <TableRow key={diagnosis.condition_occurrence_id}>
                  <TableCell className="font-mono text-sm">
                    {diagnosis.condition_concept_code || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {diagnosis.condition_concept_name || 'Unknown'}
                      </div>
                      {diagnosis.provider_name && (
                        <div className="text-xs text-muted-foreground">
                          by {diagnosis.provider_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {diagnosis.condition_type_name && (
                      <Badge className={getDiagnosisTypeColor(diagnosis.condition_type_name)}>
                        {diagnosis.condition_type_name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {diagnosis.diagnosis_category && (
                      <Badge variant="outline">{diagnosis.diagnosis_category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(diagnosis.condition_start_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {diagnosis.condition_end_date ? (
                      <Badge variant="secondary">Resolved</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </TableCell>
                  {visitId && (
                    <TableCell>
                      {diagnosis.is_principal_diagnosis ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleSetPrincipal(diagnosis.condition_occurrence_id, visitId)
                          }
                          disabled={setPrincipalMutation.isPending}
                        >
                          Set Principal
                        </Button>
                      )}
                    </TableCell>
                  )}
                  {showActions && user?.role === 'clinician' && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/diagnoses/${diagnosis.condition_occurrence_id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(diagnosis.condition_occurrence_id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default DiagnosisList;

