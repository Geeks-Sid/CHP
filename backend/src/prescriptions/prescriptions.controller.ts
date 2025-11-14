import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { FillPrescriptionDto } from './dto/fill-prescription.dto';
import {
    PrescriptionListResponseDto,
    PrescriptionResponseDto,
} from './dto/prescription-response.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiTags('Prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PrescriptionsController {
    constructor(private readonly prescriptionsService: PrescriptionsService) { }

    @Post()
    @Permissions('medication.create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new prescription' })
    @ApiResponse({ status: 201, description: 'Prescription created', type: PrescriptionResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async createPrescription(
        @Body() createPrescriptionDto: CreatePrescriptionDto,
        @CurrentUser() user: { userId: string },
    ): Promise<PrescriptionResponseDto> {
        return this.prescriptionsService.createPrescription(createPrescriptionDto, user.userId);
    }

    @Get()
    @Permissions('medication.read')
    @ApiOperation({ summary: 'Search prescriptions with filters' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiQuery({ name: 'person_id', required: false, type: Number, description: 'Filter by patient ID' })
    @ApiQuery({ name: 'visit_occurrence_id', required: false, type: Number, description: 'Filter by visit ID' })
    @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Filter prescriptions from date (ISO 8601)' })
    @ApiQuery({ name: 'date_to', required: false, type: String, description: 'Filter prescriptions to date (ISO 8601)' })
    @ApiQuery({ name: 'prescription_status', required: false, type: String, description: 'Filter by status (Pending, Filled, Cancelled)' })
    @ApiQuery({ name: 'prescribed_by', required: false, type: String, description: 'Filter by prescriber user ID' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by patient name, medication name, or prescription number' })
    @ApiResponse({ status: 200, description: 'Prescriptions list', type: PrescriptionListResponseDto })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async searchPrescriptions(
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('person_id') person_id?: string,
        @Query('visit_occurrence_id') visit_occurrence_id?: string,
        @Query('date_from') date_from?: string,
        @Query('date_to') date_to?: string,
        @Query('prescription_status') prescription_status?: string,
        @Query('prescribed_by') prescribed_by?: string,
        @Query('search') search?: string,
    ): Promise<PrescriptionListResponseDto> {
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const personId = person_id ? parseInt(person_id, 10) : undefined;
        const visitOccurrenceId = visit_occurrence_id ? parseInt(visit_occurrence_id, 10) : undefined;

        return this.prescriptionsService.searchPrescriptions({
            limit: limitNum,
            cursor,
            person_id: personId,
            visit_occurrence_id: visitOccurrenceId,
            date_from,
            date_to,
            prescription_status,
            prescribed_by,
            search,
        });
    }

    @Get(':id')
    @Permissions('medication.read')
    @ApiOperation({ summary: 'Get prescription by ID' })
    @ApiResponse({ status: 200, description: 'Prescription found', type: PrescriptionResponseDto })
    @ApiResponse({ status: 404, description: 'Prescription not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getPrescriptionById(
        @Param('id', ParseIntPipe) prescriptionId: number,
    ): Promise<PrescriptionResponseDto> {
        return this.prescriptionsService.getPrescriptionById(prescriptionId);
    }

    @Post(':id/fill')
    @Permissions('medication.update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Fill prescription (pharmacist only)' })
    @ApiResponse({ status: 200, description: 'Prescription filled', type: PrescriptionResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 404, description: 'Prescription not found' })
    @ApiResponse({ status: 409, description: 'Prescription already filled' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async fillPrescription(
        @Param('id', ParseIntPipe) prescriptionId: number,
        @Body() fillPrescriptionDto: FillPrescriptionDto,
        @CurrentUser() user: { userId: string },
    ): Promise<PrescriptionResponseDto> {
        return this.prescriptionsService.fillPrescription(
            prescriptionId,
            user.userId,
            fillPrescriptionDto.medication_inventory_id,
        );
    }
}

