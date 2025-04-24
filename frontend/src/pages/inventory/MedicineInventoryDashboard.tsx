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

// Mock data for medicine inventory
const mockMedicineItems = [
    { id: '1', name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 300, price: 10.50, supplier: 'GlobalPharma' },
    { id: '2', name: 'Lisinopril 10mg', category: 'Blood Pressure', stock: 450, price: 14.00, supplier: 'MediCare' },
    { id: '3', name: 'Metformin 850mg', category: 'Diabetes', stock: 280, price: 11.25, supplier: 'HealthBridge' },
    { id: '4', name: 'Atorvastatin 20mg', category: 'Cholesterol', stock: 150, price: 18.75, supplier: 'GlobalPharma' },
    { id: '5', name: 'Albuterol Inhaler', category: 'Respiratory', stock: 120, price: 25.00, supplier: 'MediCare' },
];

const MedicineInventoryDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const filteredItems = mockMedicineItems.filter(
        (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Medicine Inventory</h1>
                <Button onClick={() => navigate('/inventory/medicine/new')}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Medicine
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search medicines..."
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
                        {filteredItems.map((item) => (
                            <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/inventory/medicine/${item.id}`)}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${item.stock < 100 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {item.stock} units
                                    </span>
                                </TableCell>
                                <TableCell>${item.price.toFixed(2)}</TableCell>
                                <TableCell>{item.supplier}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/inventory/medicine/${item.id}/edit`);
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

export default MedicineInventoryDashboard;
