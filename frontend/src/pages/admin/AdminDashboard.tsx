
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  ActivityIcon, 
  UsersIcon, 
  CalendarIcon, 
  PillIcon, 
  DollarSignIcon,
  BedIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  ClipboardListIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const AdminDashboard = () => {
  // Mock data for hospital overview
  const overviewData = [
    { name: 'Patients', count: 1872, icon: UsersIcon, color: 'bg-blue-100 text-blue-700' },
    { name: 'Staff', count: 246, icon: UsersIcon, color: 'bg-green-100 text-green-700' },
    { name: 'Beds', count: 320, icon: BedIcon, color: 'bg-purple-100 text-purple-700' },
    { name: 'Occupancy', count: '78%', icon: BedIcon, color: 'bg-amber-100 text-amber-700' },
    { name: 'Daily Appointments', count: 187, icon: CalendarIcon, color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Emergency Cases', count: 32, icon: AlertTriangleIcon, color: 'bg-red-100 text-red-700' },
  ];

  // Mock data for financial overview
  const revenueData = [
    { month: 'Jan', revenue: 420000 },
    { month: 'Feb', revenue: 460000 },
    { month: 'Mar', revenue: 480000 },
    { month: 'Apr', revenue: 520000 },
    { month: 'May', revenue: 540000 },
    { month: 'Jun', revenue: 580000 },
    { month: 'Jul', revenue: 620000 },
    { month: 'Aug', revenue: 640000 },
    { month: 'Sep', revenue: 700000 },
    { month: 'Oct', revenue: 720000 },
    { month: 'Nov', revenue: 740000 },
    { month: 'Dec', revenue: 780000 },
  ];

  // Mock data for department distribution
  const departmentData = [
    { name: 'Cardiology', value: 28 },
    { name: 'Neurology', value: 20 },
    { name: 'Orthopedics', value: 16 },
    { name: 'Oncology', value: 12 },
    { name: 'Pediatrics', value: 14 },
    { name: 'Others', value: 10 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Critical alerts
  const alerts = [
    { id: 1, type: 'Low Stock', message: 'Insulin supplies running low (15% remaining)', severity: 'high' },
    { id: 2, type: 'Staff Shortage', message: 'Cardiology department understaffed for next week', severity: 'medium' },
    { id: 3, type: 'System Update', message: 'Scheduled maintenance on Oct 15th, 02:00 - 04:00 AM', severity: 'low' },
  ];

  // Recent activities
  const activities = [
    { id: 1, action: 'New staff onboarded', details: 'Dr. Emily Chen joined Neurology department', time: '2 hours ago' },
    { id: 2, action: 'System settings updated', details: 'Changed appointment scheduling rules', time: '5 hours ago' },
    { id: 3, action: 'Inventory updated', details: 'Received shipment of medical supplies', time: '8 hours ago' },
    { id: 4, action: 'Policy updated', details: 'Updated visitor policy for ICU', time: 'Yesterday' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete hospital management overview and controls</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button>System Status</Button>
        </div>
      </div>

      {/* Hospital Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {overviewData.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`${item.color} p-3 rounded-full mb-3`}>
                <item.icon size={24} />
              </div>
              <p className="text-sm text-muted-foreground">{item.name}</p>
              <h3 className="text-2xl font-bold">{item.count}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Financial Overview */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Hospital Revenue</CardTitle>
            <CardDescription>Annual financial overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(6700000)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600 font-medium">Expenses</p>
                <p className="text-xl font-bold">{formatCurrency(4200000)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-600 font-medium">Net Profit</p>
                <p className="text-xl font-bold">{formatCurrency(2500000)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Patient allocation by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {departmentData.map((dept, index) => (
                <div key={index} className="text-xs flex items-center">
                  <div className="w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="truncate">{dept.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <AlertTriangleIcon className="mr-2 h-5 w-5 text-red-500" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg ${
                    alert.severity === 'high' ? 'bg-red-50 border-l-4 border-red-500' :
                    alert.severity === 'medium' ? 'bg-amber-50 border-l-4 border-amber-500' :
                    'bg-blue-50 border-l-4 border-blue-500'
                  }`}
                >
                  <div className="font-medium">{alert.type}</div>
                  <div className="text-sm text-gray-600">{alert.message}</div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">View All Alerts</Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <ActivityIcon className="mr-2 h-5 w-5 text-indigo-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border-b pb-3 last:border-0">
                  <div className="font-medium">{activity.action}</div>
                  <div className="text-sm text-gray-600">{activity.details}</div>
                  <div className="text-xs text-gray-400 mt-1">{activity.time}</div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">View Activity Log</Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-auto py-4 flex flex-col items-center justify-center">
                <UsersIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Manage Users</span>
              </Button>
              <Button className="h-auto py-4 flex flex-col items-center justify-center">
                <BedIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Bed Allocation</span>
              </Button>
              <Button className="h-auto py-4 flex flex-col items-center justify-center">
                <PillIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Inventory</span>
              </Button>
              <Button className="h-auto py-4 flex flex-col items-center justify-center">
                <ClipboardListIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Reports</span>
              </Button>
              <Button className="h-auto py-4 flex flex-col items-center justify-center">
                <TrendingUpIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Analytics</span>
              </Button>
              <Button className="h-auto py-4 flex flex-col items-center justify-center">
                <DollarSignIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Billing</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
