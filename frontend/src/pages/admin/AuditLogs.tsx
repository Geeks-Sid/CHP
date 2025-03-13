
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, Filter, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Mock data for audit logs
const mockAuditLogs = [
  {
    id: "1",
    timestamp: new Date("2023-06-15T09:32:45"),
    user: "Admin Superuser",
    userId: "5",
    action: "login",
    resource: "system",
    details: "Successful login from 192.168.1.105",
    severity: "info"
  },
  {
    id: "2",
    timestamp: new Date("2023-06-15T10:15:22"),
    user: "Dr. Michael",
    userId: "3",
    action: "update",
    resource: "patient",
    details: "Updated patient record ID: 1042",
    severity: "info"
  },
  {
    id: "3",
    timestamp: new Date("2023-06-15T11:05:37"),
    user: "Sarah Receptionist",
    userId: "2",
    action: "create",
    resource: "appointment",
    details: "Created new appointment ID: 3089",
    severity: "info"
  },
  {
    id: "4",
    timestamp: new Date("2023-06-15T13:45:10"),
    user: "System",
    userId: "0",
    action: "error",
    resource: "database",
    details: "Database connection timeout",
    severity: "error"
  },
  {
    id: "5",
    timestamp: new Date("2023-06-15T14:22:56"),
    user: "Med Pharmacy",
    userId: "4",
    action: "update",
    resource: "inventory",
    details: "Updated medication stock: Amoxicillin",
    severity: "info"
  },
  {
    id: "6",
    timestamp: new Date("2023-06-15T15:11:33"),
    user: "Admin Superuser",
    userId: "5",
    action: "delete",
    resource: "user",
    details: "Deleted user account: john.doe@example.com",
    severity: "warning"
  },
  {
    id: "7",
    timestamp: new Date("2023-06-15T16:02:45"),
    user: "Dr. Michael",
    userId: "3",
    action: "create",
    resource: "prescription",
    details: "Created new prescription ID: 2056",
    severity: "info"
  },
  {
    id: "8",
    timestamp: new Date("2023-06-15T17:30:12"),
    user: "System",
    userId: "0",
    action: "warning",
    resource: "system",
    details: "High CPU usage detected",
    severity: "warning"
  },
  {
    id: "9",
    timestamp: new Date("2023-06-15T18:15:47"),
    user: "Admin Superuser",
    userId: "5",
    action: "update",
    resource: "settings",
    details: "Updated system settings: Security policy",
    severity: "info"
  },
  {
    id: "10",
    timestamp: new Date("2023-06-15T19:05:22"),
    user: "Sarah Receptionist",
    userId: "2",
    action: "view",
    resource: "medical-record",
    details: "Accessed medical record ID: 5089",
    severity: "info"
  }
];

const AuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredLogs = mockAuditLogs.filter(log => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply date filter
    const matchesDate = !date || format(log.timestamp, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    
    // Apply action filter
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    // Apply severity filter
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    
    return matchesSearch && matchesDate && matchesAction && matchesSeverity;
  });

  // Get unique actions for the filter
  const actions = ['all', ...Array.from(new Set(mockAuditLogs.map(log => log.action)))];
  
  // Get unique severities for the filter
  const severities = ['all', ...Array.from(new Set(mockAuditLogs.map(log => log.severity)))];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-500 text-white';
      case 'update':
        return 'bg-blue-500 text-white';
      case 'delete':
        return 'bg-red-500 text-white';
      case 'login':
        return 'bg-purple-500 text-white';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'view':
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Filter by date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                {actions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action === 'all' ? 'All actions' : action.charAt(0).toUpperCase() + action.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                {severities.map(severity => (
                  <SelectItem key={severity} value={severity}>
                    {severity === 'all' ? 'All severities' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                      {log.details}
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          <div className="flex items-center justify-end space-x-2 py-4">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
