/**
 * HUME Scale Types - Issue #11
 *
 * TypeScript interfaces for HUME smart scale data and API responses
 */
export interface ScaleDataRecord {
    id: number;
    image_filename: string;
    image_date: Date;
    health_score?: number;
    weight?: number;
    metabolic_age?: number;
    weight_before?: number;
    weight_after?: number;
    body_fat_percentage_before?: number;
    body_fat_percentage_after?: number;
    body_fat_mass_before?: number;
    body_fat_mass_after?: number;
    lean_mass_before?: number;
    lean_mass_after?: number;
    subcutaneous_fat_mass_before?: number;
    subcutaneous_fat_mass_after?: number;
    visceral_fat_index_before?: number;
    visceral_fat_index_after?: number;
    skeletal_muscle_mass_before?: number;
    skeletal_muscle_mass_after?: number;
    skeletal_mass_before?: number;
    skeletal_mass_after?: number;
    body_water_before?: number;
    body_water_after?: number;
    bmr_before?: number;
    bmr_after?: number;
    metabolic_age_before?: number;
    metabolic_age_after?: number;
    resting_heart_rate_before?: number;
    resting_heart_rate_after?: number;
    body_cell_mass_before?: number;
    body_cell_mass_after?: number;
}
export interface WeightSession {
    date: string;
    health_score?: number;
    weight_after?: number;
    body_fat_percentage_after?: number;
    body_fat_mass_after?: number;
    lean_mass_after?: number;
    skeletal_muscle_mass_after?: number;
    skeletal_mass_after?: number;
    body_water_after?: number;
    bmr_after?: number;
    metabolic_age_after?: number;
    resting_heart_rate_after?: number;
    body_cell_mass_after?: number;
    subcutaneous_fat_mass_after?: number;
    visceral_fat_index_after?: number;
}
export interface WeightSessionSummary extends WeightSession {
    weight_before?: number;
    weight_after?: number;
    body_fat_percentage_before?: number;
    body_fat_percentage_after?: number;
    weight_change?: number | null;
    body_fat_change?: number | null;
}
export interface WeightTrend {
    metric: string;
    current_value?: number;
    previous_value?: number;
    change_amount?: number | null;
    change_percentage?: number | null;
    trend_direction: 'increasing' | 'decreasing' | 'stable';
    days_analyzed: number;
}
export interface HealthSnapshot {
    date: string;
    weight?: number;
    body_fat_percentage?: number;
    skeletal_muscle_mass?: number;
    body_water?: number;
    bmr?: number;
    resting_heart_rate?: number;
    metabolic_age?: number;
    health_score?: number;
}
export interface GoalProgress {
    metric: string;
    current_value?: number;
    goal_value?: number;
    start_value?: number;
    progress_percentage?: number;
    remaining_amount?: number;
    estimated_completion_date?: string;
}
export interface ScaleQueryFilters {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    metrics?: string[];
}
export interface ScaleApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
    total_records?: number;
}
export declare class ScaleDataError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare const calculateChange: (current?: number, previous?: number) => number | null;
export declare const calculatePercentageChange: (current?: number, previous?: number) => number | null;
export declare const getTrendDirection: (change?: number | null) => "increasing" | "decreasing" | "stable";
export declare const HEALTH_METRICS: {
    readonly WEIGHT: "weight";
    readonly BODY_FAT_PERCENTAGE: "body_fat_percentage";
    readonly LEAN_MASS: "lean_mass";
    readonly SKELETAL_MUSCLE_MASS: "skeletal_muscle_mass";
    readonly BMR: "bmr";
    readonly RESTING_HEART_RATE: "resting_heart_rate";
    readonly BODY_WATER: "body_water";
    readonly VISCERAL_FAT_INDEX: "visceral_fat_index";
    readonly HEALTH_SCORE: "health_score";
};
export type HealthMetric = typeof HEALTH_METRICS[keyof typeof HEALTH_METRICS];
export declare const DEFAULT_QUERY_LIMIT = 30;
export declare const MAX_QUERY_LIMIT = 365;
export declare const STABLE_CHANGE_THRESHOLD = 0.1;
//# sourceMappingURL=scale.d.ts.map