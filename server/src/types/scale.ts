/**
 * HUME Scale Types - Issue #11
 * 
 * TypeScript interfaces for HUME smart scale data and API responses
 */

// Raw database record from scale_data_ingest table
export interface ScaleDataRecord {
  id: number
  image_filename: string
  image_date: Date
  health_score?: number
  weight?: number
  metabolic_age?: number
  weight_before?: number
  weight_after?: number
  body_fat_percentage_before?: number
  body_fat_percentage_after?: number
  body_fat_mass_before?: number
  body_fat_mass_after?: number
  lean_mass_before?: number
  lean_mass_after?: number
  subcutaneous_fat_mass_before?: number
  subcutaneous_fat_mass_after?: number
  visceral_fat_index_before?: number
  visceral_fat_index_after?: number
  skeletal_muscle_mass_before?: number
  skeletal_muscle_mass_after?: number
  skeletal_mass_before?: number
  skeletal_mass_after?: number
  body_water_before?: number
  body_water_after?: number
  bmr_before?: number
  bmr_after?: number
  metabolic_age_before?: number
  metabolic_age_after?: number
  resting_heart_rate_before?: number
  resting_heart_rate_after?: number
  body_cell_mass_before?: number
  body_cell_mass_after?: number
}

// Processed weight session data for API responses
export interface WeightSession {
  date: string
  health_score?: number
  weight_after?: number
  body_fat_percentage_after?: number
  body_fat_mass_after?: number
  lean_mass_after?: number
  skeletal_muscle_mass_after?: number
  skeletal_mass_after?: number
  body_water_after?: number
  bmr_after?: number
  metabolic_age_after?: number
  resting_heart_rate_after?: number
  body_cell_mass_after?: number
  subcutaneous_fat_mass_after?: number
  visceral_fat_index_after?: number
}

// Weight session summary with before/after comparison
export interface WeightSessionSummary extends WeightSession {
  weight_before?: number
  weight_after?: number
  body_fat_percentage_before?: number
  body_fat_percentage_after?: number
  weight_change?: number | null
  body_fat_change?: number | null
}

// Trend analysis data
export interface WeightTrend {
  metric: string
  current_value?: number
  previous_value?: number
  change_amount?: number | null
  change_percentage?: number | null
  trend_direction: 'increasing' | 'decreasing' | 'stable'
  days_analyzed: number
}

// Health snapshot for dashboard overview
export interface HealthSnapshot {
  date: string
  weight?: number
  body_fat_percentage?: number
  skeletal_muscle_mass?: number
  body_water?: number
  bmr?: number
  resting_heart_rate?: number
  metabolic_age?: number
  health_score?: number
}

// Goal progress tracking
export interface GoalProgress {
  metric: string
  current_value?: number
  goal_value?: number
  start_value?: number
  progress_percentage?: number
  remaining_amount?: number
  estimated_completion_date?: string
}

// Query filters for scale data
export interface ScaleQueryFilters {
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  metrics?: string[]
}

// API response wrapper
export interface ScaleApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  total_records?: number
}

// Error types
export class ScaleDataError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'ScaleDataError'
  }
}

// Utility functions for calculations
export const calculateChange = (current?: number, previous?: number): number | null => {
  if (current === undefined || previous === undefined) return null
  return current - previous
}

export const calculatePercentageChange = (current?: number, previous?: number): number | null => {
  if (current === undefined || previous === undefined || previous === 0) return null
  return ((current - previous) / previous) * 100
}

export const getTrendDirection = (change?: number | null): 'increasing' | 'decreasing' | 'stable' => {
  if (change === null || change === undefined) return 'stable'
  if (Math.abs(change) < 0.1) return 'stable' // Small changes considered stable
  return change > 0 ? 'increasing' : 'decreasing'
}

// Constants for health metrics
export const HEALTH_METRICS = {
  WEIGHT: 'weight',
  BODY_FAT_PERCENTAGE: 'body_fat_percentage',
  LEAN_MASS: 'lean_mass',
  SKELETAL_MUSCLE_MASS: 'skeletal_muscle_mass',
  BMR: 'bmr',
  RESTING_HEART_RATE: 'resting_heart_rate',
  BODY_WATER: 'body_water',
  VISCERAL_FAT_INDEX: 'visceral_fat_index',
  HEALTH_SCORE: 'health_score'
} as const

export type HealthMetric = typeof HEALTH_METRICS[keyof typeof HEALTH_METRICS]

// Default values and thresholds
export const DEFAULT_QUERY_LIMIT = 30
export const MAX_QUERY_LIMIT = 365
export const STABLE_CHANGE_THRESHOLD = 0.1
