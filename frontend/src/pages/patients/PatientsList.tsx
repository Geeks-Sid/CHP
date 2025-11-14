
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
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Eye, Search, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Patient {
  person_id: number;
  first_name?: string;
  last_name?: string;
  year_of_birth: number;
  month_of_birth?: number;
  day_of_birth?: number;
  gender_concept_id: number;
  mrn: string;
  contact?: {
    email?: string;
    phone?: string;
  };
}

interface PatientListResponse {
  items: Patient[];
  nextCursor?: string;
}

const PatientsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch patients with React Query
  const { data, isLoading, error, refetch } = useQuery<PatientListResponse>({
    queryKey: ['patients', searchQuery],
    queryFn: async () => {
      // Check if search query looks like an MRN (starts with MRN-)
      if (searchQuery && searchQuery.toUpperCase().startsWith('MRN-')) {
        try {
          const mrn = searchQuery.toUpperCase();
          const patient = await apiClient.get<Patient>(`/patients/mrn/${mrn}`);
          return { items: [patient], nextCursor: undefined };
        } catch (err) {
          // If MRN lookup fails, fall back to regular search
          if (err instanceof ApiClientError && err.statusCode === 404) {
            return { items: [], nextCursor: undefined };
          }
          throw err;
        }
      }

      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('limit', '50');

      const queryString = params.toString();
      return apiClient.get<PatientListResponse>(`/patients${queryString ? `?${queryString}` : ''}`);
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching patients',
        description: error instanceof ApiClientError ? error.message : 'There was a problem loading the patient list.'
      });
    }
  }, [error, toast]);

  const formatPatientName = (patient: Patient) => {
    const firstName = patient.first_name || '';
    const lastName = patient.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  const formatDateOfBirth = (patient: Patient) => {
    if (patient.month_of_birth && patient.day_of_birth) {
      return `${patient.year_of_birth}-${String(patient.month_of_birth).padStart(2, '0')}-${String(patient.day_of_birth).padStart(2, '0')}`;
    }
    return `${patient.year_of_birth}`;
  };

  const formatGender = (genderConceptId: number) => {
    // Common OMOP gender concept IDs: 8507 = Male, 8532 = Female
    if (genderConceptId === 8507) return 'Male';
    if (genderConceptId === 8532) return 'Female';
    return 'Unknown';
  };

  const patients = data?.items || [];

  const handleViewPatient = (personId: number) => {
    navigate(`/patients/${personId}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage and view patient information</p>
        </div>
        {user?.role === 'receptionist' && (
          <Button onClick={() => navigate('/patients/new')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Patient
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search patients by name or MRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border glass-panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading patients...</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-muted-foreground">No patients found</p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              patients.map(patient => (
                <TableRow key={patient.person_id}>
                  <TableCell className="font-medium">{formatPatientName(patient)}</TableCell>
                  <TableCell>{formatDateOfBirth(patient)}</TableCell>
                  <TableCell>{patient.contact?.email || 'N/A'}</TableCell>
                  <TableCell>{patient.contact?.phone || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewPatient(patient.person_id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
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

export default PatientsList;
