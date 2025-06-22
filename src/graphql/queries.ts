/**
 * GraphQL Queries and Subscriptions - Issue #5
 * 
 * All GraphQL operations for fetching widget data and subscribing to real-time updates
 */

import { gql } from '@apollo/client'

// Widget Data Queries
export const GET_STEPS_DATA = gql`
  query GetStepsData($timeRange: TimeRangeInput) {
    steps(timeRange: $timeRange) {
      current {
        id
        date
        steps
        goal
        distance
        calories
      }
      history {
        id
        date
        steps
        goal
        distance
        calories
      }
      weeklyAverage
      monthlyTotal
    }
  }
`

export const GET_WATER_INTAKE_DATA = gql`
  query GetWaterIntakeData($date: DateTime) {
    waterIntake(date: $date) {
      date
      entries {
        id
        timestamp
        amount
        unit
      }
      totalAmount
      goal
      percentage
    }
  }
`

export const GET_WEIGHT_HISTORY = gql`
  query GetWeightHistory($timeRange: TimeRangeInput) {
    weightHistory(timeRange: $timeRange) {
      current {
        id
        date
        weight
        unit
        bodyFat
        muscleMass
      }
      history {
        id
        date
        weight
        unit
        bodyFat
        muscleMass
      }
      trend
      weeklyChange
      monthlyChange
    }
  }
`

export const GET_HEART_RATE_DATA = gql`
  query GetHeartRateData($timeRange: TimeRangeInput) {
    heartRate(timeRange: $timeRange) {
      current {
        id
        timestamp
        bpm
        type
      }
      resting
      maximum
      zones {
        zone1 { min max }
        zone2 { min max }
        zone3 { min max }
        zone4 { min max }
        zone5 { min max }
      }
      history {
        id
        timestamp
        bpm
        type
      }
    }
  }
`

export const GET_NUTRITION_DATA = gql`
  query GetNutritionData($date: DateTime) {
    nutrition(date: $date) {
      date
      entries {
        id
        timestamp
        calories
        protein
        carbs
        fat
        fiber
        sugar
      }
      totals {
        id
        timestamp
        calories
        protein
        carbs
        fat
        fiber
        sugar
      }
      goals {
        calories
        protein
        carbs
        fat
      }
      score
    }
  }
`

export const GET_SLEEP_DATA = gql`
  query GetSleepData($timeRange: TimeRangeInput) {
    sleep(timeRange: $timeRange) {
      current {
        id
        date
        bedtime
        wakeTime
        duration
        quality
        deepSleep
        remSleep
        lightSleep
      }
      history {
        id
        date
        bedtime
        wakeTime
        duration
        quality
        deepSleep
        remSleep
        lightSleep
      }
      averageDuration
      averageQuality
      weeklyPattern
    }
  }
`

export const GET_ACTIVITY_DATA = gql`
  query GetActivityData($date: DateTime) {
    activity(date: $date) {
      id
      date
      activeMinutes
      sedentaryMinutes
      workouts {
        id
        type
        duration
        intensity
        caloriesBurned
        startTime
      }
      caloriesBurned
    }
  }
`

// System Queries
export const GET_WIDGET_REGISTRY = gql`
  query GetWidgetRegistry {
    widgetRegistry {
      widgetType
      datasetName
      lastUpdated
      isActive
    }
  }
`

export const GET_HEALTH_CHECK = gql`
  query GetHealthCheck {
    health
  }
`

// Mutations
export const REFRESH_WIDGET = gql`
  mutation RefreshWidget($widgetType: String!) {
    refreshWidget(widgetType: $widgetType)
  }
`

// Subscriptions for Real-time Updates
export const WIDGET_UPDATED_SUBSCRIPTION = gql`
  subscription WidgetUpdated($widgetType: String) {
    widgetUpdated(widgetType: $widgetType) {
      widgetType
      data
      timestamp
    }
  }
`

export const DATASET_REFRESHED_SUBSCRIPTION = gql`
  subscription DatasetRefreshed($datasetName: String) {
    datasetRefreshed(datasetName: $datasetName) {
      datasetName
      affectedWidgets
      timestamp
    }
  }
`

export const WEBHOOK_RECEIVED_SUBSCRIPTION = gql`
  subscription WebhookReceived($source: String) {
    webhookReceived(source: $source) {
      source
      payload
      timestamp
    }
  }
`

// Combined subscription for all widget updates
export const ALL_WIDGET_UPDATES_SUBSCRIPTION = gql`
  subscription AllWidgetUpdates {
    widgetUpdated {
      widgetType
      data
      timestamp
    }
  }
`
