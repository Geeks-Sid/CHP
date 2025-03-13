
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Clock, ClipboardList, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data
const appointmentData = [
  { name: 'Jan', count: 12 },
  { name: 'Feb', count: 19 },
  { name: 'Mar', count: 15 },
  { name: 'Apr', count: 21 },
  { name: 'May', count: 18 },
  { name: 'Jun', count: 24 },
  { name: 'Jul', count: 28 },
];

const patientAppointments = [
  { id: 1, doctor: 'Dr. Sarah Johnson', date: '2023-06-20', time: '10:00 AM', type: 'Check-up' },
  { id: 2, doctor: 'Dr. Michael Chen', date: '2023-07-15', time: '2:30 PM', type: 'Follow-up' },
];

const receptionistAppointments = [
  { id: 1, patient: 'John Smith', doctor: 'Dr. Sarah Johnson', date: '2023-06-20', time: '10:00 AM' },
  { id: 2, patient: 'Emma Davis', doctor: 'Dr. Michael Chen', date: '2023-06-20', time: '11:30 AM' },
  { id: 3, patient: 'Robert Wilson', doctor: 'Dr. Sarah Johnson', date: '2023-06-20', time: '2:00 PM' },
];

const clinicianPatients = [
  { id: 1, name: 'John Smith', appointment: '10:00 AM', status: 'Checked In', reason: 'Annual physical' },
  { id: 2, name: 'Emma Davis', appointment: '11:30 AM', status: 'Waiting', reason: 'Follow-up' },
  { id: 3, name: 'Robert Wilson', appointment: '2:00 PM', status: 'Scheduled', reason: 'Consultation' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Dashboard content based on user role
  const renderDashboardContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    switch (user?.role) {
      case 'patient':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    Upcoming Appointments
                  </CardTitle>
                  <CardDescription>Your scheduled appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  {patientAppointments.length > 0 ? (
                    <ul className="space-y-4">
                      {patientAppointments.map((appointment) => (
                        <li key={appointment.id} className="border-b pb-2">
                          <div className="font-medium">{appointment.doctor}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                          </div>
                          <div className="pill bg-blue-100 text-blue-800 mt-1">
                            {appointment.type}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No upcoming appointments</p>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate('/appointments')}>
                    View All Appointments
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <ClipboardList className="mr-2 h-5 w-5 text-blue-500" />
                    Recent Medical Records
                  </CardTitle>
                  <CardDescription>Your latest medical information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => navigate('/medical-records')}
                  >
                    View Medical Records
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Manage your healthcare</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/appointments/new')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Appointment
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/reports')}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        );

      case 'receptionist':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="mr-2 h-5 w-5 text-purple-500" />
                    Today's Appointments
                  </CardTitle>
                  <CardDescription>Appointments scheduled for today</CardDescription>
                </CardHeader>
                <CardContent>
                  {receptionistAppointments.length > 0 ? (
                    <ul className="space-y-4">
                      {receptionistAppointments.map((appointment) => (
                        <li key={appointment.id} className="border-b pb-2">
                          <div className="font-medium">{appointment.patient}</div>
                          <div className="text-sm">{appointment.doctor}</div>
                          <div className="text-sm text-muted-foreground">{appointment.time}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No appointments today</p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4" 
                    onClick={() => navigate('/appointments')}
                  >
                    Manage Appointments
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Users className="mr-2 h-5 w-5 text-purple-500" />
                    Patient Management
                  </CardTitle>
                  <CardDescription>Register and manage patients</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/patients/new')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Register New Patient
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/patients')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    View All Patients
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="mr-2 h-5 w-5 text-purple-500" />
                    Appointment Schedule
                  </CardTitle>
                  <CardDescription>Monthly appointment overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={appointmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );

      case 'clinician':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Users className="mr-2 h-5 w-5 text-green-500" />
                    Today's Patients
                  </CardTitle>
                  <CardDescription>Patients scheduled for today</CardDescription>
                </CardHeader>
                <CardContent>
                  {clinicianPatients.length > 0 ? (
                    <ul className="space-y-4">
                      {clinicianPatients.map((patient) => (
                        <li key={patient.id} className="border-b pb-2">
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm">{patient.appointment} - {patient.reason}</div>
                          <div className="pill bg-blue-100 text-blue-800 mt-1">
                            {patient.status}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No patients scheduled for today</p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4" 
                    onClick={() => navigate('/patients')}
                  >
                    View All Patients
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="mr-2 h-5 w-5 text-green-500" />
                    Upcoming Appointments
                  </CardTitle>
                  <CardDescription>Your scheduled appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => navigate('/appointments')}
                  >
                    Manage Appointments
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <ClipboardList className="mr-2 h-5 w-5 text-green-500" />
                    Medical Records
                  </CardTitle>
                  <CardDescription>Review and update patient records</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/medical-records')}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    View Medical Records
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/reports')}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Generate Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Dashboard content not available</p>
          </div>
        );
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">
          {getGreeting()}, {user?.name}
        </h1>
        <p className="page-subtitle">Here's an overview of your information</p>
      </div>
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;
