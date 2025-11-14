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
import { FilterIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data for warehouse items
const mockWarehouseItems = [
    { id: '1', name: 'Medical Gloves (Box)', category: 'Supplies', stock: 500, price: 15.00, supplier: 'SupplyCo' },
    { id: '2', name: 'Bedpan', category: 'Equipment', stock: 100, price: 25.50, supplier: 'MediEquip' },
    { id: '3', name: 'Sterile Wipes (Pack)', category: 'Supplies', stock: 300, price: 5.75, supplier: 'SupplyCo' },
    { id: '4', name: 'Wheelchair', category: 'Equipment', stock: 20, price: 150.00, supplier: 'MediEquip' },
    { id: '5', name: 'First Aid Kit', category: 'Supplies', stock: 75, price: 30.00, supplier: 'HealthSupply' },
];

// Mock data for warehouse alerts
const mockWarehouseAlerts = [
    { id: 'a1', type: 'Low Stock', item: 'Medical Gloves (Box)', message: 'Stock is below reorder level.' },
    { id: 'a2', type: 'Order Incoming', item: 'Bedpan', message: 'Expected delivery in 2 days.' },
    { id: 'a3', type: 'Stocked', item: 'Sterile Wipes (Pack)', message: 'Inventory level is healthy.' },
    { id: 'a4', type: 'Order Placed', item: 'Wheelchair', message: 'New order placed with MediEquip.' },
];

const WarehouseInventoryDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const filteredItems = mockWarehouseItems.filter(
        (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Warehouse Inventory</h1>
                <Button onClick={() => navigate('/inventory/warehouse/new')}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Item
                </Button>
            </div>

            {/* Mock Alerts Section */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Alerts</h2>
                <div className="space-y-3">
                    {mockWarehouseAlerts.map(alert => (
                        <div key={alert.id} className={`p-3 rounded-md ${alert.type === 'Low Stock' ? 'bg-red-100 text-red-800' :
                            alert.type === 'Order Incoming' ? 'bg-yellow-100 text-yellow-800' :
                                alert.type === 'Stocked' ? 'bg-green-100 text-green-800' :
                                    'bg-blue-100 text-blue-800'
                            }`}>
                            <span className="font-medium">{alert.type}:</span> {alert.item} - {alert.message}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search items..."
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
                            <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/inventory/warehouse/${item.id}`)}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${item.stock < 50 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {item.stock} units
                                    </span>
                                </TableCell>
                                <TableCell>${item.price.toFixed(2)}</TableCell>
                                <TableCell>{item.supplier}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/inventory/warehouse/${item.id}/edit`);
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

export default WarehouseInventoryDashboard;
