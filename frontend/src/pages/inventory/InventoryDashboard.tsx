
import { useState } from 'react';
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
import { BarChartIcon, TrendingDownIcon, TrendingUpIcon, AlertTriangleIcon, PackageIcon } from 'lucide-react';

// Mock data
const lowStockItems = [
  { id: '1', name: 'Albuterol', category: 'Respiratory', stock: 20, threshold: 50 },
  { id: '2', name: 'Atorvastatin', category: 'Cholesterol', stock: 15, threshold: 40 },
  { id: '3', name: 'Hydrochlorothiazide', category: 'Diuretic', stock: 8, threshold: 30 },
];

const recentTransactions = [
  { id: '1', date: '2023-09-15', type: 'Incoming', product: 'Amoxicillin', quantity: 50, supplier: 'PharmaCorp' },
  { id: '2', date: '2023-09-14', type: 'Outgoing', product: 'Lisinopril', quantity: 10, supplier: 'N/A' },
  { id: '3', date: '2023-09-13', type: 'Incoming', product: 'Metformin', quantity: 100, supplier: 'MediSupply' },
  { id: '4', date: '2023-09-12', type: 'Outgoing', product: 'Atorvastatin', quantity: 25, supplier: 'N/A' },
];

const InventoryDashboard = () => {
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
              <div className="text-2xl font-bold">248</div>
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
              <div className="text-2xl font-bold text-amber-500">12</div>
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
              <div className="text-2xl font-bold text-blue-500">8</div>
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
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <span className="text-red-500 font-medium">{item.stock}</span>
                    </TableCell>
                    <TableCell>{item.threshold}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">Order</Button>
                    </TableCell>
                  </TableRow>
                ))}
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
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {transaction.type === 'Incoming' ? (
                          <TrendingUpIcon className="h-4 w-4 mr-1 text-green-500" />
                        ) : (
                          <TrendingDownIcon className="h-4 w-4 mr-1 text-red-500" />
                        )}
                        {transaction.type}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.product}</TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryDashboard;
