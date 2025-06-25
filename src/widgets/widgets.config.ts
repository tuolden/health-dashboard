import { WidgetRegistryEntry, WIDGET_SIZES } from '../types/widget'

import React from 'react'

// Import widget components (will be created next)
import StepsWidget from './StepsWidget'
import WaterIntakeWidget from './WaterIntakeWidget'
// import CaloriesWidget from './CaloriesWidget'
// import HeartRateWidget from './HeartRateWidget'
// import WeightHistoryWidget from './WeightHistoryWidget'

// Import CPAP widgets - Issue #7
import { CpapSpo2TrendWidget } from '../components/widgets/CpapSpo2TrendWidget'
import { CpapSpo2PulseWidget } from '../components/widgets/CpapSpo2PulseWidget'
import { CpapLeakRateWidget } from '../components/widgets/CpapLeakRateWidget'
import { CpapSleepSessionWidget } from '../components/widgets/CpapSleepSessionWidget'

// Import Workout widgets - Issue #9
import { WorkoutSummaryWidget } from '../components/widgets/WorkoutSummaryWidget'
import { WorkoutHeartRateWidget } from '../components/widgets/WorkoutHeartRateWidget'
import { WorkoutCaloriesWidget } from '../components/widgets/WorkoutCaloriesWidget'
import { WorkoutHeartRateTimeWidget } from '../components/widgets/WorkoutHeartRateTimeWidget'
import { WorkoutZonesWidget } from '../components/widgets/WorkoutZonesWidget'
import { WorkoutFatBurnRatioWidget } from '../components/widgets/WorkoutFatBurnRatioWidget'

// Import HUME Scale widgets - Issue #11
import {
  // Weight & Fat Tracking (1-5)
  CurrentWeightWidget,
  WeightOverTimeWidget,
  BodyFatPercentageWidget,
  BodyFatMassWidget,
  LeanMassWidget,
  // Muscle & Skeletal Strength (6-8)
  SkeletalMuscleMassTodayWidget,
  SkeletalMuscleMassTrendWidget,
  SkeletalMassWidget,
  // Metabolic Health (9-12)
  MetabolicAgeWidget,
  BMROverTimeWidget,
  RestingHeartRateOverTimeWidget,
  RestingHeartRateTodayWidget,
  // Composition & Hydration (13-15)
  BodyWaterPercentageWidget,
  SubcutaneousFatMassWidget,
  VisceralFatIndexWidget,
  // Cellular Health (16-17)
  BodyCellMassTrendWidget,
  BCMvsLeanMassWidget,
  // Dynamic Trends (18-20)
  WeightChange7DaysWidget,
  BodyFatChange30DaysWidget,
  LeanMassVsBodyFatWidget,
  // Before & After Insights (21-22)
  WeightBeforeAfterWidget,
  BodyFatBeforeAfterWidget,
  // Holistic Overview (23-25)
  HealthScoreOverTimeWidget,
  DailyHealthSnapshotWidget,
  GoalProgressWidget
} from '../components/widgets/scale'

// Temporary placeholder components for widgets not yet created
const CaloriesWidget: React.FC<any> = () => React.createElement('div', null, 'Calories Widget Coming Soon')
const HeartRateWidget: React.FC<any> = () => React.createElement('div', null, 'Heart Rate Widget Coming Soon')
const WeightHistoryWidget: React.FC<any> = () => React.createElement('div', null, 'Weight History Widget Coming Soon')

// Import mock data generators
import { 
  generateMockStepsData,
  generateMockWaterData,
  generateMockCaloriesData,
  generateMockHeartRateData,
  generateMockWeightData
} from './mockData'

/**
 * Widget Registry - Central configuration for all available widgets
 * Optimized for vertical screen layouts
 */
export const widgetRegistry: WidgetRegistryEntry[] = [
  {
    id: 'steps-today',
    title: 'Steps Today',
    description: 'Daily step count and progress toward goal',
    component: StepsWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 300000, // 5 minutes
    mockDataGenerator: generateMockStepsData,
    category: 'activity',
    priority: 10,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#79BBFF',
      animation: 'fade-in'
    }
  },
  {
    id: 'water-intake',
    title: 'Water Intake',
    description: 'Daily hydration tracking',
    component: WaterIntakeWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 600000, // 10 minutes
    mockDataGenerator: generateMockWaterData,
    category: 'nutrition',
    priority: 9,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#B8F2E6',
      animation: 'scale-in'
    }
  },
  {
    id: 'calories-macros',
    title: 'Calories & Macros',
    description: 'Daily calorie intake with macronutrient breakdown',
    component: CaloriesWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 900000, // 15 minutes
    mockDataGenerator: generateMockCaloriesData,
    category: 'nutrition',
    priority: 8,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#FFD94D',
      animation: 'pulse-soft'
    }
  },
  {
    id: 'heart-rate',
    title: 'Heart Rate',
    description: 'Current and resting heart rate monitoring',
    component: HeartRateWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval', // Temporarily disabled WebSocket
    refreshInterval: 60000, // 1 minute
    mockDataGenerator: generateMockHeartRateData,
    category: 'vitals',
    priority: 7,
    isEnabled: false, // Temporarily disabled
    version: '1.0.0',
    theme: {
      accentColor: '#FF6B6B',
      animation: 'pulse-soft'
    }
  },
  {
    id: 'weight-history',
    title: 'Weight Trend',
    description: 'Weight tracking with 7-day trend',
    component: WeightHistoryWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 3600000, // 1 hour
    mockDataGenerator: generateMockWeightData,
    category: 'vitals',
    priority: 6,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#E0BBE4',
      animation: 'fade-in'
    }
  },
  // CPAP Widgets - Issue #7
  {
    id: 'cpap-spo2-trend',
    title: 'SpO2 Daily Trend',
    description: 'Blood oxygen saturation monitoring for therapy effectiveness',
    component: CpapSpo2TrendWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'cpap',
    priority: 15,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#3b82f6',
      animation: 'fade-in'
    }
  },
  {
    id: 'cpap-spo2-pulse',
    title: 'SpO2 & Pulse Rate',
    description: 'Dual-axis correlation analysis of oxygen and heart rate',
    component: CpapSpo2PulseWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'cpap',
    priority: 14,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#8b5cf6',
      animation: 'fade-in'
    }
  },
  {
    id: 'cpap-leak-rate',
    title: 'Leak Rate Monitoring',
    description: 'Mask fit tracking with 24 L/min threshold monitoring',
    component: CpapLeakRateWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'cpap',
    priority: 13,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#f59e0b',
      animation: 'fade-in'
    }
  },
  {
    id: 'cpap-sleep-sessions',
    title: 'Sleep Start Times',
    description: 'CPAP session bedtime patterns and sleep schedule tracking',
    component: CpapSleepSessionWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 3600000, // 1 hour
    mockDataGenerator: () => ({}), // Real data from API
    category: 'cpap',
    priority: 12,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#6366f1',
      animation: 'fade-in'
    }
  },
  // Workout Widgets - Issue #9
  {
    id: 'workout-summary',
    title: 'Latest Workout',
    description: 'Summary of most recent workout session',
    component: WorkoutSummaryWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 300000, // 5 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'workout',
    priority: 20,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#3b82f6',
      animation: 'fade-in'
    }
  },
  {
    id: 'workout-heart-rate',
    title: 'Average Heart Rate',
    description: 'Heart rate analysis from recent workouts',
    component: WorkoutHeartRateWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 300000, // 5 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'workout',
    priority: 19,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#ef4444',
      animation: 'pulse-soft'
    }
  },
  {
    id: 'workout-calories',
    title: 'Calories Burned',
    description: 'Energy expenditure tracking from workouts',
    component: WorkoutCaloriesWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 300000, // 5 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'workout',
    priority: 18,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#f59e0b',
      animation: 'fade-in'
    }
  },
  {
    id: 'workout-heart-rate-time',
    title: 'Heart Rate Over Time',
    description: 'Heart rate progression during workout sessions',
    component: WorkoutHeartRateTimeWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 300000, // 5 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'workout',
    priority: 17,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#8b5cf6',
      animation: 'fade-in'
    }
  },
  {
    id: 'workout-zones',
    title: 'Heart Rate Zones',
    description: 'Time distribution across heart rate zones',
    component: WorkoutZonesWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 300000, // 5 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'workout',
    priority: 16,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#10b981',
      animation: 'fade-in'
    }
  },
  {
    id: 'workout-fat-burn-ratio',
    title: 'Fat Burn vs Cardio',
    description: 'Training balance between fat burn and cardio zones',
    component: WorkoutFatBurnRatioWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 300000, // 5 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'workout',
    priority: 15,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#ec4899',
      animation: 'fade-in'
    }
  },
  // HUME Scale Widgets - Issue #11 - Weight & Fat Tracking (1-5)
  {
    id: 'scale-current-weight',
    title: 'Current Weight',
    description: 'Latest weight measurement with trend analysis',
    component: CurrentWeightWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 50,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#2563eb',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-weight-over-time',
    title: 'Weight Over Time',
    description: 'Weight trend progression with goal tracking',
    component: WeightOverTimeWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 49,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#2563eb',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-body-fat-percentage',
    title: 'Body Fat % Over Time',
    description: 'Body fat percentage trend with health zones',
    component: BodyFatPercentageWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 48,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#dc2626',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-body-fat-mass',
    title: 'Body Fat Mass Over Time',
    description: 'Absolute body fat mass tracking in pounds',
    component: BodyFatMassWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 47,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#dc2626',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-lean-mass',
    title: 'Lean Mass Over Time',
    description: 'Lean body mass progression tracking',
    component: LeanMassWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 46,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#10b981',
      animation: 'fade-in'
    }
  },
  // Muscle & Skeletal Strength (6-8)
  {
    id: 'scale-skeletal-muscle-today',
    title: 'Skeletal Muscle Mass Today',
    description: 'Current skeletal muscle mass with comparison',
    component: SkeletalMuscleMassTodayWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 45,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#10b981',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-skeletal-muscle-trend',
    title: 'Skeletal Muscle Mass Trend',
    description: 'Skeletal muscle mass progression with fitness benchmarks',
    component: SkeletalMuscleMassTrendWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 44,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#10b981',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-skeletal-mass',
    title: 'Skeletal Mass Over Time',
    description: 'Bone mass/density progression tracking',
    component: SkeletalMassWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 43,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#8b5cf6',
      animation: 'fade-in'
    }
  },
  // Metabolic Health (9-12)
  {
    id: 'scale-metabolic-age',
    title: 'Metabolic Age vs Real Age',
    description: 'Metabolic age comparison with health assessment',
    component: MetabolicAgeWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 42,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#8b5cf6',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-bmr-over-time',
    title: 'BMR Over Time',
    description: 'Basal metabolic rate progression tracking',
    component: BMROverTimeWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 41,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#f59e0b',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-rhr-over-time',
    title: 'Resting Heart Rate Over Time',
    description: 'Resting heart rate trend with fitness zones',
    component: RestingHeartRateOverTimeWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 40,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#dc2626',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-rhr-today',
    title: 'Resting Heart Rate Today',
    description: 'Current resting heart rate with fitness assessment',
    component: RestingHeartRateTodayWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 39,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#dc2626',
      animation: 'fade-in'
    }
  },
  // Composition & Hydration (13-15)
  {
    id: 'scale-body-water-percentage',
    title: 'Body Water % Over Time',
    description: 'Body water percentage with hydration zones',
    component: BodyWaterPercentageWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 38,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#06b6d4',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-subcutaneous-fat-mass',
    title: 'Subcutaneous Fat Mass Over Time',
    description: 'Under-skin fat mass progression tracking',
    component: SubcutaneousFatMassWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 37,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#f59e0b',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-visceral-fat-index',
    title: 'Visceral Fat Index Trend',
    description: 'Organ fat index with health risk assessment',
    component: VisceralFatIndexWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 36,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#dc2626',
      animation: 'fade-in'
    }
  },
  // Cellular Health (16-17)
  {
    id: 'scale-body-cell-mass-trend',
    title: 'Body Cell Mass Trend',
    description: 'Active metabolic tissue progression',
    component: BodyCellMassTrendWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 35,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#8b5cf6',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-bcm-vs-lean-mass',
    title: 'BCM vs Lean Mass Today',
    description: 'Body cell mass vs lean mass ratio analysis',
    component: BCMvsLeanMassWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 34,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#8b5cf6',
      animation: 'fade-in'
    }
  },
  // Dynamic Trends (18-20)
  {
    id: 'scale-weight-change-7days',
    title: 'Weight Change (Last 7 Days)',
    description: '7-day weight change with trend analysis',
    component: WeightChange7DaysWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 33,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#3b82f6',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-body-fat-change-30days',
    title: 'Body Fat Change (Last 30 Days)',
    description: '30-day body fat mass change tracking',
    component: BodyFatChange30DaysWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 32,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#dc2626',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-lean-vs-body-fat',
    title: 'Lean Mass vs Body Fat Mass',
    description: 'Dual trend comparison of lean mass and body fat',
    component: LeanMassVsBodyFatWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 31,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#10b981',
      animation: 'fade-in'
    }
  },
  // Before & After Insights (21-22)
  {
    id: 'scale-weight-before-after',
    title: 'Weight Before vs After',
    description: 'Per-session weight before/after comparison',
    component: WeightBeforeAfterWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 30,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#2563eb',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-body-fat-before-after',
    title: 'Body Fat % Before vs After',
    description: 'Per-session body fat percentage comparison',
    component: BodyFatBeforeAfterWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 29,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#dc2626',
      animation: 'fade-in'
    }
  },
  // Holistic Overview (23-25)
  {
    id: 'scale-health-score-over-time',
    title: 'Health Score Over Time',
    description: 'Overall health score progression with performance zones',
    component: HealthScoreOverTimeWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 28,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#8b5cf6',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-daily-health-snapshot',
    title: 'Daily Health Snapshot',
    description: 'Comprehensive overview of today\'s health metrics',
    component: DailyHealthSnapshotWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 27,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#8b5cf6',
      animation: 'fade-in'
    }
  },
  {
    id: 'scale-goal-progress',
    title: 'Goal Progress to Target Weight',
    description: 'Progress toward weight goal with timeline estimation',
    component: GoalProgressWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 1800000, // 30 minutes
    mockDataGenerator: () => ({}), // Real data from API
    category: 'scale',
    priority: 26,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#3b82f6',
      animation: 'fade-in'
    }
  }
]

/**
 * Get widget configuration by ID
 */
export const getWidgetConfig = (id: string): WidgetRegistryEntry | undefined => {
  return widgetRegistry.find(widget => widget.id === id)
}

/**
 * Get widgets by category
 */
export const getWidgetsByCategory = (category: string): WidgetRegistryEntry[] => {
  return widgetRegistry.filter(widget => widget.category === category && widget.isEnabled)
}

/**
 * Get enabled widgets sorted by priority
 */
export const getEnabledWidgets = (): WidgetRegistryEntry[] => {
  return widgetRegistry
    .filter(widget => widget.isEnabled)
    .sort((a, b) => b.priority - a.priority)
}

/**
 * Default dashboard layout optimized for vertical screens
 */
export const defaultDashboardLayout = {
  id: 'default-vertical',
  name: 'Default Vertical Layout',
  description: 'Optimized layout for portrait/vertical screens with CPAP and workout monitoring',
  columns: 2, // Start with 2 columns for most vertical screens
  isDefault: true,
  widgets: [
    // Health & Activity Widgets
    { id: 'steps-today', column: 1, row: 1, width: 1, height: 1 },
    { id: 'water-intake', column: 2, row: 1, width: 1, height: 1 },
    { id: 'calories-macros', column: 1, row: 2, width: 2, height: 1 },
    { id: 'heart-rate', column: 1, row: 3, width: 1, height: 1 },
    { id: 'weight-history', column: 1, row: 4, width: 2, height: 2 },

    // Workout Widgets - Issue #9
    { id: 'workout-summary', column: 1, row: 6, width: 2, height: 1 },
    { id: 'workout-heart-rate', column: 1, row: 7, width: 1, height: 1 },
    { id: 'workout-calories', column: 2, row: 7, width: 1, height: 1 },
    { id: 'workout-heart-rate-time', column: 1, row: 8, width: 2, height: 2 },
    { id: 'workout-zones', column: 1, row: 10, width: 2, height: 2 },
    { id: 'workout-fat-burn-ratio', column: 1, row: 12, width: 2, height: 1 },

    // CPAP Monitoring Widgets - Issue #7
    { id: 'cpap-spo2-trend', column: 1, row: 13, width: 2, height: 2 },
    { id: 'cpap-spo2-pulse', column: 1, row: 15, width: 2, height: 2 },
    { id: 'cpap-leak-rate', column: 1, row: 17, width: 2, height: 1 },
    { id: 'cpap-sleep-sessions', column: 1, row: 18, width: 2, height: 1 },
  ]
}
