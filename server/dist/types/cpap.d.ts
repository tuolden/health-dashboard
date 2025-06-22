/**
 * CPAP Data Types - Issue #7
 *
 * TypeScript interfaces for CPAP metrics from health_ingest database
 */
export interface CpapMetrics {
    id: number;
    session_start: Date;
    file_type: string;
    flow_rate_avg: number | null;
    mask_pressure_avg: number | null;
    tidal_volume_avg: number | null;
    minute_ventilation_avg: number | null;
    respiratory_rate_avg: number | null;
    leak_rate_avg: number | null;
    spo2_avg: number | null;
    pulse_rate_avg: number | null;
    pressure_avg: number | null;
    file_path: string | null;
}
export interface CpapDailySummary {
    date: string;
    spo2_avg: number | null;
    pulse_rate_avg: number | null;
    leak_rate_avg: number | null;
    session_start: string;
}
export interface CpapMetricsGraphQL {
    date: string;
    spo2_avg: number | null;
    pulse_rate_avg: number | null;
    leak_rate_avg: number | null;
    session_start: string;
}
export interface CpapQueryFilters {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}
export interface Spo2TrendData {
    date: string;
    spo2_avg: number | null;
    isHealthy: boolean;
    qualityRating: 'excellent' | 'good' | 'concerning' | 'critical';
}
export interface Spo2PulseData {
    date: string;
    spo2_avg: number | null;
    pulse_rate_avg: number | null;
    correlation: 'normal' | 'concerning' | 'critical';
}
export interface LeakRateData {
    date: string;
    leak_rate_avg: number | null;
    isWithinThreshold: boolean;
    severity: 'excellent' | 'good' | 'concerning' | 'critical';
}
export interface SleepSessionData {
    date: string;
    session_start: string;
    bedtime_hour: number;
    sleep_pattern: 'early' | 'normal' | 'late' | 'irregular';
}
export declare const CPAP_THRESHOLDS: {
    readonly SPO2: {
        readonly EXCELLENT: 95;
        readonly GOOD: 92;
        readonly CONCERNING: 90;
        readonly CRITICAL: 88;
    };
    readonly LEAK_RATE: {
        readonly EXCELLENT: 10;
        readonly GOOD: 20;
        readonly CONCERNING: 24;
        readonly CRITICAL: 30;
    };
    readonly PULSE_RATE: {
        readonly MIN_NORMAL: 50;
        readonly MAX_NORMAL: 100;
        readonly CONCERNING_HIGH: 110;
    };
    readonly BEDTIME: {
        readonly EARLY: 21;
        readonly NORMAL_START: 21;
        readonly NORMAL_END: 23;
        readonly LATE: 23;
    };
};
export declare class CpapDataError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class CpapValidationError extends CpapDataError {
    constructor(message: string);
}
export declare class CpapNotFoundError extends CpapDataError {
    constructor(message: string);
}
export declare const calculateSpo2Quality: (spo2: number | null) => "excellent" | "good" | "concerning" | "critical";
export declare const calculateLeakSeverity: (leakRate: number | null) => "excellent" | "good" | "concerning" | "critical";
export declare const calculateSleepPattern: (sessionStart: Date) => "early" | "normal" | "late" | "irregular";
export declare const formatDateForApi: (date: Date) => string;
export declare const parseApiDate: (dateString: string) => Date;
//# sourceMappingURL=cpap.d.ts.map