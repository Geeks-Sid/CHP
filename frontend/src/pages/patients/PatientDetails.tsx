
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Edit, CalendarPlus, FileText, Clock, CheckSquare, BarChart2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Mock patient data
const mockPatients = {
  '1': {
    id: '1',
    name: 'John Smith',
    dob: '1980-05-15',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, CA 12345',
    gender: 'Male',
    insurance: 'Blue Cross Blue Shield',
    policyNumber: 'BC123456789',
    medicalHistory: [
      { date: '2023-01-15', description: 'Annual physical examination', provider: 'Dr. Michael Chen' },
      { date: '2022-10-08', description: 'Flu vaccination', provider: 'Dr. Sarah Johnson' },
      { date: '2022-05-20', description: 'Sprained ankle treatment', provider: 'Dr. Michael Chen' },
    ],
    appointments: [
      { id: '101', date: '2023-06-15', time: '10:00 AM', doctor: 'Dr. Michael Chen', status: 'Scheduled', type: 'Follow-up' },
      { id: '102', date: '2023-07-22', time: '2:30 PM', doctor: 'Dr. Sarah Johnson', status: 'Scheduled', type: 'Annual physical' },
    ],
    vitalSigns: [
      { date: '2023-01-15', heartRate: 72, bloodPressure: '120/80', temperature: 98.6, weight: 185 },
      { date: '2022-07-08', heartRate: 75, bloodPressure: '124/82', temperature: 98.4, weight: 188 },
      { date: '2022-01-12', heartRate: 70, bloodPressure: '118/78', temperature: 98.7, weight: 190 },
      { date: '2021-06-25', heartRate: 74, bloodPressure: '122/80', temperature: 98.5, weight: 192 },
    ],
  },
  // Add more patients as needed
};

// Chart data
const weightData = [
  { date: '2021-06', value: 192 },
  { date: '2022-01', value: 190 },
  { date: '2022-07', value: 188 },
  { date: '2023-01', value: 185 },
];

const bloodPressureData = [
  { date: '2021-06', systolic: 122, diastolic: 80 },
  { date: '2022-01', systolic: 118, diastolic: 78 },
  { date: '2022-07', systolic: 124, diastolic: 82 },
  { date: '2023-01', systolic: 120, diastolic: 80 },
];

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch patient details
    const fetchPatientDetails = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (id && mockPatients[id as keyof typeof mockPatients]) {
          setPatient(mockPatients[id as keyof typeof mockPatients]);
        } else {
          toast({
            variant: 'destructive',
            title: 'Patient not found',
            description: 'The requested patient does not exist.'
          });
          navigate('/patients');
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'There was a problem loading the patient details.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientDetails();
  }, [id, navigate, toast]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('');
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

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
        {(user?.role === 'receptionist' || user?.role === 'clinician') && (
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
              <AvatarImage src="" alt={patient.name} />
              <AvatarFallback className="text-lg">{getInitials(patient.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{patient.name}</CardTitle>
              <CardDescription>
                {patient.gender}, {calculateAge(patient.dob)} years old
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Contact Information</p>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{patient.email}</span>
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{patient.phone}</span>
                  <span className="text-sm font-medium">Address:</span>
                  <span className="text-sm">{patient.address}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Insurance Details</p>
                <div className="grid grid-cols-[1fr_2fr] gap-1">
                  <span className="text-sm font-medium">Provider:</span>
                  <span className="text-sm">{patient.insurance}</span>
                  <span className="text-sm font-medium">Policy #:</span>
                  <span className="text-sm">{patient.policyNumber}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarPlus className="mr-2 h-5 w-5 text-blue-500" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.appointments.length > 0 ? (
              <div className="space-y-4">
                {patient.appointments.map((appointment: any) => (
                  <div key={appointment.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{formatDate(appointment.date)} at {appointment.time}</div>
                      <div className="text-sm text-muted-foreground">{appointment.doctor} - {appointment.type}</div>
                    </div>
                    <div className="pill bg-blue-100 text-blue-800">
                      {appointment.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming appointments</p>
            )}
            
            {(user?.role === 'receptionist' || user?.role === 'clinician') && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4" 
                onClick={() => navigate('/appointments/new', { state: { patientId: id } })}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="medical-history" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="medical-history" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Medical History
          </TabsTrigger>
          <TabsTrigger value="vital-signs" className="flex items-center">
            <CheckSquare className="h-4 w-4 mr-2" />
            Vital Signs
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Charts & Trends
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="medical-history" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>Past medical encounters and treatments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {patient.medicalHistory.map((record: any, index: number) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{record.description}</div>
                      <div className="pill bg-gray-100 text-gray-800 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(record.date)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">Provider: {record.provider}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vital-signs">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Vital Signs</CardTitle>
              <CardDescription>Recent vital sign measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="py-2 px-4 text-left font-medium">Date</th>
                      <th className="py-2 px-4 text-left font-medium">Heart Rate</th>
                      <th className="py-2 px-4 text-left font-medium">Blood Pressure</th>
                      <th className="py-2 px-4 text-left font-medium">Temperature</th>
                      <th className="py-2 px-4 text-left font-medium">Weight (lbs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.vitalSigns.map((record: any, index: number) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-3 px-4">{formatDate(record.date)}</td>
                        <td className="py-3 px-4">{record.heartRate} bpm</td>
                        <td className="py-3 px-4">{record.bloodPressure} mmHg</td>
                        <td className="py-3 px-4">{record.temperature}°F</td>
                        <td className="py-3 px-4">{record.weight} lbs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="charts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Weight Trends</CardTitle>
                <CardDescription>Weight measurements over time (lbs)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Blood Pressure</CardTitle>
                <CardDescription>Blood pressure readings over time (mmHg)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bloodPressureData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="systolic" 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        name="Systolic"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="diastolic" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Diastolic"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetails;
