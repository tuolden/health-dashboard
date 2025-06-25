/**
 * Bloodwork Widget Types - Issue #13
 * 
 * TypeScript interfaces for bloodwork lab visualization widgets
 */

// Core lab result interface
export interface LabResult {
  id?: number
  test_name: string
  value: string | number
  collected_on: string
  numeric_value?: number
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
  deviation_score?: number
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

// Widget props interfaces
export interface LabWidgetProps {
  className?: string
  refreshInterval?: number
  showRefreshButton?: boolean
  onError?: (error: Error) => void
  onDataUpdate?: (data: any) => void
}

export interface LabNumberWidgetProps extends LabWidgetProps {
  testName: string
  title?: string
  showTrend?: boolean
  showReferenceRange?: boolean
  precision?: number
}

export interface LabTrendWidgetProps extends LabWidgetProps {
  testName: string
  title?: string
  days?: number
  showReferenceLines?: boolean
  height?: number
}

export interface LabPanelWidgetProps extends LabWidgetProps {
  panelType: 'CBC' | 'LIPID' | 'CMP' | 'LIVER' | 'KIDNEY' | 'THYROID' | 'HORMONE' | 'URINE'
  title?: string
  showOnlyAbnormal?: boolean
  collectedOn?: string
}

export interface LabAlertWidgetProps extends LabWidgetProps {
  title?: string
  maxAlerts?: number
  riskLevels?: ('elevated' | 'high' | 'critical')[]
  collectedOn?: string
}

// Risk level styling
export const RISK_LEVEL_COLORS = {
  low: '#10B981',      // green-500
  normal: '#6B7280',   // gray-500
  elevated: '#F59E0B', // amber-500
  high: '#EF4444',     // red-500
  critical: '#DC2626'  // red-600
} as const

export const RISK_LEVEL_BACKGROUNDS = {
  low: '#ECFDF5',      // green-50
  normal: '#F9FAFB',   // gray-50
  elevated: '#FFFBEB', // amber-50
  high: '#FEF2F2',     // red-50
  critical: '#FEF2F2'  // red-50
} as const

// Lab panel categories
export const LAB_PANEL_TESTS = {
  CBC: [
    'WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC', 'RDW',
    'Platelet Count', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'
  ],
  LIPID: [
    'Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides',
    'Non-HDL Cholesterol', 'Cholesterol/HDL Ratio'
  ],
  CMP: [
    'Glucose', 'BUN', 'Creatinine', 'eGFR', 'BUN/Creatinine Ratio',
    'Sodium', 'Potassium', 'Chloride', 'CO2', 'Anion Gap',
    'Calcium', 'Total Protein', 'Albumin', 'Globulin', 'A/G Ratio',
    'Bilirubin Total', 'Alkaline Phosphatase', 'AST', 'ALT'
  ],
  LIVER: [
    'AST', 'ALT', 'Alkaline Phosphatase', 'Bilirubin Total', 'Bilirubin Direct',
    'GGT', 'Total Protein', 'Albumin', 'Globulin', 'A/G Ratio'
  ],
  KIDNEY: [
    'BUN', 'Creatinine', 'eGFR', 'BUN/Creatinine Ratio', 'Uric Acid',
    'Cystatin C', 'Microalbumin'
  ],
  THYROID: [
    'TSH', 'Free T4', 'Free T3', 'Reverse T3', 'TPO Antibodies', 'Thyroglobulin Antibodies'
  ],
  HORMONE: [
    'Testosterone Total', 'Testosterone Free', 'SHBG', 'PSA', 'DHEA-S',
    'Cortisol', 'Insulin', 'IGF-1'
  ],
  URINE: [
    'Urine Specific Gravity', 'Urine pH', 'Urine Protein', 'Urine Glucose',
    'Urine Ketones', 'Urine Blood', 'Urine Leukocyte Esterase', 'Urine Nitrites'
  ]
} as const

// Utility functions
export function getRiskLevelColor(riskLevel?: string): string {
  if (!riskLevel) return RISK_LEVEL_COLORS.normal
  return RISK_LEVEL_COLORS[riskLevel as keyof typeof RISK_LEVEL_COLORS] || RISK_LEVEL_COLORS.normal
}

export function getRiskLevelBackground(riskLevel?: string): string {
  if (!riskLevel) return RISK_LEVEL_BACKGROUNDS.normal
  return RISK_LEVEL_BACKGROUNDS[riskLevel as keyof typeof RISK_LEVEL_BACKGROUNDS] || RISK_LEVEL_BACKGROUNDS.normal
}

export function formatLabValue(value: string | number, units?: string, precision = 2): string {
  if (typeof value === 'string') {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return value
    value = numValue
  }
  
  const formatted = typeof value === 'number' ? value.toFixed(precision) : String(value)
  return units ? `${formatted} ${units}` : formatted
}

export function isValueInRange(value: number, rangeMin?: number, rangeMax?: number): boolean {
  if (!rangeMin || !rangeMax) return true
  return value >= rangeMin && value <= rangeMax
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}
