/**
 * CPAP Data Access Object - Issue #7
 *
 * Database operations for CPAP metrics from health_ingest database
 */
import { Pool } from 'pg';
import { CpapMetrics, CpapDailySummary, CpapMetricsGraphQL, CpapQueryFilters, Spo2TrendData, Spo2PulseData, LeakRateData, SleepSessionData } from '../types/cpap';
export declare class CpapDao {
    private pool;
    constructor(dbPool?: Pool);
    /**
     * Get daily summary for REST API /api/cpap/daily-summary
     */
    getDailySummary(filters?: CpapQueryFilters): Promise<CpapDailySummary[]>;
    /**
     * Get CPAP metrics range for GraphQL getCPAPMetricsRange query
     */
    getCpapMetricsRange(startDate: string, endDate: string): Promise<CpapMetricsGraphQL[]>;
    /**
     * Get SpO2 trend data for SpO2 Daily Trend Widget
     */
    getSpo2TrendData(startDate: string, endDate: string): Promise<Spo2TrendData[]>;
    /**
     * Get SpO2 + Pulse Rate data for dual-axis widget
     */
    getSpo2PulseData(startDate: string, endDate: string): Promise<Spo2PulseData[]>;
    /**
     * Get leak rate data for Leak Rate Trend Widget
     */
    getLeakRateData(startDate: string, endDate: string): Promise<LeakRateData[]>;
    /**
     * Get sleep session start time data for Sleep Session Start Time Widget
     */
    getSleepSessionData(startDate: string, endDate: string): Promise<SleepSessionData[]>;
    /**
     * Get raw CPAP metrics with optional filters
     */
    getRawMetrics(filters?: CpapQueryFilters): Promise<CpapMetrics[]>;
}
//# sourceMappingURL=cpapDao.d.ts.map