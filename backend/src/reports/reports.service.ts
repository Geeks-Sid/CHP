import { BadRequestException, Injectable } from '@nestjs/common';
import { logger } from '../common/logger/logger.config';
import {
    ActiveInpatientReport,
    DailyCountReport,
    ReportFilters,
    ReportsRepository,
} from './reports.repository';

/**
 * Reports Service
 * Business logic for reporting
 * Enforces time-window bounds and validation
 */
@Injectable()
export class ReportsService {
    private readonly MAX_DATE_RANGE_DAYS = 365; // Maximum 1 year range

    constructor(private readonly reportsRepository: ReportsRepository) { }

    /**
     * Get active inpatients report
     */
    async getActiveInpatients(): Promise<ActiveInpatientReport[]> {
        return this.reportsRepository.getActiveInpatients();
    }

    /**
     * Get daily visit counts
     * Validates date range
     */
    async getDailyCounts(filters: {
        date_from?: string;
        date_to?: string;
        visit_type?: 'OPD' | 'IPD' | 'ER';
    }): Promise<DailyCountReport[]> {
        // Parse and validate dates
        let dateFrom: Date | undefined;
        let dateTo: Date | undefined;

        if (filters.date_from) {
            dateFrom = new Date(filters.date_from);
            if (isNaN(dateFrom.getTime())) {
                throw new BadRequestException('Invalid date_from format');
            }
        }

        if (filters.date_to) {
            dateTo = new Date(filters.date_to);
            if (isNaN(dateTo.getTime())) {
                throw new BadRequestException('Invalid date_to format');
            }
        }

        // Validate date range
        if (dateFrom && dateTo) {
            if (dateTo < dateFrom) {
                throw new BadRequestException('date_to cannot be before date_from');
            }

            const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff > this.MAX_DATE_RANGE_DAYS) {
                throw new BadRequestException(
                    `Date range cannot exceed ${this.MAX_DATE_RANGE_DAYS} days`,
                );
            }
        }

        // Default to last 30 days if no dates provided
        if (!dateFrom && !dateTo) {
            dateTo = new Date();
            dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - 30);
        } else if (!dateFrom) {
            // If only date_to provided, default to 30 days before
            dateFrom = new Date(dateTo!);
            dateFrom.setDate(dateFrom.getDate() - 30);
        } else if (!dateTo) {
            // If only date_from provided, default to today
            dateTo = new Date();
        }

        const reportFilters: ReportFilters = {
            date_from: dateFrom,
            date_to: dateTo,
            visit_type: filters.visit_type,
        };

        return this.reportsRepository.getDailyCounts(reportFilters);
    }

    /**
     * Get visit statistics summary
     */
    async getVisitStatistics(filters: {
        date_from?: string;
        date_to?: string;
    }): Promise<{
        total_visits: number;
        opd_count: number;
        ipd_count: number;
        er_count: number;
        active_ipd: number;
    }> {
        // Parse and validate dates
        let dateFrom: Date | undefined;
        let dateTo: Date | undefined;

        if (filters.date_from) {
            dateFrom = new Date(filters.date_from);
            if (isNaN(dateFrom.getTime())) {
                throw new BadRequestException('Invalid date_from format');
            }
        }

        if (filters.date_to) {
            dateTo = new Date(filters.date_to);
            if (isNaN(dateTo.getTime())) {
                throw new BadRequestException('Invalid date_to format');
            }
        }

        // Validate date range
        if (dateFrom && dateTo && dateTo < dateFrom) {
            throw new BadRequestException('date_to cannot be before date_from');
        }

        const reportFilters: ReportFilters = {
            date_from: dateFrom,
            date_to: dateTo,
        };

        return this.reportsRepository.getVisitStatistics(reportFilters);
    }
}

