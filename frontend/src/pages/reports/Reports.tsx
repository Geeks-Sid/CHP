
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Reports = () => {
  const [reportType, setReportType] = useState("appointments");
  const [timeRange, setTimeRange] = useState("month");
  
  // Mock data for appointments
  const appointmentData = [
    { name: 'Week 1', scheduled: 24, completed: 20, cancelled: 4 },
    { name: 'Week 2', scheduled: 30, completed: 25, cancelled: 5 },
    { name: 'Week 3', scheduled: 28, completed: 22, cancelled: 6 },
    { name: 'Week 4', scheduled: 32, completed: 27, cancelled: 5 },
  ];
  
  // Mock data for patient demographics
  const demographicsData = [
    { name: '0-18', value: 15 },
    { name: '19-35', value: 25 },
    { name: '36-50', value: 30 },
    { name: '51-65', value: 20 },
    { name: '65+', value: 10 },
  ];
  
  // Mock data for medical conditions
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
              </TabsContent>
              
              <TabsContent value="line">
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
              </TabsContent>
            </Tabs>
            
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-xl font-bold text-blue-600">114</p>
                <p className="text-sm text-gray-500">Total Appointments</p>
              </div>
              <div className="p-4 bg-green-50 rounded-md">
                <p className="text-xl font-bold text-green-600">94</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-md">
                <p className="text-xl font-bold text-orange-600">20</p>
                <p className="text-sm text-gray-500">Cancelled</p>
              </div>
            </div>
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
