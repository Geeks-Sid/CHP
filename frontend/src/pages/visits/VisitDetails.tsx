import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Activity, ArrowLeft, Calendar, Pill, Scissors, User } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DiagnosisList from '../diagnoses/DiagnosisList';

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
    created_at: string;
    updated_at: string;
}

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

const VisitDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    // Fetch visit data
    const { data: visit, isLoading: visitLoading, error: visitError } = useQuery<Visit>({
        queryKey: ['visit', id],
        queryFn: async () => {
            if (!id) throw new Error('Visit ID is required');
            return apiClient.get<Visit>(`/visits/${id}`);
        },
        enabled: !!id,
    });

    // Fetch patient data
    const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
        queryKey: ['patient', visit?.person_id],
        queryFn: async () => {
            if (!visit?.person_id) throw new Error('Patient ID is required');
            return apiClient.get<Patient>(`/patients/${visit.person_id}`);
        },
        enabled: !!visit?.person_id,
    });

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'MMM dd, yyyy');
    };

    const formatTime = (dateString: string) => {
        return format(new Date(dateString), 'h:mm a');
    };

    const formatDateTime = (dateString: string) => {
        return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    };

    const formatDateOfBirth = (patient: Patient) => {
        if (patient.year_of_birth) {
            const month = patient.month_of_birth || 1;
            const day = patient.day_of_birth || 1;
            return `${month}/${day}/${patient.year_of_birth}`;
        }
        return 'N/A';
    };

    const calculateAge = (patient: Patient) => {
        if (patient.year_of_birth) {
            const today = new Date();
            const birthDate = new Date(
                patient.year_of_birth,
                (patient.month_of_birth || 1) - 1,
                patient.day_of_birth || 1
            );
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        }
        return null;
    };

    const getGenderLabel = (genderConceptId: number) => {
        // Common gender concept IDs
        if (genderConceptId === 8507) return 'Male';
        if (genderConceptId === 8532) return 'Female';
        return 'Unknown';
    };

    if (visitLoading || patientLoading) {
        return (
            <div className="container mx-auto p-6">
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (visitError || !visit || !patient) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-10">
                            <p className="text-red-500">
                                {visitError instanceof ApiClientError
                                    ? visitError.message
                                    : 'Failed to load visit details'}
                            </p>
                            <Button variant="outline" className="mt-4" onClick={() => navigate('/appointments')}>
                                Back to Appointments
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown';
    const age = calculateAge(patient);
    const gender = getGenderLabel(patient.gender_concept_id);

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => navigate('/appointments')} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Appointments
                </Button>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Visit #{visit.visit_number}</h1>
                        <p className="text-muted-foreground">
                            {formatDateTime(visit.visit_start)}
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <Link to={`/patients/${patient.person_id}`}>
                            <Button variant="outline">
                                <User className="h-4 w-4 mr-2" />
                                View Patient
                            </Button>
                        </Link>
                        <Link to={`/appointments/${visit.visit_occurrence_id}`}>
                            <Button variant="outline">
                                Edit Visit
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
                {/* Patient Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <User className="mr-2 h-5 w-5 text-blue-500" />
                            Patient Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Name</p>
                                <p className="font-medium">{patientName}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">MRN</p>
                                <p className="font-medium">{patient.mrn}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">DOB</p>
                                <p className="font-medium">{formatDateOfBirth(patient)}</p>
                            </div>
                            {age && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Age</p>
                                    <p className="font-medium">{age} years</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                                <p className="font-medium">{gender}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Visit Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="mr-2 h-5 w-5 text-green-500" />
                            Visit Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Visit Number</p>
                                <p className="font-medium">{visit.visit_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Type</p>
                                <p className="font-medium">{visit.visit_type}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Start</p>
                                <p className="font-medium">{formatDateTime(visit.visit_start)}</p>
                            </div>
                            {visit.visit_end && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">End</p>
                                    <p className="font-medium">{formatDateTime(visit.visit_end)}</p>
                                </div>
                            )}
                            {visit.reason && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Reason</p>
                                    <p className="font-medium">{visit.reason}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {user?.role === 'clinician' && (
                                <>
                                    <Link to={`/diagnoses/new`} state={{ personId: patient.person_id, visitId: visit.visit_occurrence_id }}>
                                        <Button variant="outline" className="w-full justify-start">
                                            <Activity className="h-4 w-4 mr-2" />
                                            Add Diagnosis
                                        </Button>
                                    </Link>
                                    <Link to={`/prescriptions/new`} state={{ personId: patient.person_id, visitId: visit.visit_occurrence_id }}>
                                        <Button variant="outline" className="w-full justify-start">
                                            <Pill className="h-4 w-4 mr-2" />
                                            Add Prescription
                                        </Button>
                                    </Link>
                                    <Link to={`/procedures/new`} state={{ personId: patient.person_id, visitId: visit.visit_occurrence_id }}>
                                        <Button variant="outline" className="w-full justify-start">
                                            <Scissors className="h-4 w-4 mr-2" />
                                            Add Procedure
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Visit Details */}
            <Tabs defaultValue="diagnoses" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="diagnoses" className="flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Diagnoses
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Patient History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="diagnoses" className="space-y-4">
                    <DiagnosisList
                        personId={patient.person_id}
                        visitId={visit.visit_occurrence_id}
                        showActions={true}
                    />
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Patient Diagnoses</CardTitle>
                            <CardDescription>Complete diagnosis history for this patient</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DiagnosisList
                                personId={patient.person_id}
                                showActions={false}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default VisitDetails;

