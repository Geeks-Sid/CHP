import { ApiProperty } from '@nestjs/swagger';

export class MedicationInventoryResponseDto {
    @ApiProperty({ example: 1 })
    medication_inventory_id: number;

    @ApiProperty({ example: 19122137, required: false })
    drug_concept_id?: number;

    @ApiProperty({ example: 'Amoxicillin 500mg' })
    medication_name: string;

    @ApiProperty({ example: 300 })
    current_stock: number;

    @ApiProperty({ example: 50 })
    reorder_level: number;

    @ApiProperty({ example: 'unit' })
    unit_of_measure: string;

    @ApiProperty({ example: 10.50, required: false })
    cost_per_unit?: number;

    @ApiProperty({ example: 15.00, required: false })
    selling_price_per_unit?: number;

    @ApiProperty({ example: 'Pharmacy A', required: false })
    location?: string;

    @ApiProperty({ example: 'BATCH-2024-001', required: false })
    batch_number?: string;

    @ApiProperty({ example: '2025-12-31', required: false })
    expiration_date?: Date;

    @ApiProperty({ example: 1, required: false })
    supplier_id?: number;

    @ApiProperty({ example: true })
    active: boolean;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    created_at: Date;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    updated_at: Date;
}

export class WarehouseItemResponseDto {
    @ApiProperty({ example: 1 })
    warehouse_item_id: number;

    @ApiProperty({ example: 'Medical Gloves (Box)' })
    item_name: string;

    @ApiProperty({ example: 'Supplies', required: false })
    category?: string;

    @ApiProperty({ example: 500 })
    current_stock: number;

    @ApiProperty({ example: 50 })
    reorder_level: number;

    @ApiProperty({ example: 'box' })
    unit_of_measure: string;

    @ApiProperty({ example: 15.00, required: false })
    cost_per_unit?: number;

    @ApiProperty({ example: 'Warehouse B', required: false })
    location?: string;

    @ApiProperty({ example: 1, required: false })
    supplier_id?: number;

    @ApiProperty({ example: true })
    active: boolean;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    created_at: Date;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    updated_at: Date;
}

export class InventoryTransactionResponseDto {
    @ApiProperty({ example: 1 })
    transaction_id: number;

    @ApiProperty({ example: 'medication', enum: ['medication', 'warehouse'] })
    item_type: string;

    @ApiProperty({ example: 1 })
    item_id: number;

    @ApiProperty({ example: 'incoming', enum: ['incoming', 'outgoing', 'adjustment', 'transfer'] })
    transaction_type: string;

    @ApiProperty({ example: 50 })
    quantity: number;

    @ApiProperty({ example: 'prescription', required: false })
    reference_type?: string;

    @ApiProperty({ example: 123, required: false })
    reference_id?: number;

    @ApiProperty({ example: 'Received from supplier', required: false })
    notes?: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', required: false })
    user_id?: string;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    created_at: Date;
}

export class SupplierResponseDto {
    @ApiProperty({ example: 1 })
    supplier_id: number;

    @ApiProperty({ example: 'GlobalPharma' })
    supplier_name: string;

    @ApiProperty({ example: 'John Doe', required: false })
    contact_person?: string;

    @ApiProperty({ example: 'contact@globalpharma.com', required: false })
    email?: string;

    @ApiProperty({ example: '+1-555-123-4567', required: false })
    phone?: string;

    @ApiProperty({ example: '123 Medical Supply St, City, State 12345', required: false })
    address?: string;

    @ApiProperty({ example: true })
    active: boolean;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    created_at: Date;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    updated_at: Date;
}

export class InventoryAlertResponseDto {
    @ApiProperty({ example: 1 })
    alert_id: number;

    @ApiProperty({ example: 'medication', enum: ['medication', 'warehouse'] })
    item_type: string;

    @ApiProperty({ example: 1 })
    item_id: number;

    @ApiProperty({ example: 'low_stock', enum: ['low_stock', 'expiring', 'expired', 'overstock'] })
    alert_type: string;

    @ApiProperty({ example: 50, required: false })
    threshold?: number;

    @ApiProperty({ example: 20, required: false })
    current_value?: number;

    @ApiProperty({ example: 'active', enum: ['active', 'acknowledged', 'resolved'] })
    status: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', required: false })
    acknowledged_by?: string;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z', required: false })
    acknowledged_at?: Date;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    created_at: Date;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z', required: false })
    resolved_at?: Date;
}

export class MedicationInventoryListResponseDto {
    @ApiProperty({ type: [MedicationInventoryResponseDto] })
    items: MedicationInventoryResponseDto[];

    @ApiProperty({ example: 'eyJtZWRpY2F0aW9uX2ludmVudG9yeV9pZCI6MX0=', required: false })
    nextCursor?: string;
}

export class WarehouseItemListResponseDto {
    @ApiProperty({ type: [WarehouseItemResponseDto] })
    items: WarehouseItemResponseDto[];

    @ApiProperty({ example: 'eyJ3YXJlaG91c2VfaXRlbV9pZCI6MX0=', required: false })
    nextCursor?: string;
}

export class InventoryTransactionListResponseDto {
    @ApiProperty({ type: [InventoryTransactionResponseDto] })
    items: InventoryTransactionResponseDto[];

    @ApiProperty({ example: 'eyJ0cmFuc2FjdGlvbl9pZCI6MX0=', required: false })
    nextCursor?: string;
}

export class SupplierListResponseDto {
    @ApiProperty({ type: [SupplierResponseDto] })
    items: SupplierResponseDto[];
}

export class InventoryAlertListResponseDto {
    @ApiProperty({ type: [InventoryAlertResponseDto] })
    items: InventoryAlertResponseDto[];
}

export class InventoryStatisticsResponseDto {
    @ApiProperty({ example: 248 })
    total_products: number;

    @ApiProperty({ example: 12 })
    low_stock_items: number;

    @ApiProperty({ example: 8 })
    pending_orders: number;

    @ApiProperty({ example: 5 })
    expiring_soon: number;
}

