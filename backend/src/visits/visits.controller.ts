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
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { VisitListResponseDto, VisitResponseDto } from './dto/visit-response.dto';
import { VisitsService } from './visits.service';

@ApiTags('Visits')
@Controller('visits')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class VisitsController {
    constructor(private readonly visitsService: VisitsService) { }

    @Post()
    @Permissions('visit.create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new visit' })
    @ApiResponse({ status: 201, description: 'Visit created', type: VisitResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 409, description: 'Overlapping inpatient visit exists' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async createVisit(@Body() createVisitDto: CreateVisitDto): Promise<VisitResponseDto> {
        return this.visitsService.createVisit(createVisitDto);
    }

    @Get()
    @Permissions('visit.read')
    @ApiOperation({ summary: 'Search visits with filters' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiQuery({ name: 'person_id', required: false, type: Number, description: 'Filter by patient ID' })
    @ApiQuery({ name: 'provider_id', required: false, type: String, description: 'Filter by provider UUID' })
    @ApiQuery({ name: 'type', required: false, enum: ['OPD', 'IPD', 'ER'], description: 'Filter by visit type' })
    @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Filter visits from date (ISO 8601)' })
    @ApiQuery({ name: 'date_to', required: false, type: String, description: 'Filter visits to date (ISO 8601)' })
    @ApiResponse({ status: 200, description: 'Visits list', type: VisitListResponseDto })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async searchVisits(
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('person_id') person_id?: string,
        @Query('provider_id') provider_id?: string,
        @Query('type') type?: 'OPD' | 'IPD' | 'ER',
        @Query('date_from') date_from?: string,
        @Query('date_to') date_to?: string,
    ): Promise<VisitListResponseDto> {
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const personId = person_id ? parseInt(person_id, 10) : undefined;

        return this.visitsService.searchVisits({
            limit: limitNum,
            cursor,
            person_id: personId,
            provider_id: provider_id,
            type,
            date_from,
            date_to,
        });
    }

    @Get('active-inpatient/:person_id')
    @Permissions('visit.read')
    @ApiOperation({ summary: 'Get active inpatient visits for a patient' })
    @ApiResponse({ status: 200, description: 'Active inpatient visits', type: [VisitResponseDto] })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getActiveInpatientVisits(
        @Param('person_id', ParseIntPipe) personId: number,
    ): Promise<VisitResponseDto[]> {
        return this.visitsService.getActiveInpatientVisits(personId);
    }

    @Get('visit-number/:visit_number')
    @Permissions('visit.read')
    @ApiOperation({ summary: 'Get visit by visit number' })
    @ApiResponse({ status: 200, description: 'Visit found', type: VisitResponseDto })
    @ApiResponse({ status: 404, description: 'Visit not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getVisitByVisitNumber(
        @Param('visit_number') visitNumber: string,
    ): Promise<VisitResponseDto> {
        return this.visitsService.getVisitByVisitNumber(visitNumber);
    }

    @Get(':id')
    @Permissions('visit.read')
    @ApiOperation({ summary: 'Get visit by ID' })
    @ApiResponse({ status: 200, description: 'Visit found', type: VisitResponseDto })
    @ApiResponse({ status: 404, description: 'Visit not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getVisitById(
        @Param('id', ParseIntPipe) visitId: number,
    ): Promise<VisitResponseDto> {
        return this.visitsService.getVisitById(visitId);
    }

    @Patch(':id')
    @Permissions('visit.update')
    @ApiOperation({ summary: 'Update visit' })
    @ApiResponse({ status: 200, description: 'Visit updated', type: VisitResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 404, description: 'Visit not found' })
    @ApiResponse({ status: 409, description: 'Overlapping inpatient visit exists' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async updateVisit(
        @Param('id', ParseIntPipe) visitId: number,
        @Body() updateVisitDto: UpdateVisitDto,
    ): Promise<VisitResponseDto> {
        return this.visitsService.updateVisit(visitId, updateVisitDto);
    }
}

