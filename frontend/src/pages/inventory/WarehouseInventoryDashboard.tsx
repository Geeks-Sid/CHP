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

interface WarehouseItem {
    warehouse_item_id: number;
    item_name: string;
    category?: string;
    current_stock: number;
    reorder_level: number;
    unit_of_measure: string;
    cost_per_unit?: number;
    location?: string;
    supplier_id?: number;
    active: boolean;
}

interface WarehouseItemListResponse {
    items: WarehouseItem[];
    nextCursor?: string;
}

interface InventoryAlert {
    alert_id: number;
    item_type: string;
    item_id: number;
    alert_type: string;
    threshold?: number;
    current_value?: number;
    status: string;
}

interface InventoryAlertListResponse {
    items: InventoryAlert[];
}

const WarehouseInventoryDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { toast } = useToast();

    // Fetch warehouse items with React Query
    const { data, isLoading, error } = useQuery<WarehouseItemListResponse>({
        queryKey: ['warehouse-items', searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            params.append('limit', '50');
            const queryString = params.toString();
            return apiClient.get<WarehouseItemListResponse>(`/inventory/warehouse${queryString ? `?${queryString}` : ''}`);
        },
    });

    // Fetch warehouse alerts
    const { data: alertsData } = useQuery<InventoryAlertListResponse>({
        queryKey: ['warehouse-alerts'],
        queryFn: async () => {
            return apiClient.get<InventoryAlertListResponse>('/inventory/alerts/low-stock?item_type=warehouse');
        },
    });

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Error fetching warehouse inventory',
            description: error instanceof ApiClientError ? error.message : 'There was a problem loading the inventory.',
        });
    }

    const items = data?.items || [];
    const alerts = alertsData?.items || [];

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Warehouse Inventory</h1>
                <Button onClick={() => navigate('/inventory/warehouse/new')}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Item
                </Button>
            </div>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">Alerts</h2>
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <div key={alert.alert_id} className="p-3 rounded-md bg-red-100 text-red-800">
                                <span className="font-medium">Low Stock:</span> Item ID {alert.item_id} - Current stock ({alert.current_value}) is below threshold ({alert.threshold})
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Loading warehouse inventory...
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No warehouse items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.warehouse_item_id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/inventory/warehouse/${item.warehouse_item_id}`)}>
                                    <TableCell className="font-medium">{item.item_name}</TableCell>
                                    <TableCell>{item.category || 'N/A'}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${item.current_stock <= item.reorder_level ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {item.current_stock} {item.unit_of_measure}
                                        </span>
                                    </TableCell>
                                    <TableCell>${item.cost_per_unit?.toFixed(2) || 'N/A'}</TableCell>
                                    <TableCell>{item.supplier_id ? `Supplier #${item.supplier_id}` : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/inventory/warehouse/${item.warehouse_item_id}/edit`);
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

export default WarehouseInventoryDashboard;
