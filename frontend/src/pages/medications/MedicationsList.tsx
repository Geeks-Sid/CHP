
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for medications
const mockMedications = [
  { id: '1', name: 'Amoxicillin', category: 'Antibiotic', stock: 150, price: 8.99, supplier: 'PharmaCorp' },
  { id: '2', name: 'Lisinopril', category: 'Blood Pressure', stock: 200, price: 12.50, supplier: 'MediSupply' },
  { id: '3', name: 'Metformin', category: 'Diabetes', stock: 120, price: 9.75, supplier: 'HealthPharm' },
  { id: '4', name: 'Atorvastatin', category: 'Cholesterol', stock: 80, price: 15.25, supplier: 'PharmaCorp' },
  { id: '5', name: 'Albuterol', category: 'Respiratory', stock: 60, price: 22.99, supplier: 'MediSupply' },
];

const MedicationsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredMedications = mockMedications.filter(
    (medication) =>
      medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Medications</h1>
        <Button onClick={() => navigate('/medications/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <FilterIcon className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedications.map((medication) => (
              <TableRow key={medication.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/medications/${medication.id}`)}>
                <TableCell className="font-medium">{medication.name}</TableCell>
                <TableCell>{medication.category}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${medication.stock < 100 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {medication.stock} units
                  </span>
                </TableCell>
                <TableCell>${medication.price.toFixed(2)}</TableCell>
                <TableCell>{medication.supplier}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/medications/${medication.id}/edit`);
                  }}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MedicationsList;
