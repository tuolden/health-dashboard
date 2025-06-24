/**
 * Polar Heart Rate Data Types - Issue #9
 * 
 * TypeScript interfaces for polar_metrics table and workout session analysis
 */

// Raw polar metrics from database table
export interface PolarMetrics {
  id: number
  recorded_time_utc: Date
  heart_rate: number | null
  latitude: number | null
  longitude: number | null
  altitude: number | null
  speed: number | null
  sport: string | null
  raw_json: string | null
}

// Workout session detected from polar data
export interface WorkoutSession {
  sport: string
  session_start: string // ISO timestamp
  session_end: string // ISO timestamp
  duration_min: number
  avg_heart_rate: number | null
  calories_burned: number | null
  zones: ZoneBreakdown
  recovery_drop_bpm: number | null
  intensity_score: number | null
  trimp_score: number | null
  fat_burn_ratio: number | null
  cardio_ratio: number | null
  bpm_std_dev: number | null
  warmup_duration_sec: number | null
}

// Heart rate zone breakdown
export interface ZoneBreakdown {
  Z1: number // minutes in zone 1
  Z2: number // minutes in zone 2
  Z3: number // minutes in zone 3
  Z4: number // minutes in zone 4
  Z5: number // minutes in zone 5
}

// Query filters for polar data
export interface PolarQueryFilters {
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  sport?: string
  limit?: number
  offset?: number
}

// Heart rate zones configuration
export interface HeartRateZones {
  maxHeartRate: number
  zones: {
    Z1: { min: number; max: number; name: string } // Recovery
    Z2: { min: number; max: number; name: string } // Aerobic
    Z3: { min: number; max: number; name: string } // Anaerobic
    Z4: { min: number; max: number; name: string } // VO2 Max
    Z5: { min: number; max: number; name: string } // Neuromuscular
  }
}

// Training load point for trend analysis
export interface IntensityScorePoint {
  date: string
  trimp_score: number
}

// Session detection parameters
export interface SessionDetectionConfig {
  minSessionDuration: number // minimum minutes for a valid session
  maxGapDuration: number // maximum minutes gap before ending session
  minHeartRate: number // minimum BPM to consider valid
  maxHeartRate: number // maximum BPM to consider valid
}

// Workout summary for REST API
export interface WorkoutSummary {
  sport: string
  session_start: string
  session_end: string
  duration_min: number
  avg_heart_rate: number | null
  calories_burned: number | null
  zones: ZoneBreakdown
  recovery_drop_bpm: number | null
  intensity_score: number | null
  trimp_score: number | null
  fat_burn_ratio: number | null
  cardio_ratio: number | null
  bpm_std_dev: number | null
  warmup_duration_sec: number | null
}

// Heart rate thresholds and constants
export const HEART_RATE_THRESHOLDS = {
  RESTING: {
    EXCELLENT: 50,
    GOOD: 60,
    AVERAGE: 70,
    POOR: 80
  },
  ZONES: {
    // Based on percentage of max heart rate
    Z1_MIN: 0.50, // 50-60% - Recovery
    Z1_MAX: 0.60,
    Z2_MIN: 0.60, // 60-70% - Aerobic
    Z2_MAX: 0.70,
    Z3_MIN: 0.70, // 70-80% - Anaerobic
    Z3_MAX: 0.80,
    Z4_MIN: 0.80, // 80-90% - VO2 Max
    Z4_MAX: 0.90,
    Z5_MIN: 0.90, // 90-100% - Neuromuscular
    Z5_MAX: 1.00
  },
  CALORIES: {
    // Calories per minute by zone (rough estimates)
    Z1_CAL_PER_MIN: 8,
    Z2_CAL_PER_MIN: 12,
    Z3_CAL_PER_MIN: 16,
    Z4_CAL_PER_MIN: 20,
    Z5_CAL_PER_MIN: 25
  },
  SESSION_DETECTION: {
    MIN_DURATION_MINUTES: 10, // Minimum 10 minutes for valid session
    MAX_GAP_MINUTES: 5, // Max 5 minute gap before ending session
    MIN_HEART_RATE: 50, // Minimum valid heart rate
    MAX_HEART_RATE: 220, // Maximum valid heart rate
    WARMUP_THRESHOLD_MINUTES: 5 // Time to reach target zone
  }
} as const

// Default heart rate zones (can be personalized later)
export const DEFAULT_MAX_HEART_RATE = 190 // Age-based: 220 - 30 years old

// Error types for polar data operations
export class PolarDataError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'PolarDataError'
  }
}

export class PolarValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message)
    this.name = 'PolarValidationError'
  }
}

// Utility functions
export const calculateHeartRateZones = (maxHeartRate: number = DEFAULT_MAX_HEART_RATE): HeartRateZones => {
  return {
    maxHeartRate,
    zones: {
      Z1: {
        min: Math.round(maxHeartRate * HEART_RATE_THRESHOLDS.ZONES.Z1_MIN),
        max: Math.round(maxHeartRate * HEART_RATE_THRESHOLDS.ZONES.Z1_MAX),
        name: 'Recovery'
      },
      Z2: {
        min: Math.round(maxHeartRate * HEART_RATE_THRESHOLDS.ZONES.Z2_MIN),
        max: Math.round(maxHeartRate * HEART_RATE_THRESHOLDS.ZONES.Z2_MAX),
        name: 'Aerobic'
      },
      Z3: {
        min: Math.round(maxHeartRate * HEART_RATE_THRESHOLDS.ZONES.Z3_MIN),
        max: Math.round(maxHeartRate * HEART_RATE_THRESHOLDS.ZONES.Z3_MAX),
        name: 'Anaerobic'
      },
      Z4: {
        min: Math.round(maxHeartRate * HEART_RATE_THRESHOLDS.ZONES.Z4_MIN),
        max: Math.round(maxHeartRate * HEART_RATE_THRESHOLDS.ZONES.Z4_MAX),
        name: 'VO2 Max'
      },
      Z5: {
        min: Math.round(maxHeartRate * HEART_RATE_THRESHOLDS.ZONES.Z5_MIN),
        max: Math.round(maxHeartRate * HEART_RATE_THRESHOLDS.ZONES.Z5_MAX),
        name: 'Neuromuscular'
      }
    }
  }
}

export const getHeartRateZone = (heartRate: number, zones: HeartRateZones): 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5' | null => {
  if (heartRate >= zones.zones.Z5.min) return 'Z5'
  if (heartRate >= zones.zones.Z4.min) return 'Z4'
  if (heartRate >= zones.zones.Z3.min) return 'Z3'
  if (heartRate >= zones.zones.Z2.min) return 'Z2'
  if (heartRate >= zones.zones.Z1.min) return 'Z1'
  return null
}

export const calculateCaloriesForZone = (zone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5', minutes: number): number => {
  const caloriesPerMinute = {
    Z1: HEART_RATE_THRESHOLDS.CALORIES.Z1_CAL_PER_MIN,
    Z2: HEART_RATE_THRESHOLDS.CALORIES.Z2_CAL_PER_MIN,
    Z3: HEART_RATE_THRESHOLDS.CALORIES.Z3_CAL_PER_MIN,
    Z4: HEART_RATE_THRESHOLDS.CALORIES.Z4_CAL_PER_MIN,
    Z5: HEART_RATE_THRESHOLDS.CALORIES.Z5_CAL_PER_MIN
  }
  return Math.round(caloriesPerMinute[zone] * minutes)
}

export const formatDateForApi = (date: Date): string => {
  return date.toISOString().split('T')[0]!
}
