/**
 * GraphQL Schema Definition - Issue #5 + #7
 * 
 * Complete GraphQL schema for Health Dashboard widgets with subscriptions
 * Extended with CPAP metrics support for Issue #7
 */

import { gql } from 'apollo-server-express'

export const typeDefs = gql`
  # Scalar types
  scalar DateTime

  # Common types
  type TimeRange {
    start: DateTime!
    end: DateTime!
  }

  # Input types for queries
  input TimeRangeInput {
    start: DateTime!
    end: DateTime!
  }

  # CPAP Types - Issue #7
  type CPAPMetrics {
    date: String!
    spo2_avg: Float
    pulse_rate_avg: Float
    leak_rate_avg: Float
    session_start: String!
  }

  type CPAPSpo2Trend {
    date: String!
    spo2_avg: Float
    isHealthy: Boolean!
    qualityRating: String! # "excellent", "good", "concerning", "critical"
  }

  type CPAPSpo2Pulse {
    date: String!
    spo2_avg: Float
    pulse_rate_avg: Float
    correlation: String! # "normal", "concerning", "critical"
  }

  type CPAPLeakRate {
    date: String!
    leak_rate_avg: Float
    isWithinThreshold: Boolean!
    severity: String! # "excellent", "good", "concerning", "critical"
  }

  type CPAPSleepSession {
    date: String!
    session_start: String!
    bedtime_hour: Int!
    sleep_pattern: String! # "early", "normal", "late", "irregular"
  }

  # Steps Widget Types
  type StepData {
    id: ID!
    date: DateTime!
    steps: Int!
    goal: Int!
    distance: Float
    calories: Int
  }

  type StepsHistory {
    current: StepData!
    history: [StepData!]!
    weeklyAverage: Float!
    monthlyTotal: Int!
  }

  # Water Intake Widget Types
  type WaterIntakeEntry {
    id: ID!
    timestamp: DateTime!
    amount: Float!
    unit: String!
  }

  type WaterIntakeData {
    date: DateTime!
    entries: [WaterIntakeEntry!]!
    totalAmount: Float!
    goal: Float!
    percentage: Float!
  }

  # Weight Widget Types
  type WeightEntry {
    id: ID!
    date: DateTime!
    weight: Float!
    unit: String!
    bodyFat: Float
    muscleMass: Float
  }

  type WeightHistory {
    current: WeightEntry!
    history: [WeightEntry!]!
    trend: String! # "increasing", "decreasing", "stable"
    weeklyChange: Float!
    monthlyChange: Float!
  }

  # Heart Rate Widget Types
  type HeartRateReading {
    id: ID!
    timestamp: DateTime!
    bpm: Int!
    type: String! # "resting", "active", "recovery"
  }

  type HeartRateData {
    current: HeartRateReading!
    resting: Int!
    maximum: Int!
    zones: HeartRateZones!
    history: [HeartRateReading!]!
  }

  type HeartRateZones {
    zone1: IntRange! # Recovery
    zone2: IntRange! # Aerobic
    zone3: IntRange! # Anaerobic
    zone4: IntRange! # VO2 Max
    zone5: IntRange! # Neuromuscular
  }

  type IntRange {
    min: Int!
    max: Int!
  }

  # Nutrition Widget Types
  type NutritionEntry {
    id: ID!
    timestamp: DateTime!
    calories: Int!
    protein: Float!
    carbs: Float!
    fat: Float!
    fiber: Float
    sugar: Float
  }

  type NutritionData {
    date: DateTime!
    entries: [NutritionEntry!]!
    totals: NutritionEntry!
    goals: NutritionGoals!
    score: Int! # 0-100 nutrition quality score
  }

  type NutritionGoals {
    calories: Int!
    protein: Float!
    carbs: Float!
    fat: Float!
  }

  # Sleep Widget Types
  type SleepData {
    id: ID!
    date: DateTime!
    bedtime: DateTime!
    wakeTime: DateTime!
    duration: Float! # hours
    quality: Int! # 0-100 score
    deepSleep: Float # hours
    remSleep: Float # hours
    lightSleep: Float # hours
  }

  type SleepHistory {
    current: SleepData!
    history: [SleepData!]!
    averageDuration: Float!
    averageQuality: Float!
    weeklyPattern: [Float!]! # 7 days of sleep duration
  }

  # Activity Widget Types
  type ActivityData {
    id: ID!
    date: DateTime!
    activeMinutes: Int!
    sedentaryMinutes: Int!
    workouts: [WorkoutSession!]!
    caloriesBurned: Int!
  }

  type WorkoutSession {
    id: ID!
    type: String!
    duration: Int! # minutes
    intensity: String! # "low", "moderate", "high"
    caloriesBurned: Int!
    startTime: DateTime!
  }

  # Subscription Types
  type WidgetUpdate {
    widgetType: String!
    data: String! # JSON stringified data
    timestamp: DateTime!
  }

  type DatasetRefresh {
    datasetName: String!
    affectedWidgets: [String!]!
    timestamp: DateTime!
  }

  type WebhookEvent {
    source: String!
    payload: String! # JSON stringified payload
    timestamp: DateTime!
  }

  # Root Query Type
  type Query {
    # Widget Data Queries
    steps(timeRange: TimeRangeInput): StepsHistory!
    waterIntake(date: DateTime): WaterIntakeData!
    weightHistory(timeRange: TimeRangeInput): WeightHistory!
    heartRate(timeRange: TimeRangeInput): HeartRateData!
    nutrition(date: DateTime): NutritionData!
    sleep(timeRange: TimeRangeInput): SleepHistory!
    activity(date: DateTime): ActivityData!
    
    # CPAP Data Queries - Issue #7
    getCPAPMetricsRange(start: String!, end: String!): [CPAPMetrics!]!
    getCPAPSpo2Trend(start: String!, end: String!): [CPAPSpo2Trend!]!
    getCPAPSpo2Pulse(start: String!, end: String!): [CPAPSpo2Pulse!]!
    getCPAPLeakRate(start: String!, end: String!): [CPAPLeakRate!]!
    getCPAPSleepSessions(start: String!, end: String!): [CPAPSleepSession!]!
    
    # System Queries
    health: String!
    widgetRegistry: [WidgetRegistryEntry!]!
  }

  # Widget Registry Type
  type WidgetRegistryEntry {
    widgetType: String!
    datasetName: String!
    lastUpdated: DateTime
    isActive: Boolean!
  }

  # Root Subscription Type
  type Subscription {
    widgetUpdated(widgetType: String): WidgetUpdate!
    datasetRefreshed(datasetName: String): DatasetRefresh!
    webhookReceived(source: String): WebhookEvent!
    
    # CPAP Data Subscriptions - Issue #7
    cpapDataUpdated(metricType: String): WidgetUpdate!
  }

  # Mutation Type (for future extensibility)
  type Mutation {
    # Placeholder for future mutations
    refreshWidget(widgetType: String!): Boolean!
    
    # CPAP Data Mutations - Issue #7
    refreshCPAPData: Boolean!
  }
`
