/**
 * Polar Heart Rate Data Types - Issue #9
 *
 * TypeScript interfaces for polar_metrics table and workout session analysis
 */
export interface PolarMetrics {
    id: number;
    recorded_time_utc: Date;
    heart_rate: number | null;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    speed: number | null;
    sport: string | null;
    raw_json: string | null;
}
export interface WorkoutSession {
    sport: string;
    session_start: string;
    session_end: string;
    duration_min: number;
    avg_heart_rate: number | null;
    calories_burned: number | null;
    zones: ZoneBreakdown;
    recovery_drop_bpm: number | null;
    intensity_score: number | null;
    trimp_score: number | null;
    fat_burn_ratio: number | null;
    cardio_ratio: number | null;
    bpm_std_dev: number | null;
    warmup_duration_sec: number | null;
}
export interface ZoneBreakdown {
    Z1: number;
    Z2: number;
    Z3: number;
    Z4: number;
    Z5: number;
}
export interface PolarQueryFilters {
    startDate?: string;
    endDate?: string;
    sport?: string;
    limit?: number;
    offset?: number;
}
export interface HeartRateZones {
    maxHeartRate: number;
    zones: {
        Z1: {
            min: number;
            max: number;
            name: string;
        };
        Z2: {
            min: number;
            max: number;
            name: string;
        };
        Z3: {
            min: number;
            max: number;
            name: string;
        };
        Z4: {
            min: number;
            max: number;
            name: string;
        };
        Z5: {
            min: number;
            max: number;
            name: string;
        };
    };
}
export interface IntensityScorePoint {
    date: string;
    trimp_score: number;
}
export interface SessionDetectionConfig {
    minSessionDuration: number;
    maxGapDuration: number;
    minHeartRate: number;
    maxHeartRate: number;
}
export interface WorkoutSummary {
    sport: string;
    session_start: string;
    session_end: string;
    duration_min: number;
    avg_heart_rate: number | null;
    calories_burned: number | null;
    zones: ZoneBreakdown;
    recovery_drop_bpm: number | null;
    intensity_score: number | null;
    trimp_score: number | null;
    fat_burn_ratio: number | null;
    cardio_ratio: number | null;
    bpm_std_dev: number | null;
    warmup_duration_sec: number | null;
}
export declare const HEART_RATE_THRESHOLDS: {
    readonly RESTING: {
        readonly EXCELLENT: 50;
        readonly GOOD: 60;
        readonly AVERAGE: 70;
        readonly POOR: 80;
    };
    readonly ZONES: {
        readonly Z1_MIN: 0.5;
        readonly Z1_MAX: 0.6;
        readonly Z2_MIN: 0.6;
        readonly Z2_MAX: 0.7;
        readonly Z3_MIN: 0.7;
        readonly Z3_MAX: 0.8;
        readonly Z4_MIN: 0.8;
        readonly Z4_MAX: 0.9;
        readonly Z5_MIN: 0.9;
        readonly Z5_MAX: 1;
    };
    readonly CALORIES: {
        readonly Z1_CAL_PER_MIN: 8;
        readonly Z2_CAL_PER_MIN: 12;
        readonly Z3_CAL_PER_MIN: 16;
        readonly Z4_CAL_PER_MIN: 20;
        readonly Z5_CAL_PER_MIN: 25;
    };
    readonly SESSION_DETECTION: {
        readonly MIN_DURATION_MINUTES: 10;
        readonly MAX_GAP_MINUTES: 5;
        readonly MIN_HEART_RATE: 50;
        readonly MAX_HEART_RATE: 220;
        readonly WARMUP_THRESHOLD_MINUTES: 5;
    };
};
export declare const DEFAULT_MAX_HEART_RATE = 190;
export declare class PolarDataError extends Error {
    code: string;
    constructor(message: string, code: string);
}
export declare class PolarValidationError extends Error {
    field: string;
    constructor(message: string, field: string);
}
export declare const calculateHeartRateZones: (maxHeartRate?: number) => HeartRateZones;
export declare const getHeartRateZone: (heartRate: number, zones: HeartRateZones) => "Z1" | "Z2" | "Z3" | "Z4" | "Z5" | null;
export declare const calculateCaloriesForZone: (zone: "Z1" | "Z2" | "Z3" | "Z4" | "Z5", minutes: number) => number;
export declare const formatDateForApi: (date: Date) => string;
//# sourceMappingURL=polar.d.ts.map