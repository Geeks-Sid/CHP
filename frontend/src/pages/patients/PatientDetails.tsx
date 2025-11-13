
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarPlus, Edit, FileText } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
  created_at: string;
  updated_at: string;
}

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: patient, isLoading, error } = useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (!id) throw new Error('Patient ID is required');
      return apiClient.get<Patient>(`/patients/${id}`);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof ApiClientError
          ? error.message
          : 'There was a problem loading the patient details.'
      });
      if (error instanceof ApiClientError && error.statusCode === 404) {
        navigate('/patients');
      }
    }
  }, [error, toast, navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPatientName = (patient: Patient) => {
    const firstName = patient.first_name || '';
    const lastName = patient.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAge = (patient: Patient) => {
    if (!patient.month_of_birth || !patient.day_of_birth) {
      return null;
    }
    const birthDate = new Date(
      patient.year_of_birth,
      patient.month_of_birth - 1,
      patient.day_of_birth
    );
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const formatGender = (genderConceptId: number) => {
    if (genderConceptId === 8507) return 'Male';
    if (genderConceptId === 8532) return 'Female';
    return 'Unknown';
  };

  const formatDateOfBirth = (patient: Patient) => {
    if (patient.month_of_birth && patient.day_of_birth) {
      return `${patient.year_of_birth}-${String(patient.month_of_birth).padStart(2, '0')}-${String(patient.day_of_birth).padStart(2, '0')}`;
    }
    return `${patient.year_of_birth}`;
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/patients')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-10 w-1/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-60" />
          <Skeleton className="h-60 md:col-span-2" />
        </div>
        <Skeleton className="h-10 w-1/4 mt-8 mb-4" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-xl text-muted-foreground mb-4">Patient not found</p>
        <Button onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Patients
        </Button>
      </div>
    );
  }

  const patientName = formatPatientName(patient);
  const age = calculateAge(patient);
  const gender = formatGender(patient.gender_concept_id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/patients')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="page-title m-0">Patient Details</h1>
        </div>
        {(user?.role === 'receptionist' || user?.role === 'clinician' || user?.role === 'admin') && (
          <Button onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Patient
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt={patientName} />
              <AvatarFallback className="text-lg">{getInitials(patientName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{patientName}</CardTitle>
              <CardDescription>
                {gender}{age ? `, ${age} years old` : ''}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Patient Information</p>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <span className="text-sm font-medium">MRN:</span>
                  <span className="text-sm">{patient.mrn}</span>
                  <span className="text-sm font-medium">DOB:</span>
                  <span className="text-sm">{formatDateOfBirth(patient)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Contact Information</p>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{patient.contact?.email || 'N/A'}</span>
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{patient.contact?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarPlus className="mr-2 h-5 w-5 text-blue-500" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Record Details</p>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{formatDate(patient.created_at)}</span>
                  <span className="text-sm font-medium">Last Updated:</span>
                  <span className="text-sm">{formatDate(patient.updated_at)}</span>
                </div>
              </div>
            </div>

            {(user?.role === 'receptionist' || user?.role === 'clinician') && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/visits/new', { state: { personId: patient.person_id } })}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Create Visit
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Patient Overview</CardTitle>
              <CardDescription>Basic patient information and demographics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Demographics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium">{gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{formatDateOfBirth(patient)}</p>
                    </div>
                    {age && (
                      <div>
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="font-medium">{age} years</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">MRN</p>
                      <p className="font-medium">{patient.mrn}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetails;
