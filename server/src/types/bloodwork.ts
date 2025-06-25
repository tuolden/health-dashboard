/**
 * Bloodwork Lab Data Types - Issue #13
 * 
 * TypeScript interfaces for bloodwork lab visualization system
 */

// Core lab result interface
export interface LabResult {
  id?: number
  test_name: string
  value: string | number
  collected_on: string // ISO date string
  numeric_value?: number // Parsed numeric value
  is_numeric?: boolean
}

// Lab test metadata with reference ranges
export interface LabMetric {
  id?: number
  test_name: string
  range_min?: number
  range_max?: number
  units?: string
  category?: string
  description?: string
}

// Enhanced lab result with metadata
export interface EnhancedLabResult extends LabResult {
  metric?: LabMetric
  is_in_range?: boolean
  deviation_score?: number // How far from normal range
  risk_level?: 'low' | 'normal' | 'elevated' | 'high' | 'critical'
  trend_direction?: 'increasing' | 'decreasing' | 'stable'
  change_from_previous?: number
  change_percentage?: number
}

// Lab panel groupings
export interface LabPanel {
  panel_name: string
  tests: EnhancedLabResult[]
  overall_status: 'normal' | 'abnormal' | 'critical'
  abnormal_count: number
  total_count: number
}

// Common lab panels
export const LAB_PANELS = {
  CBC: 'Complete Blood Count',
  LIPID: 'Lipid Panel',
  CMP: 'Comprehensive Metabolic Panel',
  LIVER: 'Liver Function',
  KIDNEY: 'Kidney Function',
  THYROID: 'Thyroid Function',
  HORMONE: 'Hormone Panel',
  URINE: 'Urinalysis'
} as const

export type LabPanelType = keyof typeof LAB_PANELS

// Lab summary for a specific date
export interface LabSummary {
  collected_on: string
  total_tests: number
  in_range_count: number
  out_of_range_count: number
  critical_count: number
  panels: LabPanel[]
  top_concerns: EnhancedLabResult[]
  overall_health_score?: number
}

// Trend analysis
export interface LabTrend {
  test_name: string
  values: Array<{
    date: string
    value: number
    is_in_range: boolean
  }>
  trend_direction: 'increasing' | 'decreasing' | 'stable'
  slope?: number
  correlation?: number
  latest_value: number
  previous_value?: number
  change_amount?: number
  change_percentage?: number
}

// Risk assessment
export interface RiskAssessment {
  test_name: string
  current_value: number
  risk_level: 'low' | 'normal' | 'elevated' | 'high' | 'critical'
  risk_score: number // 0-100
  risk_factors: string[]
  recommendations: string[]
}

// Query filters
export interface BloodworkQueryFilters {
  startDate?: string
  endDate?: string
  testNames?: string[]
  panelType?: LabPanelType
  limit?: number
  offset?: number
  onlyAbnormal?: boolean
  riskLevel?: string[]
}

// Database error handling
export class BloodworkDataError extends Error {
  constructor(
    message: string,
    public code: string = 'BLOODWORK_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'BloodworkDataError'
  }
}

// Constants
export const DEFAULT_QUERY_LIMIT = 50
export const MAX_QUERY_LIMIT = 1000

// Common lab test categories
export const LAB_CATEGORIES = {
  // Complete Blood Count
  CBC: [
    'WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC', 'RDW',
    'Platelet Count', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'
  ],
  
  // Lipid Panel
  LIPID: [
    'Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides',
    'Non-HDL Cholesterol', 'Cholesterol/HDL Ratio'
  ],
  
  // Comprehensive Metabolic Panel
  CMP: [
    'Glucose', 'BUN', 'Creatinine', 'eGFR', 'BUN/Creatinine Ratio',
    'Sodium', 'Potassium', 'Chloride', 'CO2', 'Anion Gap',
    'Calcium', 'Total Protein', 'Albumin', 'Globulin', 'A/G Ratio',
    'Bilirubin Total', 'Alkaline Phosphatase', 'AST', 'ALT'
  ],

  // Liver Function
  LIVER: [
    'AST', 'ALT', 'Alkaline Phosphatase', 'Bilirubin Total', 'Bilirubin Direct',
    'GGT', 'Total Protein', 'Albumin', 'Globulin', 'A/G Ratio'
  ],

  // Kidney Function
  KIDNEY: [
    'BUN', 'Creatinine', 'eGFR', 'BUN/Creatinine Ratio', 'Uric Acid',
    'Cystatin C', 'Microalbumin'
  ],
  
  // Thyroid Function
  THYROID: [
    'TSH', 'Free T4', 'Free T3', 'Reverse T3', 'TPO Antibodies', 'Thyroglobulin Antibodies'
  ],
  
  // Hormone Panel
  HORMONE: [
    'Testosterone Total', 'Testosterone Free', 'SHBG', 'PSA', 'DHEA-S',
    'Cortisol', 'Insulin', 'IGF-1'
  ],
  
  // Urinalysis
  URINE: [
    'Urine Specific Gravity', 'Urine pH', 'Urine Protein', 'Urine Glucose',
    'Urine Ketones', 'Urine Blood', 'Urine Leukocyte Esterase', 'Urine Nitrites'
  ]
} as const

// Risk level thresholds
export const RISK_THRESHOLDS = {
  DEVIATION_MILD: 1.2,    // 20% outside normal range
  DEVIATION_MODERATE: 1.5, // 50% outside normal range  
  DEVIATION_SEVERE: 2.0,   // 100% outside normal range
  DEVIATION_CRITICAL: 3.0  // 200% outside normal range
} as const

// Utility functions
export function calculateDeviationScore(value: number, rangeMin?: number, rangeMax?: number): number {
  if (!rangeMin || !rangeMax) return 0
  
  if (value >= rangeMin && value <= rangeMax) return 0
  
  if (value < rangeMin) {
    return Math.abs((rangeMin - value) / rangeMin)
  } else {
    return Math.abs((value - rangeMax) / rangeMax)
  }
}

export function getRiskLevel(deviationScore: number): 'low' | 'normal' | 'elevated' | 'high' | 'critical' {
  if (deviationScore === 0) return 'normal'
  if (deviationScore < RISK_THRESHOLDS.DEVIATION_MILD) return 'low'
  if (deviationScore < RISK_THRESHOLDS.DEVIATION_MODERATE) return 'elevated'
  if (deviationScore < RISK_THRESHOLDS.DEVIATION_SEVERE) return 'high'
  return 'critical'
}

export function calculateTrendDirection(current: number, previous: number, threshold = 0.05): 'increasing' | 'decreasing' | 'stable' {
  const changePercent = Math.abs((current - previous) / previous)
  if (changePercent < threshold) return 'stable'
  return current > previous ? 'increasing' : 'decreasing'
}
