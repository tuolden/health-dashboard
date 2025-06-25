/**
 * Scale Data Access Object - Issue #11
 *
 * Database operations for scale_data_ingest table and HUME scale metrics
 */
import { Pool } from 'pg';
import { WeightSession, WeightSessionSummary, WeightTrend, HealthSnapshot, ScaleQueryFilters } from '../types/scale';
export declare class ScaleDao {
    private pool;
    constructor(dbPool?: Pool);
    /**
     * Get weight sessions with date filtering
     */
    getWeightSessions(filters?: ScaleQueryFilters): Promise<WeightSession[]>;
    /**
     * Get weight session summary with before/after comparison
     */
    getWeightSessionSummary(filters?: ScaleQueryFilters): Promise<WeightSessionSummary[]>;
    /**
     * Get latest health snapshot
     */
    getLatestHealthSnapshot(): Promise<HealthSnapshot | null>;
    /**
     * Calculate weight delta for specified time period
     */
    getWeightDelta(days: number): Promise<WeightTrend | null>;
    /**
     * Get database health statistics
     */
    getScaleDbStats(): Promise<any>;
}
//# sourceMappingURL=scaleDao.d.ts.map