import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';

export interface ActiveInpatientReport {
    person_id: number;
    visit_occurrence_id: number;
    visit_number: string;
    visit_start: Date;
    days_in_hospital: number;
    first_name?: string;
    last_name?: string;
    mrn: string;
}

export interface DailyCountReport {
    date: string; // YYYY-MM-DD
    visit_type: string;
    count: number;
}

export interface ReportFilters {
    date_from?: Date;
    date_to?: Date;
    visit_type?: 'OPD' | 'IPD' | 'ER';
}

/**
 * Reports Repository
 * Read-only queries for reporting
 * Supports optional read replica
 */
@Injectable()
export class ReportsRepository {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    /**
     * Get active inpatients report
     * Returns all patients currently admitted (visit_end IS NULL)
     */
    async getActiveInpatients(): Promise<ActiveInpatientReport[]> {
        const { rows } = await this.databaseService.query<ActiveInpatientReport>(
            `SELECT 
        v.visit_occurrence_id,
        v.person_id,
        v.visit_number,
        v.visit_start,
        v.visit_type,
        p.first_name,
        p.last_name,
        p.mrn,
        EXTRACT(DAY FROM (now() - v.visit_start))::INTEGER as days_in_hospital
      FROM visit_occurrence v
      INNER JOIN person p ON v.person_id = p.person_id
      WHERE v.visit_type = 'IPD'
        AND v.visit_end IS NULL
      ORDER BY v.visit_start ASC`,
        );

        logger.debug({ count: rows.length }, 'Active inpatients report generated');
        return rows;
    }

    /**
     * Get daily visit counts
     * Groups visits by date and type
     */
    async getDailyCounts(filters: ReportFilters): Promise<DailyCountReport[]> {
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.date_from) {
            conditions.push(`DATE(v.visit_start) >= $${paramIndex++}`);
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push(`DATE(v.visit_start) <= $${paramIndex++}`);
            params.push(filters.date_to);
        }

        if (filters.visit_type) {
            conditions.push(`v.visit_type = $${paramIndex++}`);
            params.push(filters.visit_type);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const { rows } = await this.databaseService.query<DailyCountReport>(
            `SELECT 
        DATE(v.visit_start)::TEXT as date,
        v.visit_type,
        COUNT(*)::INTEGER as count
      FROM visit_occurrence v
      ${whereClause}
      GROUP BY DATE(v.visit_start), v.visit_type
      ORDER BY date DESC, visit_type ASC`,
            params,
        );

        logger.debug({ count: rows.length, filters }, 'Daily counts report generated');
        return rows;
    }

    /**
     * Get visit statistics summary
     */
    async getVisitStatistics(filters: ReportFilters): Promise<{
        total_visits: number;
        opd_count: number;
        ipd_count: number;
        er_count: number;
        active_ipd: number;
    }> {
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.date_from) {
            conditions.push(`v.visit_start >= $${paramIndex++}`);
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push(`v.visit_start <= $${paramIndex++}`);
            params.push(filters.date_to);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const { rows } = await this.databaseService.query<{
            total_visits: number;
            opd_count: number;
            ipd_count: number;
            er_count: number;
            active_ipd: number;
        }>(
            `SELECT 
        COUNT(*)::INTEGER as total_visits,
        COUNT(*) FILTER (WHERE v.visit_type = 'OPD')::INTEGER as opd_count,
        COUNT(*) FILTER (WHERE v.visit_type = 'IPD')::INTEGER as ipd_count,
        COUNT(*) FILTER (WHERE v.visit_type = 'ER')::INTEGER as er_count,
        COUNT(*) FILTER (WHERE v.visit_type = 'IPD' AND v.visit_end IS NULL)::INTEGER as active_ipd
      FROM visit_occurrence v
      ${whereClause}`,
            params,
        );

        return rows[0] || {
            total_visits: 0,
            opd_count: 0,
            ipd_count: 0,
            er_count: 0,
            active_ipd: 0,
        };
    }
}

