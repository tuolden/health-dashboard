"use strict";
/**
 * GraphQL Schema Definition - Issue #5 + #7
 *
 * Complete GraphQL schema for Health Dashboard widgets with subscriptions
 * Extended with CPAP metrics support for Issue #7
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const apollo_server_express_1 = require("apollo-server-express");
exports.typeDefs = (0, apollo_server_express_1.gql) `
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

  # Workout Session Types - Issue #9
  type WorkoutSession {
    sport: String!
    session_start: String!
    session_end: String!
    duration_min: Int!
    avg_heart_rate: Float
    calories_burned: Float
    zones: ZoneBreakdown!
    recovery_drop_bpm: Float
    intensity_score: Int
    trimp_score: Float
    fat_burn_ratio: Float
    cardio_ratio: Float
    bpm_std_dev: Float
    warmup_duration_sec: Int
  }

  type ZoneBreakdown {
    Z1: Int!
    Z2: Int!
    Z3: Int!
    Z4: Int!
    Z5: Int!
  }

  type IntensityScorePoint {
    date: String!
    trimp_score: Float!
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

  # HUME Scale Types - Issue #11
  type WeightSession {
    date: String!
    health_score: Float
    weight_after: Float
    body_fat_percentage_after: Float
    body_fat_mass_after: Float
    lean_mass_after: Float
    skeletal_muscle_mass_after: Float
    skeletal_mass_after: Float
    body_water_after: Float
    bmr_after: Float
    metabolic_age_after: Int
    resting_heart_rate_after: Int
    body_cell_mass_after: Float
    subcutaneous_fat_mass_after: Float
    visceral_fat_index_after: Float
  }

  type WeightTrend {
    metric: String!
    current_value: Float
    previous_value: Float
    change_amount: Float
    change_percentage: Float
    trend_direction: String! # "increasing", "decreasing", "stable"
    days_analyzed: Int!
  }

  type HealthSnapshot {
    date: String!
    weight: Float
    body_fat_percentage: Float
    skeletal_muscle_mass: Float
    body_water: Float
    bmr: Float
    resting_heart_rate: Int
    metabolic_age: Int
    health_score: Float
  }

  type HealthScorePoint {
    date: String!
    health_score: Float!
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

    # Workout Data Queries - Issue #9
    getWorkoutSessions(start: String!, end: String!): [WorkoutSession!]!
    getWeeklyZoneBreakdown(weekStart: String!): ZoneBreakdown!
    getTrainingLoadTrend(days: Int!): [IntensityScorePoint!]!

    # HUME Scale Data Queries - Issue #11
    getWeightSessions(start: String!, end: String!): [WeightSession!]!
    getWeightDelta(days: Int!): WeightTrend
    getHealthScoreTrend(start: String!, end: String!): [HealthScorePoint!]!
    getLatestHealthSnapshot: HealthSnapshot

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
`;
//# sourceMappingURL=index.js.map