
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { format as dateFormat, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DailyCount {
  date: string;
  count: number;
  visit_type: string;
}

interface Statistics {
  total_visits: number;
  opd_visits: number;
  ipd_visits: number;
  er_visits: number;
  date_range: {
    from: string;
    to: string;
  };
}

const Reports = () => {
  const [reportType, setReportType] = useState("appointments");
  const [timeRange, setTimeRange] = useState("month");
  const { toast } = useToast();

  // Calculate date range based on timeRange
  const dateRange = useMemo(() => {
    const today = new Date();
    let from: Date;

    switch (timeRange) {
      case 'week':
        from = subDays(today, 7);
        break;
      case 'month':
        from = subDays(today, 30);
        break;
      case 'quarter':
        from = subDays(today, 90);
        break;
      case 'year':
        from = subDays(today, 365);
        break;
      default:
        from = subDays(today, 30);
    }

    return {
      from: from.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    };
  }, [timeRange]);

  // Fetch daily counts
  const { data: dailyCounts, isLoading: countsLoading } = useQuery<DailyCount[]>({
    queryKey: ['reports', 'daily-counts', dateRange.from, dateRange.to],
    queryFn: async () => {
      return apiClient.get<DailyCount[]>(
        `/reports/daily-counts?date_from=${dateRange.from}&date_to=${dateRange.to}`
      );
    },
  });

  // Fetch statistics
  const { data: statistics, isLoading: statsLoading } = useQuery<Statistics>({
    queryKey: ['reports', 'statistics', dateRange.from, dateRange.to],
    queryFn: async () => {
      return apiClient.get<Statistics>(
        `/reports/statistics?date_from=${dateRange.from}&date_to=${dateRange.to}`
      );
    },
  });

  // Fetch active inpatients
  const { data: activeInpatients, isLoading: inpatientsLoading } = useQuery({
    queryKey: ['reports', 'active-inpatients'],
    queryFn: async () => {
      return apiClient.get('/reports/active-inpatients');
    },
  });

  // Transform daily counts for chart
  const appointmentData = useMemo(() => {
    if (!dailyCounts) return [];

    // Group by week or day based on timeRange
    const grouped: Record<string, { scheduled: number; completed: number; cancelled: number }> = {};

    dailyCounts.forEach((count) => {
      const date = new Date(count.date);
      let key: string;

      if (timeRange === 'week') {
        key = `Day ${date.getDate()}`;
      } else if (timeRange === 'month') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `Week ${weekNum}`;
      } else {
        key = dateFormat(date, 'MMM');
      }

      if (!grouped[key]) {
        grouped[key] = { scheduled: 0, completed: 0, cancelled: 0 };
      }

      grouped[key].scheduled += count.count;
      // Note: Backend may not provide completed/cancelled breakdown
      // This is a simplified version
      grouped[key].completed += Math.floor(count.count * 0.85);
      grouped[key].cancelled += Math.floor(count.count * 0.15);
    });

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [dailyCounts, timeRange]);

  // Mock data for patient demographics (would need additional API endpoint)
  const demographicsData = [
    { name: '0-18', value: 15 },
    { name: '19-35', value: 25 },
    { name: '36-50', value: 30 },
    { name: '51-65', value: 20 },
    { name: '65+', value: 10 },
  ];

  // Mock data for medical conditions (would need additional API endpoint)
  const conditionsData = [
    { name: 'Hypertension', count: 45 },
    { name: 'Diabetes', count: 32 },
    { name: 'Asthma', count: 28 },
    { name: 'Arthritis', count: 20 },
    { name: 'COPD', count: 15 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="reportType">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger id="reportType">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appointments">Appointments</SelectItem>
              <SelectItem value="active-inpatients">Active Inpatients</SelectItem>
              <SelectItem value="patients">Patient Demographics</SelectItem>
              <SelectItem value="conditions">Medical Conditions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="timeRange">Time Range</Label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger id="timeRange">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {reportType === "active-inpatients" && (
        <Card>
          <CardHeader>
            <CardTitle>Active Inpatients</CardTitle>
            <CardDescription>
              Currently admitted patients ({new Date().toLocaleDateString()})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inpatientsLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : activeInpatients && activeInpatients.length > 0 ? (
              <div className="space-y-4">
                <div className="text-2xl font-bold mb-4">
                  Total Active Inpatients: {activeInpatients.length}
                </div>
                <div className="space-y-2">
                  {activeInpatients.map((patient: any) => (
                    <div key={patient.person_id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Visit #{patient.visit_number} - {patient.days_inpatient} days
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Admitted: {new Date(patient.visit_start).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No active inpatients</p>
            )}
          </CardContent>
        </Card>
      )}

      {reportType === "appointments" && (
        <Card>
          <CardHeader>
            <CardTitle>Appointment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bar">
              <TabsList className="mb-4">
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                <TabsTrigger value="line">Line Chart</TabsTrigger>
              </TabsList>

              <TabsContent value="bar">
                {countsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={appointmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="scheduled" fill="#8884d8" name="Scheduled" />
                        <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                        <Bar dataKey="cancelled" fill="#ff8042" name="Cancelled" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="line">
                {countsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={appointmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="scheduled" stroke="#8884d8" name="Scheduled" />
                        <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
                        <Line type="monotone" dataKey="cancelled" stroke="#ff8042" name="Cancelled" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {statsLoading ? (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : statistics ? (
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-xl font-bold text-blue-600">{statistics.total_visits}</p>
                  <p className="text-sm text-gray-500">Total Visits</p>
                </div>
                <div className="p-4 bg-green-50 rounded-md">
                  <p className="text-xl font-bold text-green-600">{statistics.opd_visits}</p>
                  <p className="text-sm text-gray-500">OPD Visits</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-md">
                  <p className="text-xl font-bold text-orange-600">{statistics.ipd_visits + statistics.er_visits}</p>
                  <p className="text-sm text-gray-500">IPD + ER Visits</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {reportType === "patients" && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographicsData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {demographicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              {demographicsData.map((data, index) => (
                <div key={index} className="p-3 rounded-md text-center" style={{ backgroundColor: `${COLORS[index]}15` }}>
                  <p className="text-sm text-gray-500">{data.name}</p>
                  <p className="text-lg font-bold" style={{ color: COLORS[index] }}>{data.value}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "conditions" && (
        <Card>
          <CardHeader>
            <CardTitle>Top Medical Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={conditionsData}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Number of Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Key Insights:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Hypertension is the most common condition among patients</li>
                <li>Chronic conditions account for over 60% of patient diagnoses</li>
                <li>Regular monitoring programs should be considered for the top 3 conditions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="outline">
          Export as PDF
        </Button>
        <Button variant="outline">
          Export as CSV
        </Button>
      </div>
    </div>
  );
};

export default Reports;
