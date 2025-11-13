import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('active-inpatients')
    @Permissions('reports.view')
    @ApiOperation({ summary: 'Get active inpatients report' })
    @ApiResponse({ status: 200, description: 'Active inpatients list' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getActiveInpatients() {
        return this.reportsService.getActiveInpatients();
    }

    @Get('daily-counts')
    @Permissions('reports.view')
    @ApiOperation({ summary: 'Get daily visit counts' })
    @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'date_to', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'visit_type', required: false, enum: ['OPD', 'IPD', 'ER'], description: 'Filter by visit type' })
    @ApiResponse({ status: 200, description: 'Daily counts report' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getDailyCounts(
        @Query('date_from') date_from?: string,
        @Query('date_to') date_to?: string,
        @Query('visit_type') visit_type?: 'OPD' | 'IPD' | 'ER',
    ) {
        return this.reportsService.getDailyCounts({
            date_from,
            date_to,
            visit_type,
        });
    }

    @Get('statistics')
    @Permissions('reports.view')
    @ApiOperation({ summary: 'Get visit statistics summary' })
    @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'date_to', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
    @ApiResponse({ status: 200, description: 'Visit statistics' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    async getVisitStatistics(
        @Query('date_from') date_from?: string,
        @Query('date_to') date_to?: string,
    ) {
        return this.reportsService.getVisitStatistics({
            date_from,
            date_to,
        });
    }
}

