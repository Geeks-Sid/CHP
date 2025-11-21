
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { Calendar, ChevronRight, ClipboardList, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Visit {
  visit_occurrence_id: number;
  person_id: number;
  visit_type: 'OPD' | 'IPD' | 'ER';
  visit_start: string;
  visit_end?: string;
  visit_number: string;
  reason?: string;
  provider_id?: string;
}

interface Patient {
  person_id: number;
  first_name?: string;
  last_name?: string;
  mrn: string;
}

interface DailyCount {
  date: string;
  count: number;
  visit_type: string;
}

interface Statistics {
  total_visits: number;
  opd_count: number;
  ipd_count: number;
  er_count: number;
  active_ipd?: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get today's date range
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  // Fetch today's visits
  const { data: todayVisits, isLoading: visitsLoading } = useQuery<{ items: Visit[] }>({
    queryKey: ['visits', 'today', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('date_from', todayStart);
      params.append('date_to', todayEnd);
      params.append('limit', '10');

      // Filter by provider if user is a clinician
      if (user?.role === 'clinician' && user?.id) {
        params.append('provider_id', user.id);
      }

      return apiClient.get<{ items: Visit[] }>(`/visits?${params.toString()}`);
    },
    enabled: !!user,
  });

  // Fetch recent patients (for receptionist)
  const { data: recentPatients, isLoading: patientsLoading } = useQuery<{ items: Patient[] }>({
    queryKey: ['patients', 'recent'],
    queryFn: async () => {
      return apiClient.get<{ items: Patient[] }>('/patients?limit=5');
    },
    enabled: user?.role === 'receptionist',
  });

  // Fetch daily counts for chart (last 7 days)
  const { data: dailyCounts, isLoading: countsLoading } = useQuery<DailyCount[]>({
    queryKey: ['reports', 'daily-counts', '7days'],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      return apiClient.get<DailyCount[]>(
        `/reports/daily-counts?date_from=${sevenDaysAgo}&date_to=${todayEnd}&visit_type=OPD`
      );
    },
    enabled: user?.role === 'receptionist' || user?.role === 'admin',
  });

  // Fetch statistics
  const { data: statistics, isLoading: statsLoading } = useQuery<Statistics>({
    queryKey: ['reports', 'statistics'],
    queryFn: async () => {
      return apiClient.get<Statistics>(`/reports/statistics?date_from=${thirtyDaysAgo}&date_to=${todayEnd}`);
    },
    enabled: user?.role === 'receptionist' || user?.role === 'admin',
  });

  const formatPatientName = (patient: Patient) => {
    const firstName = patient.first_name || '';
    const lastName = patient.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  const formatVisitTime = (visitStart: string) => {
    return format(new Date(visitStart), 'h:mm a');
  };

  const formatVisitDate = (visitStart: string) => {
    return format(new Date(visitStart), 'MMM d, yyyy');
  };

  // Prepare chart data
  const chartData = dailyCounts?.map(count => ({
    name: format(new Date(count.date), 'MMM d'),
    count: count.count,
  })) || [];

  const isLoading = visitsLoading || patientsLoading || countsLoading || statsLoading;

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
                  {todayVisits?.items && todayVisits.items.length > 0 ? (
                    <ul className="space-y-4">
                      {todayVisits.items.slice(0, 3).map((visit) => (
                        <li key={visit.visit_occurrence_id} className="border-b pb-2">
                          <div className="font-medium">Visit #{visit.visit_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatVisitDate(visit.visit_start)} at {formatVisitTime(visit.visit_start)}
                          </div>
                          <div className="pill bg-blue-100 text-blue-800 mt-1">
                            {visit.visit_type}
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
                  {todayVisits?.items && todayVisits.items.length > 0 ? (
                    <ul className="space-y-4">
                      {todayVisits.items.slice(0, 5).map((visit) => (
                        <li key={visit.visit_occurrence_id} className="border-b pb-2">
                          <div className="font-medium">Visit #{visit.visit_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatVisitTime(visit.visit_start)} - {visit.visit_type}
                          </div>
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
                    Recent Patients
                  </CardTitle>
                  <CardDescription>Recently registered patients</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentPatients?.items && recentPatients.items.length > 0 ? (
                    <ul className="space-y-2">
                      {recentPatients.items.map((patient) => (
                        <li key={patient.person_id} className="text-sm">
                          <div className="font-medium">{formatPatientName(patient)}</div>
                          <div className="text-muted-foreground">MRN: {patient.mrn}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No recent patients</p>
                  )}
                  <div className="space-y-2 mt-4">
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
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="mr-2 h-5 w-5 text-purple-500" />
                    Appointment Schedule
                  </CardTitle>
                  <CardDescription>Last 7 days overview</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No data available</p>
                  )}
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
                  {todayVisits?.items && todayVisits.items.length > 0 ? (
                    <ul className="space-y-4">
                      {todayVisits.items.slice(0, 5).map((visit) => (
                        <li key={visit.visit_occurrence_id} className="border-b pb-2">
                          <div className="font-medium">Visit #{visit.visit_number}</div>
                          <div className="text-sm">
                            {formatVisitTime(visit.visit_start)} - {visit.reason || 'No reason specified'}
                          </div>
                          <div className="pill bg-blue-100 text-blue-800 mt-1">
                            {visit.visit_type}
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

      case 'admin':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Users className="mr-2 h-5 w-5 text-red-500" />
                    Statistics
                  </CardTitle>
                  <CardDescription>System overview</CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : statistics ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Visits (30 days):</span>
                        <span className="font-medium">{statistics.total_visits ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">OPD Visits:</span>
                        <span className="font-medium">{statistics.opd_count ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">IPD Visits:</span>
                        <span className="font-medium">{statistics.ipd_count ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">ER Visits:</span>
                        <span className="font-medium">{statistics.er_count ?? 0}</span>
                      </div>
                      {statistics.active_ipd !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm">Active IPD:</span>
                          <span className="font-medium">{statistics.active_ipd ?? 0}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No statistics available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="mr-2 h-5 w-5 text-red-500" />
                    Today's Activity
                  </CardTitle>
                  <CardDescription>Visits scheduled today</CardDescription>
                </CardHeader>
                <CardContent>
                  {todayVisits?.items ? (
                    <div className="text-3xl font-bold">{todayVisits.items.length}</div>
                  ) : (
                    <p className="text-muted-foreground">Loading...</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <ClipboardList className="mr-2 h-5 w-5 text-red-500" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>System management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate('/admin')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Admin Dashboard
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
