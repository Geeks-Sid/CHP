
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangleIcon, PackageIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

interface InventoryStatistics {
  total_products: number;
  low_stock_items: number;
  pending_orders: number;
  expiring_soon: number;
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

interface InventoryTransaction {
  transaction_id: number;
  item_type: string;
  item_id: number;
  transaction_type: string;
  quantity: number;
  created_at: string;
}

interface InventoryTransactionListResponse {
  items: InventoryTransaction[];
  nextCursor?: string;
}

const InventoryDashboard = () => {
  const { toast } = useToast();

  // Fetch statistics
  const { data: statistics, isLoading: statsLoading } = useQuery<InventoryStatistics>({
    queryKey: ['inventory-statistics'],
    queryFn: async () => {
      return apiClient.get<InventoryStatistics>('/inventory/statistics');
    },
  });

  // Fetch low stock alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery<InventoryAlertListResponse>({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      return apiClient.get<InventoryAlertListResponse>('/inventory/alerts/low-stock');
    },
  });

  // Fetch recent transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<InventoryTransactionListResponse>({
    queryKey: ['inventory-transactions'],
    queryFn: async () => {
      return apiClient.get<InventoryTransactionListResponse>('/inventory/transactions?limit=10');
    },
  });

  const lowStockItems = alertsData?.items || [];
  const recentTransactions = transactionsData?.items || [];
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{statsLoading ? '...' : statistics?.total_products || 0}</div>
              <PackageIcon className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-amber-500">{statsLoading ? '...' : statistics?.low_stock_items || 0}</div>
              <AlertTriangleIcon className="h-8 w-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-500">{statsLoading ? '...' : statistics?.pending_orders || 0}</div>
              <TrendingUpIcon className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <CardDescription>Items below their minimum threshold</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading alerts...
                    </TableCell>
                  </TableRow>
                ) : lowStockItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No low stock alerts.
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockItems.map((alert) => (
                    <TableRow key={alert.alert_id}>
                      <TableCell className="font-medium">Item #{alert.item_id}</TableCell>
                      <TableCell>{alert.item_type}</TableCell>
                      <TableCell>
                        <span className="text-red-500 font-medium">{alert.current_value || 0}</span>
                      </TableCell>
                      <TableCell>{alert.threshold || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">Order</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Last inventory movements</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No recent transactions.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((transaction) => (
                    <TableRow key={transaction.transaction_id}>
                      <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {transaction.transaction_type === 'incoming' ? (
                            <TrendingUpIcon className="h-4 w-4 mr-1 text-green-500" />
                          ) : (
                            <TrendingDownIcon className="h-4 w-4 mr-1 text-red-500" />
                          )}
                          {transaction.transaction_type}
                        </div>
                      </TableCell>
                      <TableCell>Item #{transaction.item_id} ({transaction.item_type})</TableCell>
                      <TableCell>{Math.abs(transaction.quantity)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryDashboard;
