import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateMedicationInventoryDto } from './dto/create-medication-inventory.dto';
import { CreateWarehouseItemDto } from './dto/create-warehouse-item.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateMedicationInventoryDto } from './dto/update-medication-inventory.dto';
import { UpdateWarehouseItemDto } from './dto/update-warehouse-item.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import {
    MedicationInventoryListResponseDto,
    MedicationInventoryResponseDto,
    WarehouseItemListResponseDto,
    WarehouseItemResponseDto,
    InventoryTransactionListResponseDto,
    InventoryTransactionResponseDto,
    SupplierListResponseDto,
    SupplierResponseDto,
    InventoryAlertListResponseDto,
    InventoryStatisticsResponseDto,
} from './dto/inventory-response.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {}

    // ============================================================================
    // MEDICATION INVENTORY ENDPOINTS
    // ============================================================================

    @Post('medications')
    @Permissions('inventory.create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new medication inventory item' })
    @ApiResponse({ status: 201, description: 'Medication inventory created', type: MedicationInventoryResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async createMedicationInventory(@Body() createDto: CreateMedicationInventoryDto): Promise<MedicationInventoryResponseDto> {
        return this.inventoryService.createMedicationInventory(createDto);
    }

    @Get('medications')
    @Permissions('inventory.read')
    @ApiOperation({ summary: 'Search medication inventory with filters' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or location' })
    @ApiQuery({ name: 'supplier_id', required: false, type: Number, description: 'Filter by supplier ID' })
    @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filter by active status' })
    @ApiQuery({ name: 'low_stock', required: false, type: Boolean, description: 'Filter low stock items' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiResponse({ status: 200, description: 'Medication inventory list', type: MedicationInventoryListResponseDto })
    async searchMedicationInventory(
        @Query('search') search?: string,
        @Query('supplier_id') supplier_id?: string,
        @Query('active') active?: string,
        @Query('low_stock') low_stock?: string,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
    ): Promise<MedicationInventoryListResponseDto> {
        return this.inventoryService.searchMedicationInventory({
            search,
            supplier_id: supplier_id ? parseInt(supplier_id, 10) : undefined,
            active: active === 'true' ? true : active === 'false' ? false : undefined,
            low_stock: low_stock === 'true',
            limit: limit ? parseInt(limit, 10) : undefined,
            cursor,
        });
    }

    @Get('medications/:id')
    @Permissions('inventory.read')
    @ApiOperation({ summary: 'Get medication inventory item by ID' })
    @ApiResponse({ status: 200, description: 'Medication inventory found', type: MedicationInventoryResponseDto })
    @ApiResponse({ status: 404, description: 'Medication inventory not found' })
    async getMedicationInventoryById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<MedicationInventoryResponseDto> {
        return this.inventoryService.getMedicationInventoryById(id);
    }

    @Patch('medications/:id')
    @Permissions('inventory.update')
    @ApiOperation({ summary: 'Update medication inventory item' })
    @ApiResponse({ status: 200, description: 'Medication inventory updated', type: MedicationInventoryResponseDto })
    @ApiResponse({ status: 404, description: 'Medication inventory not found' })
    async updateMedicationInventory(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateMedicationInventoryDto,
    ): Promise<MedicationInventoryResponseDto> {
        return this.inventoryService.updateMedicationInventory(id, updateDto);
    }

    // ============================================================================
    // WAREHOUSE ITEMS ENDPOINTS
    // ============================================================================

    @Post('warehouse')
    @Permissions('inventory.create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new warehouse item' })
    @ApiResponse({ status: 201, description: 'Warehouse item created', type: WarehouseItemResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async createWarehouseItem(@Body() createDto: CreateWarehouseItemDto): Promise<WarehouseItemResponseDto> {
        return this.inventoryService.createWarehouseItem(createDto);
    }

    @Get('warehouse')
    @Permissions('inventory.read')
    @ApiOperation({ summary: 'Search warehouse items with filters' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or location' })
    @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
    @ApiQuery({ name: 'supplier_id', required: false, type: Number, description: 'Filter by supplier ID' })
    @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filter by active status' })
    @ApiQuery({ name: 'low_stock', required: false, type: Boolean, description: 'Filter low stock items' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiResponse({ status: 200, description: 'Warehouse items list', type: WarehouseItemListResponseDto })
    async searchWarehouseItems(
        @Query('search') search?: string,
        @Query('category') category?: string,
        @Query('supplier_id') supplier_id?: string,
        @Query('active') active?: string,
        @Query('low_stock') low_stock?: string,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
    ): Promise<WarehouseItemListResponseDto> {
        return this.inventoryService.searchWarehouseItems({
            search,
            category,
            supplier_id: supplier_id ? parseInt(supplier_id, 10) : undefined,
            active: active === 'true' ? true : active === 'false' ? false : undefined,
            low_stock: low_stock === 'true',
            limit: limit ? parseInt(limit, 10) : undefined,
            cursor,
        });
    }

    @Get('warehouse/:id')
    @Permissions('inventory.read')
    @ApiOperation({ summary: 'Get warehouse item by ID' })
    @ApiResponse({ status: 200, description: 'Warehouse item found', type: WarehouseItemResponseDto })
    @ApiResponse({ status: 404, description: 'Warehouse item not found' })
    async getWarehouseItemById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<WarehouseItemResponseDto> {
        return this.inventoryService.getWarehouseItemById(id);
    }

    @Patch('warehouse/:id')
    @Permissions('inventory.update')
    @ApiOperation({ summary: 'Update warehouse item' })
    @ApiResponse({ status: 200, description: 'Warehouse item updated', type: WarehouseItemResponseDto })
    @ApiResponse({ status: 404, description: 'Warehouse item not found' })
    async updateWarehouseItem(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateWarehouseItemDto,
    ): Promise<WarehouseItemResponseDto> {
        return this.inventoryService.updateWarehouseItem(id, updateDto);
    }

    // ============================================================================
    // INVENTORY TRANSACTIONS ENDPOINTS
    // ============================================================================

    @Post('transactions')
    @Permissions('inventory.create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new inventory transaction (stock movement)' })
    @ApiResponse({ status: 201, description: 'Transaction created', type: InventoryTransactionResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error or insufficient stock' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async createTransaction(
        @Body() createDto: CreateInventoryTransactionDto,
        @CurrentUser() user: { userId: string },
    ): Promise<InventoryTransactionResponseDto> {
        return this.inventoryService.createTransaction(createDto, user.userId);
    }

    @Get('transactions')
    @Permissions('inventory.read')
    @ApiOperation({ summary: 'Search inventory transactions with filters' })
    @ApiQuery({ name: 'item_type', required: false, type: String, description: 'Filter by item type (medication/warehouse)' })
    @ApiQuery({ name: 'item_id', required: false, type: Number, description: 'Filter by item ID' })
    @ApiQuery({ name: 'transaction_type', required: false, type: String, description: 'Filter by transaction type' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiResponse({ status: 200, description: 'Transactions list', type: InventoryTransactionListResponseDto })
    async searchTransactions(
        @Query('item_type') item_type?: string,
        @Query('item_id') item_id?: string,
        @Query('transaction_type') transaction_type?: string,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
    ): Promise<InventoryTransactionListResponseDto> {
        return this.inventoryService.searchTransactions({
            item_type,
            item_id: item_id ? parseInt(item_id, 10) : undefined,
            transaction_type,
            limit: limit ? parseInt(limit, 10) : undefined,
            cursor,
        });
    }

    // ============================================================================
    // SUPPLIERS ENDPOINTS
    // ============================================================================

    @Post('suppliers')
    @Permissions('inventory.create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new supplier' })
    @ApiResponse({ status: 201, description: 'Supplier created', type: SupplierResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async createSupplier(@Body() createDto: CreateSupplierDto): Promise<SupplierResponseDto> {
        return this.inventoryService.createSupplier(createDto);
    }

    @Get('suppliers')
    @Permissions('inventory.read')
    @ApiOperation({ summary: 'List all suppliers' })
    @ApiQuery({ name: 'active_only', required: false, type: Boolean, description: 'Show only active suppliers' })
    @ApiResponse({ status: 200, description: 'Suppliers list', type: SupplierListResponseDto })
    async listSuppliers(
        @Query('active_only') active_only?: string,
    ): Promise<SupplierListResponseDto> {
        const suppliers = await this.inventoryService.listSuppliers(active_only === 'true');
        return { items: suppliers };
    }

    @Get('suppliers/:id')
    @Permissions('inventory.read')
    @ApiOperation({ summary: 'Get supplier by ID' })
    @ApiResponse({ status: 200, description: 'Supplier found', type: SupplierResponseDto })
    @ApiResponse({ status: 404, description: 'Supplier not found' })
    async getSupplierById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<SupplierResponseDto> {
        return this.inventoryService.getSupplierById(id);
    }

    @Patch('suppliers/:id')
    @Permissions('inventory.update')
    @ApiOperation({ summary: 'Update supplier' })
    @ApiResponse({ status: 200, description: 'Supplier updated', type: SupplierResponseDto })
    @ApiResponse({ status: 404, description: 'Supplier not found' })
    async updateSupplier(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateSupplierDto,
    ): Promise<SupplierResponseDto> {
        return this.inventoryService.updateSupplier(id, updateDto);
    }

    // ============================================================================
    // INVENTORY ALERTS ENDPOINTS
    // ============================================================================

    @Get('alerts/low-stock')
    @Permissions('inventory.read')
    @ApiOperation({ summary: 'Get low stock alerts' })
    @ApiQuery({ name: 'item_type', required: false, type: String, description: 'Filter by item type (medication/warehouse)' })
    @ApiResponse({ status: 200, description: 'Low stock alerts', type: InventoryAlertListResponseDto })
    async getLowStockAlerts(
        @Query('item_type') item_type?: string,
    ): Promise<InventoryAlertListResponseDto> {
        const alerts = await this.inventoryService.getLowStockAlerts(item_type);
        return { items: alerts };
    }

    @Post('alerts/:id/acknowledge')
    @Permissions('inventory.update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Acknowledge an inventory alert' })
    @ApiResponse({ status: 200, description: 'Alert acknowledged' })
    @ApiResponse({ status: 404, description: 'Alert not found' })
    async acknowledgeAlert(
        @Param('id', ParseIntPipe) alertId: number,
        @CurrentUser() user: { userId: string },
    ) {
        return this.inventoryService.acknowledgeAlert(alertId, user.userId);
    }

    // ============================================================================
    // STATISTICS ENDPOINTS
    // ============================================================================

    @Get('statistics')
    @Permissions('inventory.read')
    @ApiOperation({ summary: 'Get inventory statistics' })
    @ApiResponse({ status: 200, description: 'Inventory statistics', type: InventoryStatisticsResponseDto })
    async getInventoryStatistics(): Promise<InventoryStatisticsResponseDto> {
        return this.inventoryService.getInventoryStatistics();
    }
}

