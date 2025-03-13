
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import {
  PlusIcon,
  SearchIcon,
  UserIcon,
  EditIcon,
  TrashIcon,
  ShieldIcon,
  EyeIcon,
  MoreHorizontalIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react';
import { UserRole } from '@/context/AuthContext';

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
};

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Mock data for users
  const users: User[] = [
    { 
      id: '1', 
      name: 'Dr. John Smith', 
      email: 'john.smith@hospital.com', 
      role: 'clinician', 
      department: 'Cardiology',
      status: 'active',
      lastActive: '10 minutes ago'
    },
    { 
      id: '2', 
      name: 'Sarah Johnson', 
      email: 'sarah.j@hospital.com', 
      role: 'receptionist', 
      department: 'Front Desk',
      status: 'active',
      lastActive: '2 hours ago'
    },
    { 
      id: '3', 
      name: 'Michael Roberts', 
      email: 'michael.r@hospital.com', 
      role: 'admin', 
      department: 'Administration',
      status: 'active',
      lastActive: '5 minutes ago'
    },
    { 
      id: '4', 
      name: 'Emily Chen', 
      email: 'emily.chen@hospital.com', 
      role: 'clinician', 
      department: 'Neurology',
      status: 'active',
      lastActive: '1 day ago'
    },
    { 
      id: '5', 
      name: 'James Wilson', 
      email: 'james.w@hospital.com', 
      role: 'pharmacy', 
      department: 'Pharmacy',
      status: 'active',
      lastActive: '3 hours ago'
    },
    { 
      id: '6', 
      name: 'Linda Martinez', 
      email: 'linda.m@hospital.com', 
      role: 'clinician', 
      department: 'Pediatrics',
      status: 'suspended',
      lastActive: '2 weeks ago'
    },
    { 
      id: '7', 
      name: 'Robert Johnson', 
      email: 'robert.j@hospital.com', 
      role: 'patient', 
      status: 'active',
      lastActive: '1 day ago'
    },
    { 
      id: '8', 
      name: 'Patricia Lewis', 
      email: 'patricia.l@hospital.com', 
      role: 'receptionist', 
      department: 'Emergency',
      status: 'inactive',
      lastActive: '1 month ago'
    },
    { 
      id: '9', 
      name: 'David Kim', 
      email: 'david.k@hospital.com', 
      role: 'clinician', 
      department: 'Orthopedics',
      status: 'active',
      lastActive: '4 hours ago'
    },
    { 
      id: '10', 
      name: 'Susan Miller', 
      email: 'susan.m@hospital.com', 
      role: 'pharmacy', 
      department: 'Pharmacy',
      status: 'active',
      lastActive: '2 days ago'
    },
  ];

  // Filter users based on search term, role and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'clinician': return 'bg-green-100 text-green-800';
      case 'receptionist': return 'bg-purple-100 text-purple-800';
      case 'patient': return 'bg-blue-100 text-blue-800';
      case 'pharmacy': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: 'active' | 'inactive' | 'suspended') => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all system users, roles, and permissions</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Add New User</SheetTitle>
              <SheetDescription>
                Create a new user account with specific role and permissions.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="clinician">Clinician</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department
                </Label>
                <Input id="department" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input id="password" type="password" className="col-span-3" />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline">Cancel</Button>
              <Button>Create User</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>Manage all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative w-full md:w-1/3">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search users..." 
                className="pl-10"
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-4">
              <div>
                <Label htmlFor="roleFilter" className="sr-only">Filter by Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="roleFilter" className="w-[160px]">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="clinician">Clinician</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statusFilter" className="sr-only">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="statusFilter" className="w-[160px]">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{user.lastActive}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className={user.role === 'admin' ? 'text-destructive/50 cursor-not-allowed' : 'text-destructive'} disabled={user.role === 'admin'}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>User counts by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-red-500 rounded-full mr-3"></div>
                  <span>Administrators</span>
                </div>
                <div className="font-bold">1</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-green-500 rounded-full mr-3"></div>
                  <span>Clinicians</span>
                </div>
                <div className="font-bold">4</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-purple-500 rounded-full mr-3"></div>
                  <span>Receptionists</span>
                </div>
                <div className="font-bold">2</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-orange-500 rounded-full mr-3"></div>
                  <span>Pharmacy Staff</span>
                </div>
                <div className="font-bold">2</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-blue-500 rounded-full mr-3"></div>
                  <span>Patients</span>
                </div>
                <div className="font-bold">1</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Staff allocation by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-blue-500 rounded-full mr-3"></div>
                  <span>Cardiology</span>
                </div>
                <div className="font-bold">1</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-purple-500 rounded-full mr-3"></div>
                  <span>Neurology</span>
                </div>
                <div className="font-bold">1</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-green-500 rounded-full mr-3"></div>
                  <span>Pediatrics</span>
                </div>
                <div className="font-bold">1</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-orange-500 rounded-full mr-3"></div>
                  <span>Pharmacy</span>
                </div>
                <div className="font-bold">2</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-yellow-500 rounded-full mr-3"></div>
                  <span>Other Departments</span>
                </div>
                <div className="font-bold">4</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
