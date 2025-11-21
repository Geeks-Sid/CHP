import {
    Body,
    Controller,
    Delete,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { DiagnosisListResponseDto, DiagnosisResponseDto } from './dto/diagnosis-response.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { DiagnosesService } from './diagnoses.service';

@ApiTags('Diagnoses')
@Controller('diagnoses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DiagnosesController {
    constructor(private readonly diagnosesService: DiagnosesService) { }

    @Post()
    @Permissions('diagnosis.create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new diagnosis' })
    @ApiResponse({ status: 201, description: 'Diagnosis created', type: DiagnosisResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async createDiagnosis(
        @Body() createDiagnosisDto: CreateDiagnosisDto,
        @CurrentUser() user: any,
    ): Promise<DiagnosisResponseDto> {
        return this.diagnosesService.createDiagnosis(createDiagnosisDto, user?.userId);
    }

    @Get()
    @Permissions('diagnosis.read')
    @ApiOperation({ summary: 'Search diagnoses with filters' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiQuery({ name: 'person_id', required: false, type: Number, description: 'Filter by patient ID' })
    @ApiQuery({ name: 'visit_occurrence_id', required: false, type: Number, description: 'Filter by visit ID' })
    @ApiQuery({ name: 'active_only', required: false, type: Boolean, description: 'Filter only active diagnoses' })
    @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Filter diagnoses from date (ISO 8601)' })
    @ApiQuery({ name: 'date_to', required: false, type: String, description: 'Filter diagnoses to date (ISO 8601)' })
    @ApiQuery({ name: 'condition_type_concept_id', required: false, type: Number, description: 'Filter by diagnosis type' })
    @ApiQuery({ name: 'is_principal_diagnosis', required: false, type: Boolean, description: 'Filter by principal diagnosis' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by diagnosis name or ICD-10 code' })
    @ApiResponse({ status: 200, description: 'Diagnoses list', type: DiagnosisListResponseDto })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async searchDiagnoses(
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('person_id') person_id?: string,
        @Query('visit_occurrence_id') visit_occurrence_id?: string,
        @Query('active_only') active_only?: string,
        @Query('date_from') date_from?: string,
        @Query('date_to') date_to?: string,
        @Query('condition_type_concept_id') condition_type_concept_id?: string,
        @Query('is_principal_diagnosis') is_principal_diagnosis?: string,
        @Query('search') search?: string,
    ): Promise<DiagnosisListResponseDto> {
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const personId = person_id ? parseInt(person_id, 10) : undefined;
        const visitOccurrenceId = visit_occurrence_id ? parseInt(visit_occurrence_id, 10) : undefined;
        const activeOnly = active_only === 'true';
        const conditionTypeConceptId = condition_type_concept_id ? parseInt(condition_type_concept_id, 10) : undefined;
        const isPrincipal = is_principal_diagnosis === 'true' ? true : is_principal_diagnosis === 'false' ? false : undefined;

        return this.diagnosesService.searchDiagnoses({
            limit: limitNum,
            cursor,
            person_id: personId,
            visit_occurrence_id: visitOccurrenceId,
            active_only: activeOnly,
            date_from: date_from,
            date_to: date_to,
            condition_type_concept_id: conditionTypeConceptId,
            is_principal_diagnosis: isPrincipal,
            search,
        });
    }

    @Get('patient/:personId')
    @Permissions('diagnosis.read')
    @ApiOperation({ summary: 'Get all diagnoses for a patient' })
    @ApiQuery({ name: 'active_only', required: false, type: Boolean, description: 'Filter only active diagnoses' })
    @ApiQuery({ name: 'visit_id', required: false, type: Number, description: 'Filter by visit ID' })
    @ApiResponse({ status: 200, description: 'Diagnoses list', type: [DiagnosisResponseDto] })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getDiagnosesByPatient(
        @Param('personId', ParseIntPipe) personId: number,
        @Query('active_only') active_only?: string,
        @Query('visit_id') visit_id?: string,
    ): Promise<DiagnosisResponseDto[]> {
        const activeOnly = active_only === 'true';
        const visitId = visit_id ? parseInt(visit_id, 10) : undefined;

        return this.diagnosesService.getDiagnosesByPatient(personId, {
            active_only: activeOnly,
            visit_id: visitId,
        });
    }

    @Get('visit/:visitId')
    @Permissions('diagnosis.read')
    @ApiOperation({ summary: 'Get all diagnoses for a visit' })
    @ApiResponse({ status: 200, description: 'Diagnoses list', type: [DiagnosisResponseDto] })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getDiagnosesByVisit(
        @Param('visitId', ParseIntPipe) visitId: number,
    ): Promise<DiagnosisResponseDto[]> {
        return this.diagnosesService.getDiagnosesByVisit(visitId);
    }

    @Get(':id')
    @Permissions('diagnosis.read')
    @ApiOperation({ summary: 'Get diagnosis by ID' })
    @ApiResponse({ status: 200, description: 'Diagnosis found', type: DiagnosisResponseDto })
    @ApiResponse({ status: 404, description: 'Diagnosis not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getDiagnosisById(
        @Param('id', ParseIntPipe) conditionId: number,
    ): Promise<DiagnosisResponseDto> {
        return this.diagnosesService.getDiagnosisById(conditionId);
    }

    @Patch(':id')
    @Permissions('diagnosis.update')
    @ApiOperation({ summary: 'Update diagnosis' })
    @ApiResponse({ status: 200, description: 'Diagnosis updated', type: DiagnosisResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 404, description: 'Diagnosis not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async updateDiagnosis(
        @Param('id', ParseIntPipe) conditionId: number,
        @Body() updateDiagnosisDto: UpdateDiagnosisDto,
        @CurrentUser() user: any,
    ): Promise<DiagnosisResponseDto> {
        return this.diagnosesService.updateDiagnosis(conditionId, updateDiagnosisDto, user?.userId);
    }

    @Patch(':id/principal')
    @Permissions('diagnosis.update')
    @ApiOperation({ summary: 'Set diagnosis as principal for a visit' })
    @ApiResponse({ status: 200, description: 'Principal diagnosis set', type: DiagnosisResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 404, description: 'Diagnosis not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async setPrincipalDiagnosis(
        @Param('id', ParseIntPipe) conditionId: number,
        @Body() body: { visit_id: number },
    ): Promise<DiagnosisResponseDto> {
        return this.diagnosesService.setPrincipalDiagnosis(conditionId, body.visit_id);
    }

    @Delete(':id')
    @Permissions('diagnosis.delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete diagnosis' })
    @ApiResponse({ status: 204, description: 'Diagnosis deleted' })
    @ApiResponse({ status: 404, description: 'Diagnosis not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async deleteDiagnosis(
        @Param('id', ParseIntPipe) conditionId: number,
    ): Promise<void> {
        return this.diagnosesService.deleteDiagnosis(conditionId);
    }
}

