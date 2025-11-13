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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { MedicationListResponseDto, MedicationResponseDto } from './dto/medication-response.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { MedicationsService } from './medications.service';

@ApiTags('Medications')
@Controller('medications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class MedicationsController {
    constructor(private readonly medicationsService: MedicationsService) { }

    @Post()
    @Permissions('medication.create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new medication (drug exposure)' })
    @ApiResponse({ status: 201, description: 'Medication created', type: MedicationResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async createMedication(@Body() createMedicationDto: CreateMedicationDto): Promise<MedicationResponseDto> {
        return this.medicationsService.createMedication(createMedicationDto);
    }

    @Get()
    @Permissions('medication.read')
    @ApiOperation({ summary: 'Search medications with filters' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiQuery({ name: 'person_id', required: false, type: Number, description: 'Filter by patient ID' })
    @ApiQuery({ name: 'visit_occurrence_id', required: false, type: Number, description: 'Filter by visit ID' })
    @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Filter medications from date (ISO 8601)' })
    @ApiQuery({ name: 'date_to', required: false, type: String, description: 'Filter medications to date (ISO 8601)' })
    @ApiResponse({ status: 200, description: 'Medications list', type: MedicationListResponseDto })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async searchMedications(
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('person_id') person_id?: string,
        @Query('visit_occurrence_id') visit_occurrence_id?: string,
        @Query('date_from') date_from?: string,
        @Query('date_to') date_to?: string,
    ): Promise<MedicationListResponseDto> {
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const personId = person_id ? parseInt(person_id, 10) : undefined;
        const visitOccurrenceId = visit_occurrence_id ? parseInt(visit_occurrence_id, 10) : undefined;

        return this.medicationsService.searchMedications({
            limit: limitNum,
            cursor,
            person_id: personId,
            visit_occurrence_id: visitOccurrenceId,
            date_from,
            date_to,
        });
    }

    @Get(':id')
    @Permissions('medication.read')
    @ApiOperation({ summary: 'Get medication by ID' })
    @ApiResponse({ status: 200, description: 'Medication found', type: MedicationResponseDto })
    @ApiResponse({ status: 404, description: 'Medication not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getMedicationById(
        @Param('id', ParseIntPipe) medicationId: number,
    ): Promise<MedicationResponseDto> {
        return this.medicationsService.getMedicationById(medicationId);
    }

    @Patch(':id')
    @Permissions('medication.update')
    @ApiOperation({ summary: 'Update medication' })
    @ApiResponse({ status: 200, description: 'Medication updated', type: MedicationResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 404, description: 'Medication not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async updateMedication(
        @Param('id', ParseIntPipe) medicationId: number,
        @Body() updateMedicationDto: UpdateMedicationDto,
    ): Promise<MedicationResponseDto> {
        return this.medicationsService.updateMedication(medicationId, updateMedicationDto);
    }
}

