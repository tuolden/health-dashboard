/**
 * Scale Widget Types - Issue #11
 * 
 * TypeScript interfaces for HUME scale widget data structures
 */

// Base scale data point
export interface ScaleDataPoint {
  date: string
  value?: number
  displayDate?: string
}

// Number widget data
export interface ScaleNumberData {
  current_value?: number
  previous_value?: number
  change_amount?: number
  change_percentage?: number
  trend_direction?: 'increasing' | 'decreasing' | 'stable'
  unit?: string
  label?: string
  date?: string
}

// Trend widget data
export interface ScaleTrendData {
  data: ScaleDataPoint[]
  metric: string
  unit?: string
  current_value?: number
  change_amount?: number
  trend_direction?: 'increasing' | 'decreasing' | 'stable'
}

// Comparison widget data point
export interface ScaleComparisonDataPoint {
  date: string
  before?: number
  after?: number
  change?: number
  displayDate?: string
}

// Comparison widget data
export interface ScaleComparisonData {
  data: ScaleComparisonDataPoint[]
  metric: string
  unit?: string
  latest_before?: number
  latest_after?: number
  latest_change?: number
}

// Progress widget data
export interface ScaleProgressData {
  current_value?: number
  goal_value?: number
  start_value?: number
  progress_percentage?: number
  remaining_amount?: number
  estimated_completion_date?: string
  unit?: string
  metric: string
}

// Health snapshot data
export interface HealthSnapshotData {
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

// Weight session data
export interface WeightSessionData {
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

// API response wrapper
export interface ScaleApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  total_records?: number
}
