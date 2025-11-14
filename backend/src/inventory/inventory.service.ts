import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { logger } from '../common/logger/logger.config';
import { CreateMedicationInventoryDto } from './dto/create-medication-inventory.dto';
import { CreateWarehouseItemDto } from './dto/create-warehouse-item.dto';
import { CreateInventoryTransactionDto, TransactionType } from './dto/create-inventory-transaction.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateMedicationInventoryDto } from './dto/update-medication-inventory.dto';
import { UpdateWarehouseItemDto } from './dto/update-warehouse-item.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { InventoryRepository, InventorySearchFilters } from './inventory.repository';

/**
 * Inventory Service
 * Business logic for inventory management
 */
@Injectable()
export class InventoryService {
    constructor(private readonly inventoryRepository: InventoryRepository) {}

    // ============================================================================
    // MEDICATION INVENTORY METHODS
    // ============================================================================

    async createMedicationInventory(data: CreateMedicationInventoryDto) {
        try {
            const medication = await this.inventoryRepository.createMedicationInventory(data);
            logger.info(
                { medicationInventoryId: medication.medication_inventory_id },
                'Medication inventory created',
            );
            return medication;
        } catch (error: any) {
            logger.error({ error, data }, 'Failed to create medication inventory');
            throw error;
        }
    }

    async getMedicationInventoryById(id: number) {
        const medication = await this.inventoryRepository.findMedicationInventoryById(id);
        if (!medication) {
            throw new NotFoundException('Medication inventory item not found');
        }
        return medication;
    }

    async updateMedicationInventory(id: number, data: UpdateMedicationInventoryDto) {
        const existing = await this.inventoryRepository.findMedicationInventoryById(id);
        if (!existing) {
            throw new NotFoundException('Medication inventory item not found');
        }

        try {
            const medication = await this.inventoryRepository.updateMedicationInventory(id, data);
            logger.info({ medicationInventoryId: id }, 'Medication inventory updated');
            return medication;
        } catch (error: any) {
            logger.error({ error, id, data }, 'Failed to update medication inventory');
            throw error;
        }
    }

    async searchMedicationInventory(filters: {
        search?: string;
        supplier_id?: number;
        active?: boolean;
        low_stock?: boolean;
        limit?: number;
        cursor?: string;
    }) {
        const searchFilters: InventorySearchFilters = {
            search: filters.search,
            supplier_id: filters.supplier_id,
            active: filters.active,
            low_stock: filters.low_stock,
            limit: Math.min(filters.limit || 50, 100),
            cursor: filters.cursor,
        };

        return this.inventoryRepository.searchMedicationInventory(searchFilters);
    }

    // ============================================================================
    // WAREHOUSE ITEMS METHODS
    // ============================================================================

    async createWarehouseItem(data: CreateWarehouseItemDto) {
        try {
            const item = await this.inventoryRepository.createWarehouseItem(data);
            logger.info(
                { warehouseItemId: item.warehouse_item_id },
                'Warehouse item created',
            );
            return item;
        } catch (error: any) {
            logger.error({ error, data }, 'Failed to create warehouse item');
            throw error;
        }
    }

    async getWarehouseItemById(id: number) {
        const item = await this.inventoryRepository.findWarehouseItemById(id);
        if (!item) {
            throw new NotFoundException('Warehouse item not found');
        }
        return item;
    }

    async updateWarehouseItem(id: number, data: UpdateWarehouseItemDto) {
        const existing = await this.inventoryRepository.findWarehouseItemById(id);
        if (!existing) {
            throw new NotFoundException('Warehouse item not found');
        }

        try {
            const item = await this.inventoryRepository.updateWarehouseItem(id, data);
            logger.info({ warehouseItemId: id }, 'Warehouse item updated');
            return item;
        } catch (error: any) {
            logger.error({ error, id, data }, 'Failed to update warehouse item');
            throw error;
        }
    }

    async searchWarehouseItems(filters: {
        search?: string;
        category?: string;
        supplier_id?: number;
        active?: boolean;
        low_stock?: boolean;
        limit?: number;
        cursor?: string;
    }) {
        const searchFilters: InventorySearchFilters = {
            search: filters.search,
            category: filters.category,
            supplier_id: filters.supplier_id,
            active: filters.active,
            low_stock: filters.low_stock,
            limit: Math.min(filters.limit || 50, 100),
            cursor: filters.cursor,
        };

        return this.inventoryRepository.searchWarehouseItems(searchFilters);
    }

    // ============================================================================
    // INVENTORY TRANSACTIONS METHODS
    // ============================================================================

    async createTransaction(data: CreateInventoryTransactionDto, userId?: string) {
        // Validate quantity
        if (data.quantity <= 0) {
            throw new BadRequestException('Quantity must be positive');
        }

        try {
            const transaction = await this.inventoryRepository.createTransaction(data, userId);
            logger.info(
                { transactionId: transaction.transaction_id, itemType: data.item_type, itemId: data.item_id },
                'Inventory transaction created',
            );
            return transaction;
        } catch (error: any) {
            if (error.message === 'Medication inventory item not found' || error.message === 'Warehouse item not found') {
                throw new NotFoundException(error.message);
            }
            if (error.message === 'Insufficient stock') {
                throw new BadRequestException('Insufficient stock for this transaction');
            }
            logger.error({ error, data }, 'Failed to create inventory transaction');
            throw error;
        }
    }

    async searchTransactions(filters: {
        item_type?: string;
        item_id?: number;
        transaction_type?: string;
        limit?: number;
        cursor?: string;
    }) {
        return this.inventoryRepository.searchTransactions({
            item_type: filters.item_type,
            item_id: filters.item_id,
            transaction_type: filters.transaction_type,
            limit: Math.min(filters.limit || 50, 100),
            cursor: filters.cursor,
        });
    }

    // ============================================================================
    // SUPPLIERS METHODS
    // ============================================================================

    async createSupplier(data: CreateSupplierDto) {
        try {
            const supplier = await this.inventoryRepository.createSupplier(data);
            logger.info({ supplierId: supplier.supplier_id }, 'Supplier created');
            return supplier;
        } catch (error: any) {
            logger.error({ error, data }, 'Failed to create supplier');
            throw error;
        }
    }

    async getSupplierById(id: number) {
        const supplier = await this.inventoryRepository.findSupplierById(id);
        if (!supplier) {
            throw new NotFoundException('Supplier not found');
        }
        return supplier;
    }

    async updateSupplier(id: number, data: UpdateSupplierDto) {
        const existing = await this.inventoryRepository.findSupplierById(id);
        if (!existing) {
            throw new NotFoundException('Supplier not found');
        }

        try {
            const supplier = await this.inventoryRepository.updateSupplier(id, data);
            logger.info({ supplierId: id }, 'Supplier updated');
            return supplier;
        } catch (error: any) {
            logger.error({ error, id, data }, 'Failed to update supplier');
            throw error;
        }
    }

    async listSuppliers(activeOnly: boolean = false) {
        return this.inventoryRepository.listSuppliers(activeOnly);
    }

    // ============================================================================
    // INVENTORY ALERTS METHODS
    // ============================================================================

    async getLowStockAlerts(itemType?: string) {
        return this.inventoryRepository.getLowStockAlerts(itemType);
    }

    async acknowledgeAlert(alertId: number, userId: string) {
        const alert = await this.inventoryRepository.getLowStockAlerts();
        const found = alert.find(a => a.alert_id === alertId);
        if (!found) {
            throw new NotFoundException('Alert not found');
        }

        return this.inventoryRepository.acknowledgeAlert(alertId, userId);
    }

    // ============================================================================
    // STATISTICS METHODS
    // ============================================================================

    async getInventoryStatistics() {
        return this.inventoryRepository.getInventoryStatistics();
    }
}

