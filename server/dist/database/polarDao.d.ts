/**
 * Polar Data Access Object - Issue #9
 *
 * Database operations for polar_metrics table and workout session analysis
 */
import { Pool } from 'pg';
import { PolarMetrics, WorkoutSession, WorkoutSummary, PolarQueryFilters } from '../types/polar';
export declare class PolarDao {
    private pool;
    constructor(dbPool?: Pool);
    /**
     * Get workout sessions summary for REST API /api/workouts/summary
     */
    getWorkoutSummary(filters?: PolarQueryFilters): Promise<WorkoutSummary[]>;
    /**
     * Detect workout sessions from polar_metrics data
     * Groups contiguous heart rate data by sport and time gaps
     */
    detectWorkoutSessions(filters?: PolarQueryFilters): Promise<WorkoutSession[]>;
    /**
     * Process raw polar data into workout sessions
     */
    private processRawDataIntoSessions;
    /**
     * Calculate comprehensive metrics for a workout session
     */
    private calculateSessionMetrics;
    /**
     * Calculate standard deviation for heart rate variability
     */
    private calculateStandardDeviation;
    /**
     * Get raw polar metrics with optional filters
     */
    getRawMetrics(filters?: PolarQueryFilters): Promise<PolarMetrics[]>;
}
//# sourceMappingURL=polarDao.d.ts.map