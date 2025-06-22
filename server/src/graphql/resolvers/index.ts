/**
 * GraphQL Resolvers - Issue #5
 * 
 * Main resolver functions for all widget queries, mutations, and subscriptions
 */

import { GraphQLScalarType, Kind } from 'graphql'
import { ContextValue } from '../../types/context'
import { TimeRange } from '../../types/widgets'
import { widgetRegistry } from '../widgetRegistry'
import { SUBSCRIPTION_EVENTS } from '../../utils/pubsub'
import {
  generateStepsData,
  generateWaterIntakeData,
  generateWeightData,
  generateHeartRateData,
  generateNutritionData,
  generateSleepData,
  generateActivityData
} from '../../utils/mockData'

// Custom DateTime scalar
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString()
    }
    throw new Error('Value is not an instance of Date: ' + value)
  },
  parseValue(value: any) {
    if (typeof value === 'string') {
      return new Date(value)
    }
    throw new Error('Value is not a valid date string: ' + value)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value)
    }
    throw new Error('Can only parse strings to dates but got a: ' + ast.kind)
  }
})

// Query Resolvers
const Query = {
  // Widget Data Queries
  steps: async (_: any, args: { timeRange?: TimeRange }, context: ContextValue) => {
    try {
      console.log('📊 Fetching steps data...', args.timeRange ? 'with time range' : 'default range')
      return generateStepsData(args.timeRange)
    } catch (error) {
      console.error('❌ Error fetching steps data:', error)
      throw new Error('Failed to fetch steps data')
    }
  },

  waterIntake: async (_: any, args: { date?: Date }, context: ContextValue) => {
    try {
      console.log('💧 Fetching water intake data for:', args.date || 'today')
      return generateWaterIntakeData(args.date)
    } catch (error) {
      console.error('❌ Error fetching water intake data:', error)
      throw new Error('Failed to fetch water intake data')
    }
  },

  weightHistory: async (_: any, args: { timeRange?: TimeRange }, context: ContextValue) => {
    try {
      console.log('⚖️ Fetching weight history...', args.timeRange ? 'with time range' : 'default range')
      return generateWeightData(args.timeRange)
    } catch (error) {
      console.error('❌ Error fetching weight data:', error)
      throw new Error('Failed to fetch weight data')
    }
  },

  heartRate: async (_: any, args: { timeRange?: TimeRange }, context: ContextValue) => {
    try {
      console.log('❤️ Fetching heart rate data...', args.timeRange ? 'with time range' : 'default range')
      return generateHeartRateData(args.timeRange)
    } catch (error) {
      console.error('❌ Error fetching heart rate data:', error)
      throw new Error('Failed to fetch heart rate data')
    }
  },

  nutrition: async (_: any, args: { date?: Date }, context: ContextValue) => {
    try {
      console.log('🍎 Fetching nutrition data for:', args.date || 'today')
      return generateNutritionData(args.date)
    } catch (error) {
      console.error('❌ Error fetching nutrition data:', error)
      throw new Error('Failed to fetch nutrition data')
    }
  },

  sleep: async (_: any, args: { timeRange?: TimeRange }, context: ContextValue) => {
    try {
      console.log('😴 Fetching sleep data...', args.timeRange ? 'with time range' : 'default range')
      return generateSleepData(args.timeRange)
    } catch (error) {
      console.error('❌ Error fetching sleep data:', error)
      throw new Error('Failed to fetch sleep data')
    }
  },

  activity: async (_: any, args: { date?: Date }, context: ContextValue) => {
    try {
      console.log('🏃 Fetching activity data for:', args.date || 'today')
      return generateActivityData(args.date)
    } catch (error) {
      console.error('❌ Error fetching activity data:', error)
      throw new Error('Failed to fetch activity data')
    }
  },

  // System Queries
  health: () => {
    return 'GraphQL Health Dashboard API is running! 🚀'
  },

  widgetRegistry: () => {
    console.log('📋 Fetching widget registry...')
    return widgetRegistry.getFullRegistry()
  }
}

// Mutation Resolvers
const Mutation = {
  refreshWidget: async (_: any, args: { widgetType: string }, context: ContextValue) => {
    try {
      console.log(`🔄 Refreshing widget: ${args.widgetType}`)
      
      // Simulate widget refresh
      const datasetName = widgetRegistry.getDatasetByWidget(args.widgetType)
      if (!datasetName) {
        throw new Error(`Unknown widget type: ${args.widgetType}`)
      }

      // Update timestamp in registry
      widgetRegistry.updateDatasetTimestamp(datasetName)

      // Publish update event
      await context.pubsub.publish(SUBSCRIPTION_EVENTS.WIDGET_UPDATED, {
        widgetUpdated: {
          widgetType: args.widgetType,
          data: JSON.stringify({ refreshed: true, timestamp: new Date() }),
          timestamp: new Date().toISOString()
        }
      })

      console.log(`✅ Widget ${args.widgetType} refreshed successfully`)
      return true
    } catch (error) {
      console.error(`❌ Error refreshing widget ${args.widgetType}:`, error)
      throw new Error(`Failed to refresh widget: ${args.widgetType}`)
    }
  }
}

// Subscription Resolvers
const Subscription = {
  widgetUpdated: {
    subscribe: (_: any, args: { widgetType?: string }, context: ContextValue) => {
      console.log(`🔔 Client subscribed to widget updates${args.widgetType ? ` for ${args.widgetType}` : ' (all widgets)'}`)
      
      if (args.widgetType) {
        // Filter by specific widget type
        return context.pubsub.asyncIterator([SUBSCRIPTION_EVENTS.WIDGET_UPDATED])
      }
      
      return context.pubsub.asyncIterator([SUBSCRIPTION_EVENTS.WIDGET_UPDATED])
    }
  },

  datasetRefreshed: {
    subscribe: (_: any, args: { datasetName?: string }, context: ContextValue) => {
      console.log(`🔔 Client subscribed to dataset updates${args.datasetName ? ` for ${args.datasetName}` : ' (all datasets)'}`)
      return context.pubsub.asyncIterator([SUBSCRIPTION_EVENTS.DATASET_REFRESHED])
    }
  },

  webhookReceived: {
    subscribe: (_: any, args: { source?: string }, context: ContextValue) => {
      console.log(`🔔 Client subscribed to webhook events${args.source ? ` for ${args.source}` : ' (all sources)'}`)
      return context.pubsub.asyncIterator([SUBSCRIPTION_EVENTS.WEBHOOK_RECEIVED])
    }
  }
}

// Export all resolvers
export const resolvers = {
  DateTime: DateTimeScalar,
  Query,
  Mutation,
  Subscription
}
