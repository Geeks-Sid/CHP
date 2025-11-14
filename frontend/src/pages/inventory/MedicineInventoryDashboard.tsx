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
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { FilterIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MedicationInventory {
    medication_inventory_id: number;
    medication_name: string;
    current_stock: number;
    reorder_level: number;
    unit_of_measure: string;
    cost_per_unit?: number;
    selling_price_per_unit?: number;
    location?: string;
    supplier_id?: number;
    active: boolean;
}

interface MedicationInventoryListResponse {
    items: MedicationInventory[];
    nextCursor?: string;
}

const MedicineInventoryDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { toast } = useToast();

    // Fetch medication inventory with React Query
    const { data, isLoading, error } = useQuery<MedicationInventoryListResponse>({
        queryKey: ['medication-inventory', searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            params.append('limit', '50');
            const queryString = params.toString();
            return apiClient.get<MedicationInventoryListResponse>(`/inventory/medications${queryString ? `?${queryString}` : ''}`);
        },
    });

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Error fetching medication inventory',
            description: error instanceof ApiClientError ? error.message : 'There was a problem loading the inventory.',
        });
    }

    const items = data?.items || [];

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
                            <TableHead>Location</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Loading medication inventory...
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No medication inventory items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.medication_inventory_id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/inventory/medicine/${item.medication_inventory_id}`)}>
                                    <TableCell className="font-medium">{item.medication_name}</TableCell>
                                    <TableCell>{item.location || 'N/A'}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${item.current_stock <= item.reorder_level ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {item.current_stock} {item.unit_of_measure}
                                        </span>
                                    </TableCell>
                                    <TableCell>${item.selling_price_per_unit?.toFixed(2) || item.cost_per_unit?.toFixed(2) || 'N/A'}</TableCell>
                                    <TableCell>{item.supplier_id ? `Supplier #${item.supplier_id}` : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/inventory/medicine/${item.medication_inventory_id}/edit`);
                                        }}>
                                            Edit
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

export default MedicineInventoryDashboard;
