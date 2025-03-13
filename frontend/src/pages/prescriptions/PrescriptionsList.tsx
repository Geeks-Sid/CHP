
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, SearchIcon, FilterIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';

// Mock data for prescriptions
const mockPrescriptions = [
  { 
    id: '1', 
    patientName: 'John Doe', 
    medication: 'Amoxicillin', 
    dosage: '500mg', 
    frequency: 'Every 8 hours', 
    prescribedBy: 'Dr. Michael', 
    date: '2023-09-15', 
    status: 'Pending' 
  },
  { 
    id: '2', 
    patientName: 'Jane Smith', 
    medication: 'Lisinopril', 
    dosage: '10mg', 
    frequency: 'Once daily', 
    prescribedBy: 'Dr. Michael', 
    date: '2023-09-14', 
    status: 'Filled' 
  },
  { 
    id: '3', 
    patientName: 'Robert Johnson', 
    medication: 'Metformin', 
    dosage: '1000mg', 
    frequency: 'Twice daily', 
    prescribedBy: 'Dr. Michael', 
    date: '2023-09-13', 
    status: 'Pending' 
  },
  { 
    id: '4', 
    patientName: 'Emily Davis', 
    medication: 'Atorvastatin', 
    dosage: '20mg', 
    frequency: 'Once daily at bedtime', 
    prescribedBy: 'Dr. Michael', 
    date: '2023-09-12', 
    status: 'Filled' 
  },
];

const PrescriptionsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const filteredPrescriptions = mockPrescriptions.filter(
    (prescription) => {
      const matchesSearch = 
        prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.prescribedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || prescription.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prescriptions</h1>
        {user?.role === 'clinician' && (
          <Button onClick={() => navigate('/prescriptions/new')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Prescription
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={statusFilter === null ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'Pending' ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter('Pending')}
          >
            <ClockIcon className="h-4 w-4 mr-1" />
            Pending
          </Button>
          <Button 
            variant={statusFilter === 'Filled' ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter('Filled')}
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Filled
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Medication</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Prescribed By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrescriptions.map((prescription) => (
              <TableRow key={prescription.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/prescriptions/${prescription.id}`)}>
                <TableCell className="font-medium">{prescription.patientName}</TableCell>
                <TableCell>{prescription.medication}</TableCell>
                <TableCell>{prescription.dosage}, {prescription.frequency}</TableCell>
                <TableCell>{prescription.prescribedBy}</TableCell>
                <TableCell>{prescription.date}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    prescription.status === 'Pending' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {prescription.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {user?.role === 'pharmacy' && prescription.status === 'Pending' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Logic to fill prescription would go here
                        alert(`Prescription ${prescription.id} marked as filled`);
                      }}
                    >
                      Fill
                    </Button>
                  )}
                  {user?.role === 'clinician' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/prescriptions/${prescription.id}/edit`);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PrescriptionsList;
