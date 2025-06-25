/**
 * Bloodwork Data Access Object - Issue #13
 *
 * Database operations for bloodwork lab data visualization
 */
import { Pool } from 'pg';
import { LabResult, LabMetric, EnhancedLabResult, LabSummary, LabTrend, BloodworkQueryFilters } from '../types/bloodwork';
export declare class BloodworkDao {
    private pool;
    constructor(dbPool?: Pool);
    /**
     * Get lab results with optional filtering
     */
    getLabResults(filters?: BloodworkQueryFilters): Promise<LabResult[]>;
    /**
     * Get lab metrics (reference ranges)
     */
    getLabMetrics(testNames?: string[]): Promise<LabMetric[]>;
    /**
     * Get enhanced lab results with metadata and risk assessment
     */
    getEnhancedLabResults(filters?: BloodworkQueryFilters): Promise<EnhancedLabResult[]>;
    /**
     * Get lab summary for a specific date
     */
    getLabSummary(collectedOn: string): Promise<LabSummary | null>;
    /**
     * Get trend analysis for a specific test
     */
    getLabTrend(testName: string, days?: number): Promise<LabTrend | null>;
    /**
     * Get latest lab results (most recent date)
     */
    getLatestLabResults(): Promise<EnhancedLabResult[]>;
    /**
     * Get available test dates
     */
    getAvailableDates(): Promise<string[]>;
}
//# sourceMappingURL=bloodworkDao.d.ts.map