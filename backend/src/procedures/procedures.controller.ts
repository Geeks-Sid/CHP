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
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { ProcedureListResponseDto, ProcedureResponseDto } from './dto/procedure-response.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { ProceduresService } from './procedures.service';

@ApiTags('Procedures')
@Controller('procedures')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProceduresController {
    constructor(private readonly proceduresService: ProceduresService) { }

    @Post()
    @Permissions('procedure.create')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new procedure' })
    @ApiResponse({ status: 201, description: 'Procedure created', type: ProcedureResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async createProcedure(@Body() createProcedureDto: CreateProcedureDto): Promise<ProcedureResponseDto> {
        return this.proceduresService.createProcedure(createProcedureDto);
    }

    @Get()
    @Permissions('procedure.read')
    @ApiOperation({ summary: 'Search procedures with filters' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor' })
    @ApiQuery({ name: 'person_id', required: false, type: Number, description: 'Filter by patient ID' })
    @ApiQuery({ name: 'visit_occurrence_id', required: false, type: Number, description: 'Filter by visit ID' })
    @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Filter procedures from date (ISO 8601)' })
    @ApiQuery({ name: 'date_to', required: false, type: String, description: 'Filter procedures to date (ISO 8601)' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by patient name or procedure name' })
    @ApiResponse({ status: 200, description: 'Procedures list', type: ProcedureListResponseDto })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async searchProcedures(
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('person_id') person_id?: string,
        @Query('visit_occurrence_id') visit_occurrence_id?: string,
        @Query('date_from') date_from?: string,
        @Query('date_to') date_to?: string,
        @Query('search') search?: string,
    ): Promise<ProcedureListResponseDto> {
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const personId = person_id ? parseInt(person_id, 10) : undefined;
        const visitOccurrenceId = visit_occurrence_id ? parseInt(visit_occurrence_id, 10) : undefined;

        return this.proceduresService.searchProcedures({
            limit: limitNum,
            cursor,
            person_id: personId,
            visit_occurrence_id: visitOccurrenceId,
            date_from,
            date_to,
            search,
        });
    }

    @Get(':id')
    @Permissions('procedure.read')
    @ApiOperation({ summary: 'Get procedure by ID' })
    @ApiResponse({ status: 200, description: 'Procedure found', type: ProcedureResponseDto })
    @ApiResponse({ status: 404, description: 'Procedure not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getProcedureById(
        @Param('id', ParseIntPipe) procedureId: number,
    ): Promise<ProcedureResponseDto> {
        return this.proceduresService.getProcedureById(procedureId);
    }

    @Patch(':id')
    @Permissions('procedure.update')
    @ApiOperation({ summary: 'Update procedure' })
    @ApiResponse({ status: 200, description: 'Procedure updated', type: ProcedureResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 404, description: 'Procedure not found' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async updateProcedure(
        @Param('id', ParseIntPipe) procedureId: number,
        @Body() updateProcedureDto: UpdateProcedureDto,
    ): Promise<ProcedureResponseDto> {
        return this.proceduresService.updateProcedure(procedureId, updateProcedureDto);
    }
}

