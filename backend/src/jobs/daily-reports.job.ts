import { Injectable } from '@nestjs/common';
import { logger } from '../common/logger/logger.config';
import { ReportsRepository } from '../reports/reports.repository';

/**
 * Daily Reports Job
 * Example scheduled job for generating daily reports
 * Can be integrated with BullMQ or NestJS @Cron decorator
 */
@Injectable()
export class DailyReportsJob {
    constructor(private readonly reportsRepository: ReportsRepository) { }

    /**
     * Generate daily visit counts report
     * This method can be called by a cron job or scheduler
     * Example cron: "0 0 * * *" (runs daily at midnight)
     */
    async generateDailyCountsReport(): Promise<void> {
        logger.info('Starting daily counts report generation');

        try {
            // Get yesterday's date
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const counts = await this.reportsRepository.getDailyCounts({
                date_from: yesterday,
                date_to: today,
            });

            logger.info({ counts, date: yesterday.toISOString().split('T')[0] }, 'Daily counts report generated');

            // Here you could:
            // - Store the report in a reports table
            // - Send email notification
            // - Export to file
            // - Push to analytics system
        } catch (error: any) {
            logger.error({ error }, 'Failed to generate daily counts report');
            throw error;
        }
    }

    /**
     * Generate active inpatients report
     * This method can be called periodically (e.g., every hour)
     */
    async generateActiveInpatientsReport(): Promise<void> {
        logger.info('Starting active inpatients report generation');

        try {
            const inpatients = await this.reportsRepository.getActiveInpatients();

            logger.info(
                { count: inpatients.length },
                'Active inpatients report generated',
            );

            // Here you could:
            // - Store the report
            // - Send alerts if count exceeds threshold
            // - Update dashboard
        } catch (error: any) {
            logger.error({ error }, 'Failed to generate active inpatients report');
            throw error;
        }
    }

    /**
     * Generate weekly statistics report
     * Example cron: "0 0 * * 0" (runs weekly on Sunday at midnight)
     */
    async generateWeeklyStatisticsReport(): Promise<void> {
        logger.info('Starting weekly statistics report generation');

        try {
            // Get last week's date range
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - 1); // Yesterday
            endDate.setHours(23, 59, 59, 999);

            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6); // 7 days ago
            startDate.setHours(0, 0, 0, 0);

            const statistics = await this.reportsRepository.getVisitStatistics({
                date_from: startDate,
                date_to: endDate,
            });

            logger.info(
                { statistics, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
                'Weekly statistics report generated',
            );

            // Here you could:
            // - Store the report
            // - Send weekly summary email
            // - Generate PDF report
        } catch (error: any) {
            logger.error({ error }, 'Failed to generate weekly statistics report');
            throw error;
        }
    }
}

