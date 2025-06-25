/**
 * Scale Widget Components - Issue #11
 * 
 * Export all HUME scale widget components for easy importing
 */

// Base components
export { default as ScaleBaseWidget } from './ScaleBaseWidget'
export { default as ScaleNumberWidget } from './ScaleNumberWidget'
export { default as ScaleTrendWidget } from './ScaleTrendWidget'
export { default as ScaleComparisonWidget } from './ScaleComparisonWidget'
export { default as ScaleProgressWidget } from './ScaleProgressWidget'

// Weight & Fat Tracking Widgets (1-5)
export { default as CurrentWeightWidget } from './CurrentWeightWidget'
export { default as WeightOverTimeWidget } from './WeightOverTimeWidget'
export { default as BodyFatPercentageWidget } from './BodyFatPercentageWidget'
export { default as BodyFatMassWidget } from './BodyFatMassWidget'
export { default as LeanMassWidget } from './LeanMassWidget'

// Muscle & Skeletal Strength Widgets (6-8)
export { default as SkeletalMuscleMassTodayWidget } from './SkeletalMuscleMassTodayWidget'
export { default as SkeletalMuscleMassTrendWidget } from './SkeletalMuscleMassTrendWidget'
export { default as SkeletalMassWidget } from './SkeletalMassWidget'

// Metabolic Health Widgets (9-12)
export { default as MetabolicAgeWidget } from './MetabolicAgeWidget'
export { default as BMROverTimeWidget } from './BMROverTimeWidget'
export { default as RestingHeartRateOverTimeWidget } from './RestingHeartRateOverTimeWidget'
export { default as RestingHeartRateTodayWidget } from './RestingHeartRateTodayWidget'

// Composition & Hydration Widgets (13-15)
export { default as BodyWaterPercentageWidget } from './BodyWaterPercentageWidget'
export { default as SubcutaneousFatMassWidget } from './SubcutaneousFatMassWidget'
export { default as VisceralFatIndexWidget } from './VisceralFatIndexWidget'

// Cellular Health Widgets (16-17)
export { default as BodyCellMassTrendWidget } from './BodyCellMassTrendWidget'
export { default as BCMvsLeanMassWidget } from './BCMvsLeanMassWidget'

// Dynamic Trends Widgets (18-20)
export { default as WeightChange7DaysWidget } from './WeightChange7DaysWidget'
export { default as BodyFatChange30DaysWidget } from './BodyFatChange30DaysWidget'
export { default as LeanMassVsBodyFatWidget } from './LeanMassVsBodyFatWidget'

// Before & After Insights Widgets (21-22)
export { default as WeightBeforeAfterWidget } from './WeightBeforeAfterWidget'
export { default as BodyFatBeforeAfterWidget } from './BodyFatBeforeAfterWidget'

// Holistic Overview Widgets (23-25)
export { default as HealthScoreOverTimeWidget } from './HealthScoreOverTimeWidget'
export { default as DailyHealthSnapshotWidget } from './DailyHealthSnapshotWidget'
export { default as GoalProgressWidget } from './GoalProgressWidget'

// Re-export types for convenience
export type {
  ScaleNumberData,
  ScaleTrendData,
  ScaleComparisonData,
  ScaleProgressData,
  HealthSnapshotData,
  WeightSessionData,
  ScaleApiResponse
} from './types'
