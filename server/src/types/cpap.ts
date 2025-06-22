/**
 * CPAP Data Types - Issue #7
 * 
 * TypeScript interfaces for CPAP metrics from health_ingest database
 */

// Raw CPAP metrics from database table
export interface CpapMetrics {
  id: number
  session_start: Date
  file_type: string
  flow_rate_avg: number | null
  mask_pressure_avg: number | null
  tidal_volume_avg: number | null
  minute_ventilation_avg: number | null
  respiratory_rate_avg: number | null
  leak_rate_avg: number | null
  spo2_avg: number | null
  pulse_rate_avg: number | null
  pressure_avg: number | null
  file_path: string | null
}

// Daily summary for REST API /api/cpap/daily-summary
export interface CpapDailySummary {
  date: string // YYYY-MM-DD format
  spo2_avg: number | null
  pulse_rate_avg: number | null
  leak_rate_avg: number | null
  session_start: string // ISO timestamp of first session that day
}

// GraphQL CPAPMetrics type
export interface CpapMetricsGraphQL {
  date: string
  spo2_avg: number | null
  pulse_rate_avg: number | null
  leak_rate_avg: number | null
  session_start: string
}

// Query filters for CPAP data
export interface CpapQueryFilters {
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  limit?: number
  offset?: number
}

// Widget-specific data types

// SpO2 Daily Trend Widget data
export interface Spo2TrendData {
  date: string
  spo2_avg: number | null
  isHealthy: boolean // Based on SpO2 >= 90%
  qualityRating: 'excellent' | 'good' | 'concerning' | 'critical'
}

// SpO2 + Pulse Rate Dual-Axis Widget data
export interface Spo2PulseData {
  date: string
  spo2_avg: number | null
  pulse_rate_avg: number | null
  correlation: 'normal' | 'concerning' | 'critical'
}

// Leak Rate Trend Widget data
export interface LeakRateData {
  date: string
  leak_rate_avg: number | null
  isWithinThreshold: boolean // <= 24 L/min
  severity: 'excellent' | 'good' | 'concerning' | 'critical'
}

// Sleep Session Start Time Widget data
export interface SleepSessionData {
  date: string
  session_start: string // ISO timestamp
  bedtime_hour: number // Hour of day (0-23)
  sleep_pattern: 'early' | 'normal' | 'late' | 'irregular'
}

// Health thresholds for CPAP data
export const CPAP_THRESHOLDS = {
  SPO2: {
    EXCELLENT: 95, // >= 95%
    GOOD: 92,      // >= 92%
    CONCERNING: 90, // >= 90%
    CRITICAL: 88   // < 88%
  },
  LEAK_RATE: {
    EXCELLENT: 10,  // <= 10 L/min
    GOOD: 20,       // <= 20 L/min
    CONCERNING: 24, // <= 24 L/min (threshold from issue)
    CRITICAL: 30    // > 24 L/min
  },
  PULSE_RATE: {
    MIN_NORMAL: 50,
    MAX_NORMAL: 100,
    CONCERNING_HIGH: 110
  },
  BEDTIME: {
    EARLY: 21,    // Before 9 PM
    NORMAL_START: 21,
    NORMAL_END: 23,
    LATE: 23      // After 11 PM
  }
} as const

// Error types for CPAP operations
export class CpapDataError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'CpapDataError'
  }
}

export class CpapValidationError extends CpapDataError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class CpapNotFoundError extends CpapDataError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404)
  }
}

// Utility functions for CPAP data processing
export const calculateSpo2Quality = (spo2: number | null): 'excellent' | 'good' | 'concerning' | 'critical' => {
  if (!spo2 || spo2 <= 0) return 'critical'
  
  if (spo2 >= CPAP_THRESHOLDS.SPO2.EXCELLENT) return 'excellent'
  if (spo2 >= CPAP_THRESHOLDS.SPO2.GOOD) return 'good'
  if (spo2 >= CPAP_THRESHOLDS.SPO2.CONCERNING) return 'concerning'
  return 'critical'
}

export const calculateLeakSeverity = (leakRate: number | null): 'excellent' | 'good' | 'concerning' | 'critical' => {
  if (!leakRate || leakRate < 0) return 'critical'
  
  if (leakRate <= CPAP_THRESHOLDS.LEAK_RATE.EXCELLENT) return 'excellent'
  if (leakRate <= CPAP_THRESHOLDS.LEAK_RATE.GOOD) return 'good'
  if (leakRate <= CPAP_THRESHOLDS.LEAK_RATE.CONCERNING) return 'concerning'
  return 'critical'
}

export const calculateSleepPattern = (sessionStart: Date): 'early' | 'normal' | 'late' | 'irregular' => {
  const hour = sessionStart.getHours()
  
  if (hour < CPAP_THRESHOLDS.BEDTIME.EARLY) return 'irregular' // Very early (before 9 PM)
  if (hour <= CPAP_THRESHOLDS.BEDTIME.NORMAL_END) return 'normal' // 9 PM - 11 PM
  if (hour <= 23) return 'late' // 11 PM - 11:59 PM
  return 'irregular' // After midnight
}

export const formatDateForApi = (date: Date): string => {
  const isoString = date.toISOString()
  const datePart = isoString.split('T')[0]
  return datePart || '' // YYYY-MM-DD
}

export const parseApiDate = (dateString: string): Date => {
  const date = new Date(dateString + 'T00:00:00Z')
  if (isNaN(date.getTime())) {
    throw new CpapValidationError(`Invalid date format: ${dateString}. Expected YYYY-MM-DD`)
  }
  return date
}
