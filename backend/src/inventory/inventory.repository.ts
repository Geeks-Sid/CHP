import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';
import { CreateInventoryTransactionDto, ItemType, TransactionType } from './dto/create-inventory-transaction.dto';
import { CreateMedicationInventoryDto } from './dto/create-medication-inventory.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateWarehouseItemDto } from './dto/create-warehouse-item.dto';
import { UpdateMedicationInventoryDto } from './dto/update-medication-inventory.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UpdateWarehouseItemDto } from './dto/update-warehouse-item.dto';

// Type definitions
export interface MedicationInventory {
    medication_inventory_id: number;
    drug_concept_id?: number;
    medication_name: string;
    current_stock: number;
    reorder_level: number;
    unit_of_measure: string;
    cost_per_unit?: number;
    selling_price_per_unit?: number;
    location?: string;
    batch_number?: string;
    expiration_date?: Date;
    supplier_id?: number;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface WarehouseItem {
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
    created_at: Date;
    updated_at: Date;
}

export interface InventoryTransaction {
    transaction_id: number;
    item_type: string;
    item_id: number;
    transaction_type: string;
    quantity: number;
    reference_type?: string;
    reference_id?: number;
    notes?: string;
    user_id?: string;
    created_at: Date;
}

export interface Supplier {
    supplier_id: number;
    supplier_name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface InventoryAlert {
    alert_id: number;
    item_type: string;
    item_id: number;
    alert_type: string;
    threshold?: number;
    current_value?: number;
    status: string;
    acknowledged_by?: string;
    acknowledged_at?: Date;
    created_at: Date;
    resolved_at?: Date;
}

export interface InventorySearchFilters {
    search?: string;
    category?: string;
    supplier_id?: number;
    active?: boolean;
    low_stock?: boolean;
    limit?: number;
    cursor?: string;
}

/**
 * Inventory Repository
 * Handles all database operations for inventory management
 */
@Injectable()
export class InventoryRepository {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    // ============================================================================
    // MEDICATION INVENTORY METHODS
    // ============================================================================

    async createMedicationInventory(data: CreateMedicationInventoryDto): Promise<MedicationInventory> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            const { rows } = await client.query<MedicationInventory>(
                `INSERT INTO medication_inventory (
                    drug_concept_id, medication_name, current_stock, reorder_level,
                    unit_of_measure, cost_per_unit, selling_price_per_unit,
                    location, batch_number, expiration_date, supplier_id, active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *`,
                [
                    data.drug_concept_id || null,
                    data.medication_name,
                    data.current_stock || 0,
                    data.reorder_level || 0,
                    data.unit_of_measure || 'unit',
                    data.cost_per_unit || null,
                    data.selling_price_per_unit || null,
                    data.location || null,
                    data.batch_number || null,
                    data.expiration_date ? new Date(data.expiration_date) : null,
                    data.supplier_id || null,
                    data.active !== undefined ? data.active : true,
                ],
            );

            logger.debug({ medicationInventoryId: rows[0].medication_inventory_id }, 'Medication inventory created');
            return rows[0];
        });
    }

    async findMedicationInventoryById(id: number): Promise<MedicationInventory | null> {
        const { rows } = await this.databaseService.query<MedicationInventory>(
            `SELECT * FROM medication_inventory WHERE medication_inventory_id = $1`,
            [id],
        );
        return rows[0] || null;
    }

    async updateMedicationInventory(id: number, data: UpdateMedicationInventoryDto): Promise<MedicationInventory> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.drug_concept_id !== undefined) {
                updates.push(`drug_concept_id = $${paramIndex++}`);
                values.push(data.drug_concept_id || null);
            }
            if (data.medication_name !== undefined) {
                updates.push(`medication_name = $${paramIndex++}`);
                values.push(data.medication_name);
            }
            if (data.reorder_level !== undefined) {
                updates.push(`reorder_level = $${paramIndex++}`);
                values.push(data.reorder_level);
            }
            if (data.unit_of_measure !== undefined) {
                updates.push(`unit_of_measure = $${paramIndex++}`);
                values.push(data.unit_of_measure);
            }
            if (data.cost_per_unit !== undefined) {
                updates.push(`cost_per_unit = $${paramIndex++}`);
                values.push(data.cost_per_unit || null);
            }
            if (data.selling_price_per_unit !== undefined) {
                updates.push(`selling_price_per_unit = $${paramIndex++}`);
                values.push(data.selling_price_per_unit || null);
            }
            if (data.location !== undefined) {
                updates.push(`location = $${paramIndex++}`);
                values.push(data.location || null);
            }
            if (data.batch_number !== undefined) {
                updates.push(`batch_number = $${paramIndex++}`);
                values.push(data.batch_number || null);
            }
            if (data.expiration_date !== undefined) {
                updates.push(`expiration_date = $${paramIndex++}`);
                values.push(data.expiration_date ? new Date(data.expiration_date) : null);
            }
            if (data.supplier_id !== undefined) {
                updates.push(`supplier_id = $${paramIndex++}`);
                values.push(data.supplier_id || null);
            }
            if (data.active !== undefined) {
                updates.push(`active = $${paramIndex++}`);
                values.push(data.active);
            }

            if (updates.length === 0) {
                const existing = await this.findMedicationInventoryById(id);
                if (!existing) {
                    throw new Error('Medication inventory item not found');
                }
                return existing;
            }

            values.push(id);
            const { rows } = await client.query<MedicationInventory>(
                `UPDATE medication_inventory SET ${updates.join(', ')} WHERE medication_inventory_id = $${paramIndex} RETURNING *`,
                values,
            );

            return rows[0];
        });
    }

    async searchMedicationInventory(filters: InventorySearchFilters): Promise<{
        items: MedicationInventory[];
        nextCursor?: string;
    }> {
        const whereClause: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.search) {
            whereClause.push(`(medication_name ILIKE $${paramIndex} OR location ILIKE $${paramIndex})`);
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        if (filters.supplier_id) {
            whereClause.push(`supplier_id = $${paramIndex++}`);
            params.push(filters.supplier_id);
        }

        if (filters.active !== undefined) {
            whereClause.push(`active = $${paramIndex++}`);
            params.push(filters.active);
        }

        if (filters.low_stock) {
            whereClause.push(`current_stock <= reorder_level`);
        }

        const where = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
        const limit = Math.min(filters.limit || 50, 100);
        params.push(limit + 1);

        const { rows } = await this.databaseService.query<MedicationInventory>(
            `SELECT * FROM medication_inventory ${where} ORDER BY medication_inventory_id DESC LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const items = hasMore ? rows.slice(0, limit) : rows;

        let nextCursor: string | undefined;
        if (hasMore && items.length > 0) {
            const lastItem = items[items.length - 1];
            nextCursor = Buffer.from(JSON.stringify({ medication_inventory_id: lastItem.medication_inventory_id })).toString('base64');
        }

        return { items, nextCursor };
    }

    // ============================================================================
    // WAREHOUSE ITEMS METHODS
    // ============================================================================

    async createWarehouseItem(data: CreateWarehouseItemDto): Promise<WarehouseItem> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            const { rows } = await client.query<WarehouseItem>(
                `INSERT INTO warehouse_items (
                    item_name, category, current_stock, reorder_level,
                    unit_of_measure, cost_per_unit, location, supplier_id, active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [
                    data.item_name,
                    data.category || null,
                    data.current_stock || 0,
                    data.reorder_level || 0,
                    data.unit_of_measure || 'unit',
                    data.cost_per_unit || null,
                    data.location || null,
                    data.supplier_id || null,
                    data.active !== undefined ? data.active : true,
                ],
            );

            logger.debug({ warehouseItemId: rows[0].warehouse_item_id }, 'Warehouse item created');
            return rows[0];
        });
    }

    async findWarehouseItemById(id: number): Promise<WarehouseItem | null> {
        const { rows } = await this.databaseService.query<WarehouseItem>(
            `SELECT * FROM warehouse_items WHERE warehouse_item_id = $1`,
            [id],
        );
        return rows[0] || null;
    }

    async updateWarehouseItem(id: number, data: UpdateWarehouseItemDto): Promise<WarehouseItem> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.item_name !== undefined) {
                updates.push(`item_name = $${paramIndex++}`);
                values.push(data.item_name);
            }
            if (data.category !== undefined) {
                updates.push(`category = $${paramIndex++}`);
                values.push(data.category || null);
            }
            if (data.reorder_level !== undefined) {
                updates.push(`reorder_level = $${paramIndex++}`);
                values.push(data.reorder_level);
            }
            if (data.unit_of_measure !== undefined) {
                updates.push(`unit_of_measure = $${paramIndex++}`);
                values.push(data.unit_of_measure);
            }
            if (data.cost_per_unit !== undefined) {
                updates.push(`cost_per_unit = $${paramIndex++}`);
                values.push(data.cost_per_unit || null);
            }
            if (data.location !== undefined) {
                updates.push(`location = $${paramIndex++}`);
                values.push(data.location || null);
            }
            if (data.supplier_id !== undefined) {
                updates.push(`supplier_id = $${paramIndex++}`);
                values.push(data.supplier_id || null);
            }
            if (data.active !== undefined) {
                updates.push(`active = $${paramIndex++}`);
                values.push(data.active);
            }

            if (updates.length === 0) {
                const existing = await this.findWarehouseItemById(id);
                if (!existing) {
                    throw new Error('Warehouse item not found');
                }
                return existing;
            }

            values.push(id);
            const { rows } = await client.query<WarehouseItem>(
                `UPDATE warehouse_items SET ${updates.join(', ')} WHERE warehouse_item_id = $${paramIndex} RETURNING *`,
                values,
            );

            return rows[0];
        });
    }

    async searchWarehouseItems(filters: InventorySearchFilters): Promise<{
        items: WarehouseItem[];
        nextCursor?: string;
    }> {
        const whereClause: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.search) {
            whereClause.push(`(item_name ILIKE $${paramIndex} OR location ILIKE $${paramIndex})`);
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        if (filters.category) {
            whereClause.push(`category = $${paramIndex++}`);
            params.push(filters.category);
        }

        if (filters.supplier_id) {
            whereClause.push(`supplier_id = $${paramIndex++}`);
            params.push(filters.supplier_id);
        }

        if (filters.active !== undefined) {
            whereClause.push(`active = $${paramIndex++}`);
            params.push(filters.active);
        }

        if (filters.low_stock) {
            whereClause.push(`current_stock <= reorder_level`);
        }

        const where = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
        const limit = Math.min(filters.limit || 50, 100);
        params.push(limit + 1);

        const { rows } = await this.databaseService.query<WarehouseItem>(
            `SELECT * FROM warehouse_items ${where} ORDER BY warehouse_item_id DESC LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const items = hasMore ? rows.slice(0, limit) : rows;

        let nextCursor: string | undefined;
        if (hasMore && items.length > 0) {
            const lastItem = items[items.length - 1];
            nextCursor = Buffer.from(JSON.stringify({ warehouse_item_id: lastItem.warehouse_item_id })).toString('base64');
        }

        return { items, nextCursor };
    }

    // ============================================================================
    // INVENTORY TRANSACTIONS METHODS
    // ============================================================================

    async createTransaction(data: CreateInventoryTransactionDto, userId?: string): Promise<InventoryTransaction> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Validate item exists
            if (data.item_type === ItemType.MEDICATION) {
                const item = await this.findMedicationInventoryById(data.item_id);
                if (!item) {
                    throw new Error('Medication inventory item not found');
                }
            } else {
                const item = await this.findWarehouseItemById(data.item_id);
                if (!item) {
                    throw new Error('Warehouse item not found');
                }
            }

            // For outgoing transactions, ensure sufficient stock
            if (data.transaction_type === TransactionType.OUTGOING) {
                if (data.item_type === ItemType.MEDICATION) {
                    const item = await this.findMedicationInventoryById(data.item_id);
                    if (item && item.current_stock < Math.abs(data.quantity)) {
                        throw new Error('Insufficient stock');
                    }
                } else {
                    const item = await this.findWarehouseItemById(data.item_id);
                    if (item && item.current_stock < Math.abs(data.quantity)) {
                        throw new Error('Insufficient stock');
                    }
                }
            }

            const { rows } = await client.query<InventoryTransaction>(
                `INSERT INTO inventory_transactions (
                    item_type, item_id, transaction_type, quantity,
                    reference_type, reference_id, notes, user_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [
                    data.item_type,
                    data.item_id,
                    data.transaction_type,
                    data.transaction_type === TransactionType.OUTGOING ? -Math.abs(data.quantity) : Math.abs(data.quantity),
                    data.reference_type || null,
                    data.reference_id || null,
                    data.notes || null,
                    userId || null,
                ],
            );

            logger.debug({ transactionId: rows[0].transaction_id }, 'Inventory transaction created');
            return rows[0];
        });
    }

    async searchTransactions(filters: {
        item_type?: string;
        item_id?: number;
        transaction_type?: string;
        limit?: number;
        cursor?: string;
    }): Promise<{
        items: InventoryTransaction[];
        nextCursor?: string;
    }> {
        const whereClause: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.item_type) {
            whereClause.push(`item_type = $${paramIndex++}`);
            params.push(filters.item_type);
        }

        if (filters.item_id) {
            whereClause.push(`item_id = $${paramIndex++}`);
            params.push(filters.item_id);
        }

        if (filters.transaction_type) {
            whereClause.push(`transaction_type = $${paramIndex++}`);
            params.push(filters.transaction_type);
        }

        const where = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
        const limit = Math.min(filters.limit || 50, 100);
        params.push(limit + 1);

        const { rows } = await this.databaseService.query<InventoryTransaction>(
            `SELECT * FROM inventory_transactions ${where} ORDER BY created_at DESC, transaction_id DESC LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const items = hasMore ? rows.slice(0, limit) : rows;

        let nextCursor: string | undefined;
        if (hasMore && items.length > 0) {
            const lastItem = items[items.length - 1];
            nextCursor = Buffer.from(JSON.stringify({
                transaction_id: lastItem.transaction_id,
                created_at: lastItem.created_at.toISOString(),
            })).toString('base64');
        }

        return { items, nextCursor };
    }

    // ============================================================================
    // SUPPLIERS METHODS
    // ============================================================================

    async createSupplier(data: CreateSupplierDto): Promise<Supplier> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            const { rows } = await client.query<Supplier>(
                `INSERT INTO suppliers (
                    supplier_name, contact_person, email, phone, address, active
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [
                    data.supplier_name,
                    data.contact_person || null,
                    data.email || null,
                    data.phone || null,
                    data.address || null,
                    data.active !== undefined ? data.active : true,
                ],
            );

            logger.debug({ supplierId: rows[0].supplier_id }, 'Supplier created');
            return rows[0];
        });
    }

    async findSupplierById(id: number): Promise<Supplier | null> {
        const { rows } = await this.databaseService.query<Supplier>(
            `SELECT * FROM suppliers WHERE supplier_id = $1`,
            [id],
        );
        return rows[0] || null;
    }

    async updateSupplier(id: number, data: UpdateSupplierDto): Promise<Supplier> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.supplier_name !== undefined) {
                updates.push(`supplier_name = $${paramIndex++}`);
                values.push(data.supplier_name);
            }
            if (data.contact_person !== undefined) {
                updates.push(`contact_person = $${paramIndex++}`);
                values.push(data.contact_person || null);
            }
            if (data.email !== undefined) {
                updates.push(`email = $${paramIndex++}`);
                values.push(data.email || null);
            }
            if (data.phone !== undefined) {
                updates.push(`phone = $${paramIndex++}`);
                values.push(data.phone || null);
            }
            if (data.address !== undefined) {
                updates.push(`address = $${paramIndex++}`);
                values.push(data.address || null);
            }
            if (data.active !== undefined) {
                updates.push(`active = $${paramIndex++}`);
                values.push(data.active);
            }

            if (updates.length === 0) {
                const existing = await this.findSupplierById(id);
                if (!existing) {
                    throw new Error('Supplier not found');
                }
                return existing;
            }

            values.push(id);
            const { rows } = await client.query<Supplier>(
                `UPDATE suppliers SET ${updates.join(', ')} WHERE supplier_id = $${paramIndex} RETURNING *`,
                values,
            );

            return rows[0];
        });
    }

    async listSuppliers(activeOnly: boolean = false): Promise<Supplier[]> {
        const where = activeOnly ? 'WHERE active = true' : '';
        const { rows } = await this.databaseService.query<Supplier>(
            `SELECT * FROM suppliers ${where} ORDER BY supplier_name`,
        );
        return rows;
    }

    // ============================================================================
    // INVENTORY ALERTS METHODS
    // ============================================================================

    async getLowStockAlerts(itemType?: string): Promise<InventoryAlert[]> {
        const where = itemType ? `WHERE item_type = $1 AND status = 'active'` : `WHERE status = 'active'`;
        const params = itemType ? [itemType] : [];
        const { rows } = await this.databaseService.query<InventoryAlert>(
            `SELECT * FROM inventory_alerts ${where} ORDER BY created_at DESC`,
            params,
        );
        return rows;
    }

    async acknowledgeAlert(alertId: number, userId: string): Promise<InventoryAlert> {
        const { rows } = await this.databaseService.query<InventoryAlert>(
            `UPDATE inventory_alerts 
             SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = now()
             WHERE alert_id = $2
             RETURNING *`,
            [userId, alertId],
        );
        return rows[0];
    }

    // ============================================================================
    // STATISTICS METHODS
    // ============================================================================

    async getInventoryStatistics(): Promise<{
        total_products: number;
        low_stock_items: number;
        pending_orders: number;
        expiring_soon: number;
    }> {
        const { rows: totalRows } = await this.databaseService.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM (
                SELECT medication_inventory_id FROM medication_inventory WHERE active = true
                UNION ALL
                SELECT warehouse_item_id FROM warehouse_items WHERE active = true
            ) t`,
        );

        const { rows: lowStockRows } = await this.databaseService.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM (
                SELECT medication_inventory_id FROM medication_inventory 
                WHERE active = true AND current_stock <= reorder_level
                UNION ALL
                SELECT warehouse_item_id FROM warehouse_items 
                WHERE active = true AND current_stock <= reorder_level
            ) t`,
        );

        const { rows: expiringRows } = await this.databaseService.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM medication_inventory 
             WHERE active = true 
             AND expiration_date IS NOT NULL 
             AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`,
        );

        return {
            total_products: parseInt(totalRows[0]?.count || '0', 10),
            low_stock_items: parseInt(lowStockRows[0]?.count || '0', 10),
            pending_orders: 0, // TODO: Implement when order system is added
            expiring_soon: parseInt(expiringRows[0]?.count || '0', 10),
        };
    }
}

