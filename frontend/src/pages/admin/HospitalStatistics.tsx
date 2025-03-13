
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Treemap } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const diseaseData = [
  { name: 'Hypertension', count: 1253, change: '+12%', department: 'Cardiology' },
  { name: 'Diabetes', count: 985, change: '+8%', department: 'Endocrinology' },
  { name: 'Respiratory Infections', count: 782, change: '-3%', department: 'Pulmonology' },
  { name: 'Anxiety Disorders', count: 654, change: '+15%', department: 'Psychiatry' },
  { name: 'Arthritis', count: 521, change: '+5%', department: 'Rheumatology' },
  { name: 'Asthma', count: 423, change: '+2%', department: 'Pulmonology' }
];

const departmentPerformance = [
  { name: 'Cardiology', patients: 2450, revenue: 520000, satisfaction: 87 },
  { name: 'Orthopedics', patients: 1980, revenue: 475000, satisfaction: 84 },
  { name: 'Pediatrics', patients: 2100, revenue: 320000, satisfaction: 91 },
  { name: 'Neurology', patients: 1250, revenue: 380000, satisfaction: 82 },
  { name: 'Oncology', patients: 980, revenue: 560000, satisfaction: 86 },
  { name: 'OB/GYN', patients: 1760, revenue: 290000, satisfaction: 89 }
];

const monthlyRevenue = [
  { month: 'Jan', revenue: 320000, patients: 1200 },
  { month: 'Feb', revenue: 305000, patients: 1150 },
  { month: 'Mar', revenue: 340000, patients: 1300 },
  { month: 'Apr', revenue: 360000, patients: 1400 },
  { month: 'May', revenue: 375000, patients: 1450 },
  { month: 'Jun', revenue: 390000, patients: 1500 },
  { month: 'Jul', revenue: 400000, patients: 1550 },
  { month: 'Aug', revenue: 395000, patients: 1530 },
  { month: 'Sep', revenue: 380000, patients: 1480 },
  { month: 'Oct', revenue: 410000, patients: 1600 },
  { month: 'Nov', revenue: 420000, patients: 1650 },
  { month: 'Dec', revenue: 450000, patients: 1800 }
];

const patientDemographics = [
  { name: '0-17', value: 15 },
  { name: '18-34', value: 25 },
  { name: '35-50', value: 30 },
  { name: '51-65', value: 20 },
  { name: '66+', value: 10 }
];

const HospitalStatistics = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Hospital Statistics</h1>
        <Select defaultValue="year">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <CardDescription>For the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18,547</div>
            <p className="text-xs text-muted-foreground mt-1">+12.5% from last year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            <CardDescription>For the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4.2M</div>
            <p className="text-xs text-muted-foreground mt-1">+8.3% from last year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patient Satisfaction</CardTitle>
            <CardDescription>Average score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground mt-1">+2.1% from last year</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="diseases" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diseases">Common Diseases</TabsTrigger>
          <TabsTrigger value="departments">Department Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="demographics">Patient Demographics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="diseases">
          <Card>
            <CardHeader>
              <CardTitle>Most Common Diseases</CardTitle>
              <CardDescription>
                Analysis of disease prevalence over the last year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={diseaseData}
                    dataKey="count"
                    stroke="#fff"
                    fill="#8884d8"
                    nameKey="name"
                  >
                    {diseaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Treemap>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {diseaseData.slice(0, 3).map((disease, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{disease.name}</h4>
                        <span className={`text-sm ${disease.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                          {disease.change}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{disease.department}</span>
                        <span className="font-bold">{disease.count} cases</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>
                Comparison of patient load, revenue, and patient satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentPerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="patients" fill="#8884d8" name="Patients" />
                    <Bar yAxisId="right" dataKey="satisfaction" fill="#82ca9d" name="Satisfaction (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">Top Performing Departments</h4>
                <div className="space-y-2">
                  {departmentPerformance
                    .sort((a, b) => b.satisfaction - a.satisfaction)
                    .slice(0, 3)
                    .map((dept, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <h5 className="font-medium">{dept.name}</h5>
                          <p className="text-sm text-muted-foreground">{dept.patients} patients</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(dept.revenue / 1000).toFixed(0)}k revenue</p>
                          <p className="text-sm text-emerald-500">{dept.satisfaction}% satisfaction</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>
                Monthly revenue and patient trends for the current year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyRevenue}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip formatter={(value, name) => {
                      return name === 'revenue' ? `$${(value as number).toLocaleString()}` : value;
                    }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="patients" stroke="#82ca9d" name="Patients" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium">Total Annual Revenue</h4>
                    <div className="text-2xl font-bold mt-1">
                      ${monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">+8.3% from last year</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium">Average Monthly Revenue</h4>
                    <div className="text-2xl font-bold mt-1">
                      ${(monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0) / monthlyRevenue.length).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">+5.2% from last year</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium">Revenue per Patient</h4>
                    <div className="text-2xl font-bold mt-1">
                      ${(monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0) / 
                         monthlyRevenue.reduce((sum, item) => sum + item.patients, 0)).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">+3.1% from last year</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="demographics">
          <Card>
            <CardHeader>
              <CardTitle>Patient Demographics</CardTitle>
              <CardDescription>
                Age distribution of patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={patientDemographics}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {patientDemographics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, `Age ${name}`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">Key Demographics Insights</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium">Largest Patient Group</h5>
                    <p className="text-sm">Adults aged 35-50 represent 30% of all patients</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium">Growing Demographic</h5>
                    <p className="text-sm">Patients aged 18-34 increased by 8% compared to last year</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium">Demographic-specific Treatments</h5>
                    <p className="text-sm">Elderly patients (66+) require 45% more specialized care</p>
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

export default HospitalStatistics;
