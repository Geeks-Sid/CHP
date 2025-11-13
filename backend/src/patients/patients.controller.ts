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
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientListResponseDto, PatientResponseDto } from './dto/patient-response.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Post()
    @Permissions('patient.create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new patient' })
    @ApiResponse({ status: 201, description: 'Patient created', type: PatientResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 409, description: 'User already linked to another patient' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async createPatient(@Body() createPatientDto: CreatePatientDto): Promise<PatientResponseDto> {
        return this.patientsService.createPatient(createPatientDto);
    }

    @Get()
    @Permissions('patient.read')
    @ApiOperation({ summary: 'Search patients with filters' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or MRN' })
    @ApiQuery({ name: 'dob', required: false, type: String, description: 'Filter by date of birth (YYYY-MM-DD)' })
    @ApiQuery({ name: 'gender_concept_id', required: false, type: Number, description: 'Filter by gender concept ID' })
    @ApiResponse({ status: 200, description: 'Patients list', type: PatientListResponseDto })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async searchPatients(
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('search') search?: string,
        @Query('dob') dob?: string,
        @Query('gender_concept_id') gender_concept_id?: string,
    ): Promise<PatientListResponseDto> {
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const genderId = gender_concept_id ? parseInt(gender_concept_id, 10) : undefined;

        return this.patientsService.searchPatients({
            limit: limitNum,
            cursor,
            search,
            dob,
            gender_concept_id: genderId,
        });
    }

    @Get('mrn/:mrn')
    @Permissions('patient.read')
    @ApiOperation({ summary: 'Get patient by MRN' })
    @ApiResponse({ status: 200, description: 'Patient found', type: PatientResponseDto })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getPatientByMRN(@Param('mrn') mrn: string): Promise<PatientResponseDto> {
        return this.patientsService.getPatientByMRN(mrn);
    }

    @Get(':person_id')
    @Permissions('patient.read')
    @ApiOperation({ summary: 'Get patient by ID' })
    @ApiResponse({ status: 200, description: 'Patient found', type: PatientResponseDto })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getPatientById(
        @Param('person_id', ParseIntPipe) personId: number,
    ): Promise<PatientResponseDto> {
        return this.patientsService.getPatientById(personId);
    }

    @Patch(':person_id')
    @Permissions('patient.update')
    @ApiOperation({ summary: 'Update patient' })
    @ApiResponse({ status: 200, description: 'Patient updated', type: PatientResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async updatePatient(
        @Param('person_id', ParseIntPipe) personId: number,
        @Body() updatePatientDto: UpdatePatientDto,
    ): Promise<PatientResponseDto> {
        return this.patientsService.updatePatient(personId, updatePatientDto);
    }
}

