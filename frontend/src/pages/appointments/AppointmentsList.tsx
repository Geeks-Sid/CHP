
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";

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

interface VisitListResponse {
  items: Visit[];
  nextCursor?: string;
}

const AppointmentsList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch visits/appointments
  const { data, isLoading, error } = useQuery<VisitListResponse>({
    queryKey: ['visits', searchQuery, user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Filter by provider if user is a clinician
      if (user?.role === 'clinician' && user?.id) {
        params.append('provider_id', user.id);
      }

      // Filter by patient if user is a patient
      if (user?.role === 'patient') {
        // Note: We'd need to get person_id from user, but for now show all
        // In a real implementation, you'd link user to person_id
      }

      params.append('limit', '50');

      // Add date filter to show upcoming and recent visits
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      params.append('date_from', today.toISOString());

      const queryString = params.toString();
      return apiClient.get<VisitListResponse>(`/visits${queryString ? `?${queryString}` : ''}`);
    },
    enabled: !!user,
  });

  // Delete/Cancel visit mutation
  const cancelVisitMutation = useMutation({
    mutationFn: async (visitId: number) => {
      // Update visit to mark as cancelled (set visit_end to now)
      const now = new Date().toISOString();
      return apiClient.patch(`/visits/${visitId}`, {
        visit_end: now,
        reason: 'Cancelled',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast({
        title: "Appointment Cancelled",
        description: "The appointment has been cancelled successfully.",
      });
    },
    onError: (error: ApiClientError) => {
      toast({
        variant: 'destructive',
        title: "Error",
        description: error.message || 'Failed to cancel appointment',
      });
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching appointments',
        description: error instanceof ApiClientError ? error.message : 'Failed to load appointments',
      });
    }
  }, [error, toast]);

  const visits = data?.items || [];

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const getStatus = (visit: Visit) => {
    if (visit.visit_end) {
      return 'Completed';
    }
    const visitDate = new Date(visit.visit_start);
    const now = new Date();
    if (visitDate < now) {
      return 'In Progress';
    }
    return 'Scheduled';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredVisits = visits.filter(visit => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      visit.visit_number.toLowerCase().includes(query) ||
      visit.reason?.toLowerCase().includes(query) ||
      visit.visit_type.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage patient visits and appointments</p>
        </div>
        {(user?.role === 'receptionist' || user?.role === 'clinician') && (
          <Link to="/appointments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by visit number, reason, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      ) : filteredVisits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {searchQuery ? 'No appointments found matching your search' : 'No appointments found'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVisits.map((visit) => {
            const status = getStatus(visit);
            return (
              <Card key={visit.visit_occurrence_id} className="overflow-hidden">
                <CardHeader className={`${status === 'Scheduled' ? 'bg-blue-50' :
                    status === 'Completed' ? 'bg-green-50' :
                      'bg-yellow-50'
                  }`}>
                  <CardTitle className="flex justify-between items-center">
                    <span>Visit #{visit.visit_number}</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Date:</strong> {formatDate(visit.visit_start)}
                    </p>
                    <p className="text-sm">
                      <strong>Time:</strong> {formatTime(visit.visit_start)}
                    </p>
                    <p className="text-sm">
                      <strong>Type:</strong> {visit.visit_type}
                    </p>
                    {visit.reason && (
                      <p className="text-sm">
                        <strong>Reason:</strong> {visit.reason}
                      </p>
                    )}
                    <div className="flex space-x-2 mt-4">
                      <Link to={`/appointments/${visit.visit_occurrence_id}`} className="flex-1">
                        <Button variant="outline" className="w-full">View/Edit</Button>
                      </Link>
                      {status === 'Scheduled' && (user?.role === 'receptionist' || user?.role === 'clinician') && (
                        <Button
                          variant="destructive"
                          onClick={() => cancelVisitMutation.mutate(visit.visit_occurrence_id)}
                          disabled={cancelVisitMutation.isPending}
                          className="flex-1"
                        >
                          {cancelVisitMutation.isPending ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
