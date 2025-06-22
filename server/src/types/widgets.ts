/**
 * Widget Data Types - Issue #5
 * 
 * TypeScript interfaces matching GraphQL schema for type safety
 */

// Common types
export interface TimeRange {
  start: Date
  end: Date
}

export interface IntRange {
  min: number
  max: number
}

// Steps Widget Types
export interface StepData {
  id: string
  date: Date
  steps: number
  goal: number
  distance?: number
  calories?: number
}

export interface StepsHistory {
  current: StepData
  history: StepData[]
  weeklyAverage: number
  monthlyTotal: number
}

// Water Intake Widget Types
export interface WaterIntakeEntry {
  id: string
  timestamp: Date
  amount: number
  unit: string
}

export interface WaterIntakeData {
  date: Date
  entries: WaterIntakeEntry[]
  totalAmount: number
  goal: number
  percentage: number
}

// Weight Widget Types
export interface WeightEntry {
  id: string
  date: Date
  weight: number
  unit: string
  bodyFat?: number
  muscleMass?: number
}

export interface WeightHistory {
  current: WeightEntry
  history: WeightEntry[]
  trend: 'increasing' | 'decreasing' | 'stable'
  weeklyChange: number
  monthlyChange: number
}

// Heart Rate Widget Types
export interface HeartRateReading {
  id: string
  timestamp: Date
  bpm: number
  type: 'resting' | 'active' | 'recovery'
}

export interface HeartRateZones {
  zone1: IntRange // Recovery
  zone2: IntRange // Aerobic
  zone3: IntRange // Anaerobic
  zone4: IntRange // VO2 Max
  zone5: IntRange // Neuromuscular
}

export interface HeartRateData {
  current: HeartRateReading
  resting: number
  maximum: number
  zones: HeartRateZones
  history: HeartRateReading[]
}

// Nutrition Widget Types
export interface NutritionEntry {
  id: string
  timestamp: Date
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
}

export interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface NutritionData {
  date: Date
  entries: NutritionEntry[]
  totals: NutritionEntry
  goals: NutritionGoals
  score: number // 0-100 nutrition quality score
}

// Sleep Widget Types
export interface SleepData {
  id: string
  date: Date
  bedtime: Date
  wakeTime: Date
  duration: number // hours
  quality: number // 0-100 score
  deepSleep?: number // hours
  remSleep?: number // hours
  lightSleep?: number // hours
}

export interface SleepHistory {
  current: SleepData
  history: SleepData[]
  averageDuration: number
  averageQuality: number
  weeklyPattern: number[] // 7 days of sleep duration
}

// Activity Widget Types
export interface WorkoutSession {
  id: string
  type: string
  duration: number // minutes
  intensity: 'low' | 'moderate' | 'high'
  caloriesBurned: number
  startTime: Date
}

export interface ActivityData {
  id: string
  date: Date
  activeMinutes: number
  sedentaryMinutes: number
  workouts: WorkoutSession[]
  caloriesBurned: number
}

// Widget Registry Types
export interface WidgetRegistryEntry {
  widgetType: string
  datasetName: string
  lastUpdated?: Date
  isActive: boolean
}

// Subscription Event Types
export interface WidgetUpdate {
  widgetType: string
  data: any
  timestamp: Date
}

export interface DatasetRefresh {
  datasetName: string
  affectedWidgets: string[]
  timestamp: Date
}

export interface WebhookEvent {
  source: string
  payload: any
  timestamp: Date
}
