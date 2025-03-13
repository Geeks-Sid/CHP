
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Search, ArrowUpDown, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Mock patient data
const mockPatients = [
  { id: '1', name: 'John Smith', dob: '1980-05-15', email: 'john@example.com', phone: '(555) 123-4567' },
  { id: '2', name: 'Emma Johnson', dob: '1975-10-21', email: 'emma@example.com', phone: '(555) 234-5678' },
  { id: '3', name: 'Michael Brown', dob: '1990-02-08', email: 'michael@example.com', phone: '(555) 345-6789' },
  { id: '4', name: 'Olivia Davis', dob: '1985-07-30', email: 'olivia@example.com', phone: '(555) 456-7890' },
  { id: '5', name: 'William Wilson', dob: '1978-12-12', email: 'william@example.com', phone: '(555) 567-8901' },
  { id: '6', name: 'Sophia Martinez', dob: '1995-03-25', email: 'sophia@example.com', phone: '(555) 678-9012' },
  { id: '7', name: 'James Taylor', dob: '1982-09-17', email: 'james@example.com', phone: '(555) 789-0123' },
  { id: '8', name: 'Isabella Anderson', dob: '1988-06-05', email: 'isabella@example.com', phone: '(555) 890-1234' },
];

interface Patient {
  id: string;
  name: string;
  dob: string;
  email: string;
  phone: string;
}

const PatientsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch patients
    const fetchPatients = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPatients(mockPatients);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching patients',
          description: 'There was a problem loading the patient list.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [toast]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewPatient = (id: string) => {
    navigate(`/patients/${id}`);
  };

  const formatDateOfBirth = (dob: string) => {
    return new Date(dob).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage and view patient information</p>
        </div>
        {user?.role === 'receptionist' && (
          <Button onClick={() => navigate('/patients/new')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Patient
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border glass-panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading patients...</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-muted-foreground">No patients found</p>
                    {searchQuery && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSearchQuery('')}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map(patient => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{formatDateOfBirth(patient.dob)}</TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewPatient(patient.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PatientsList;
