# Inventory Pages Analysis

## Current Status

All three inventory pages (`WarehouseInventoryDashboard`, `MedicineInventoryDashboard`, and `InventoryDashboard`) are **completely disconnected from the backend** and use **mock data only**.

## Issues Identified

### 1. **No Database Tables**
The database migrations show **NO inventory-related tables** exist:
- ❌ No `inventory` table
- ❌ No `warehouse_items` table  
- ❌ No `medicine_inventory` table
- ❌ No `stock_levels` table
- ❌ No `inventory_transactions` table
- ❌ No `suppliers` table
- ❌ No `reorder_levels` table

**Existing tables:**
- ✅ `drug_exposure` - This is for **patient medication records** (medications given to patients), NOT inventory management
- ✅ `person`, `visit_occurrence`, `procedure_occurrence`, `document`, etc.

### 2. **No Backend APIs**
The API documentation shows **NO inventory endpoints**:
- ❌ No `GET /inventory` endpoint
- ❌ No `GET /inventory/medications` endpoint
- ❌ No `POST /inventory/medications` endpoint
- ❌ No `PUT /inventory/[id]` endpoint
- ❌ No warehouse management endpoints
- ❌ No stock level tracking endpoints
- ❌ No low stock alert endpoints
- ❌ No inventory transaction endpoints

**Note:** The `/medications` API endpoint is for **drug exposures** (tracking medications given to patients), not inventory management.

### 3. **Mock Data Usage**
All three pages use hardcoded mock data:

**WarehouseInventoryDashboard.tsx:**
- `mockWarehouseItems` - Hardcoded array
- `mockWarehouseAlerts` - Hardcoded alerts
- No API calls whatsoever

**MedicineInventoryDashboard.tsx:**
- `mockMedicineItems` - Hardcoded array
- No API calls whatsoever

**InventoryDashboard.tsx:**
- `lowStockItems` - Hardcoded array
- `recentTransactions` - Hardcoded array
- Hardcoded statistics (248 products, 12 low stock, 8 pending orders)
- No API calls whatsoever

### 4. **Table Structure Mismatch**
The mock data structure doesn't align with medical inventory needs:

**Current Mock Structure:**
```typescript
{
  id: string,
  name: string,
  category: string,
  stock: number,
  price: number,
  supplier: string
}
```

**What Medical Inventory Needs:**
- Drug concept ID (for terminology integration)
- Batch/lot numbers
- Expiration dates
- Storage location/warehouse
- Reorder levels
- Unit of measure
- Cost vs. selling price
- Supplier information
- Transaction history
- Stock movements (incoming/outgoing)

## Missing Features

### Database Tables Needed:
1. **`medication_inventory`** - Medicine stock levels
   - drug_concept_id (link to concept table)
   - current_stock
   - reorder_level
   - unit_of_measure
   - cost_per_unit
   - location/warehouse
   - expiration tracking

2. **`warehouse_items`** - Non-medication inventory
   - item_name
   - category
   - current_stock
   - reorder_level
   - supplier_id
   - location

3. **`inventory_transactions`** - Stock movements
   - item_id
   - transaction_type (incoming/outgoing/adjustment)
   - quantity
   - reference_id (prescription_id, order_id, etc.)
   - user_id
   - timestamp

4. **`suppliers`** - Supplier information
   - supplier_name
   - contact_info
   - active status

5. **`inventory_alerts`** - Low stock alerts
   - item_id
   - alert_type
   - threshold
   - status

### Backend APIs Needed:
1. **Inventory Management:**
   - `GET /inventory/medications` - List medicine inventory
   - `GET /inventory/warehouse` - List warehouse items
   - `POST /inventory/medications` - Add medicine to inventory
   - `POST /inventory/warehouse` - Add warehouse item
   - `PATCH /inventory/medications/:id` - Update medicine stock
   - `PATCH /inventory/warehouse/:id` - Update warehouse item stock
   - `GET /inventory/medications/:id` - Get medicine details
   - `GET /inventory/warehouse/:id` - Get warehouse item details

2. **Stock Management:**
   - `POST /inventory/transactions` - Record stock movement
   - `GET /inventory/transactions` - List transactions
   - `GET /inventory/low-stock` - Get low stock alerts
   - `POST /inventory/adjust` - Manual stock adjustment

3. **Reports:**
   - `GET /inventory/reports/stock-levels` - Stock level report
   - `GET /inventory/reports/expiring` - Expiring medications
   - `GET /inventory/reports/turnover` - Inventory turnover

## Compatibility Assessment

### ❌ **NOT Compatible** - Current State

The inventory pages are **not compatible** with medical inventory management because:

1. **No Backend Support** - Zero database tables and zero APIs
2. **Mock Data Only** - All data is hardcoded, no persistence
3. **Wrong Data Model** - Mock structure doesn't match medical inventory needs
4. **No Integration** - Completely isolated from the rest of the system
5. **Missing Critical Features:**
   - No expiration date tracking
   - No batch/lot number tracking
   - No integration with prescriptions (can't decrement stock when dispensing)
   - No supplier management
   - No transaction history
   - No low stock alerts from real data
   - No integration with terminology (drug concepts)

## Recommendations

### Option 1: Remove Inventory Pages (Temporary)
If inventory management is not a priority, consider removing or hiding these pages until backend support is implemented.

### Option 2: Implement Full Inventory System
1. **Create Database Tables** (new migration):
   - `medication_inventory`
   - `warehouse_items`
   - `inventory_transactions`
   - `suppliers`
   - `inventory_alerts`

2. **Create Backend APIs**:
   - Full CRUD for inventory items
   - Stock transaction tracking
   - Low stock alerts
   - Integration with prescriptions (auto-decrement stock)

3. **Update Frontend Pages**:
   - Replace mock data with real API calls
   - Add proper error handling
   - Add loading states
   - Integrate with terminology service for drug concepts
   - Add expiration date tracking
   - Add batch/lot number support

### Option 3: Simplify to Basic Tracking
If full inventory is too complex, implement a simplified version:
- Basic stock levels for medications
- Simple increment/decrement operations
- Low stock alerts
- Basic transaction log

## Conclusion

**The inventory pages are currently non-functional placeholders** with no backend support. They need significant backend development (database tables + APIs) before they can be used for actual medical inventory management.

