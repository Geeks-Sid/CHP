import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum ItemType {
    MEDICATION = 'medication',
    WAREHOUSE = 'warehouse',
}

export enum TransactionType {
    INCOMING = 'incoming',
    OUTGOING = 'outgoing',
    ADJUSTMENT = 'adjustment',
    TRANSFER = 'transfer',
}

export class CreateInventoryTransactionDto {
    @ApiProperty({
        description: 'Type of item',
        enum: ItemType,
        example: 'medication',
    })
    @IsEnum(ItemType)
    item_type: ItemType;

    @ApiProperty({
        description: 'ID of the medication_inventory or warehouse_items record',
        example: 1,
    })
    @IsInt()
    @Min(1)
    item_id: number;

    @ApiProperty({
        description: 'Transaction type',
        enum: TransactionType,
        example: 'incoming',
    })
    @IsEnum(TransactionType)
    transaction_type: TransactionType;

    @ApiProperty({
        description: 'Quantity (positive for incoming, negative for outgoing, absolute for adjustment)',
        example: 50,
    })
    @IsNumber()
    quantity: number;

    @ApiProperty({
        description: 'Reference type (e.g., prescription, order, adjustment)',
        example: 'prescription',
        required: false,
    })
    @IsOptional()
    @IsString()
    reference_type?: string;

    @ApiProperty({
        description: 'Reference ID',
        example: 123,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    reference_id?: number;

    @ApiProperty({
        description: 'Transaction notes',
        example: 'Received from supplier',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

