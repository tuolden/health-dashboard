/**
 * GraphQL Resolvers - Issue #5 + #7
 * 
 * Main resolver functions for all widget queries, mutations, and subscriptions
 * Extended with CPAP data resolvers for Issue #7
 */

import { GraphQLScalarType, Kind } from 'graphql'
import { widgetRegistry } from '../widgetRegistry'
// Note: SUBSCRIPTION_EVENTS removed - using simple auto-refresh instead
import { generateStepsData, generateWaterIntakeData, generateWeightData, generateHeartRateData, generateNutritionData, generateSleepData, generateActivityData } from '../../utils/mockData'
import { CpapDao } from '../../database/cpapDao'
import { PolarDao } from '../../database/polarDao'
import { ScaleDao } from '../../database/scaleDao'
import { BloodworkDao } from '../../database/bloodworkDao'

// Initialize DAOs
const cpapDao = new CpapDao()
const polarDao = new PolarDao()
const scaleDao = new ScaleDao()
const bloodworkDao = new BloodworkDao()

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
  parseLiteral(ast: any) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value)
    }
    throw new Error('Can only parse strings to dates but got a: ' + ast.kind)
  }
})

// Query Resolvers
const Query = {
  // Widget Data Queries
  steps: async (_: any, args: any) => {
    try {
      console.log('📊 Fetching steps data...', args.timeRange ? 'with time range' : 'default range')
      return generateStepsData(args.timeRange)
    } catch (error) {
      console.error('❌ Error fetching steps data:', error)
      throw new Error('Failed to fetch steps data')
    }
  },

  waterIntake: async (_: any, args: any) => {
    try {
      console.log('💧 Fetching water intake data for:', args.date || 'today')
      return generateWaterIntakeData(args.date)
    } catch (error) {
      console.error('❌ Error fetching water intake data:', error)
      throw new Error('Failed to fetch water intake data')
    }
  },

  weightHistory: async (_: any, args: any) => {
    try {
      console.log('⚖️ Fetching weight history...', args.timeRange ? 'with time range' : 'default range')
      return generateWeightData(args.timeRange)
    } catch (error) {
      console.error('❌ Error fetching weight data:', error)
      throw new Error('Failed to fetch weight data')
    }
  },

  heartRate: async (_: any, args: any) => {
    try {
      console.log('❤️ Fetching heart rate data...', args.timeRange ? 'with time range' : 'default range')
      return generateHeartRateData(args.timeRange)
    } catch (error) {
      console.error('❌ Error fetching heart rate data:', error)
      throw new Error('Failed to fetch heart rate data')
    }
  },

  nutrition: async (_: any, args: any) => {
    try {
      console.log('🍎 Fetching nutrition data for:', args.date || 'today')
      return generateNutritionData(args.date)
    } catch (error) {
      console.error('❌ Error fetching nutrition data:', error)
      throw new Error('Failed to fetch nutrition data')
    }
  },

  sleep: async (_: any, args: any) => {
    try {
      console.log('😴 Fetching sleep data...', args.timeRange ? 'with time range' : 'default range')
      return generateSleepData(args.timeRange)
    } catch (error) {
      console.error('❌ Error fetching sleep data:', error)
      throw new Error('Failed to fetch sleep data')
    }
  },

  activity: async (_: any, args: any) => {
    try {
      console.log('🏃 Fetching activity data for:', args.date || 'today')
      return generateActivityData(args.date)
    } catch (error) {
      console.error('❌ Error fetching activity data:', error)
      throw new Error('Failed to fetch activity data')
    }
  },

  // CPAP Data Queries - Issue #7
  getCPAPMetricsRange: async (_: any, args: { start: string, end: string }) => {
    try {
      console.log('🫁 Fetching CPAP metrics range:', args.start, 'to', args.end)
      return await cpapDao.getCpapMetricsRange(args.start, args.end)
    } catch (error) {
      console.error('❌ Error fetching CPAP metrics range:', error)
      throw new Error('Failed to fetch CPAP metrics range')
    }
  },

  getCPAPSpo2Trend: async (_: any, args: { start: string, end: string }) => {
    try {
      console.log('📈 Fetching CPAP SpO2 trend:', args.start, 'to', args.end)
      return await cpapDao.getSpo2TrendData(args.start, args.end)
    } catch (error) {
      console.error('❌ Error fetching CPAP SpO2 trend:', error)
      throw new Error('Failed to fetch CPAP SpO2 trend')
    }
  },

  getCPAPSpo2Pulse: async (_: any, args: { start: string, end: string }) => {
    try {
      console.log('💓 Fetching CPAP SpO2/Pulse data:', args.start, 'to', args.end)
      return await cpapDao.getSpo2PulseData(args.start, args.end)
    } catch (error) {
      console.error('❌ Error fetching CPAP SpO2/Pulse data:', error)
      throw new Error('Failed to fetch CPAP SpO2/Pulse data')
    }
  },

  getCPAPLeakRate: async (_: any, args: { start: string, end: string }) => {
    try {
      console.log('💨 Fetching CPAP leak rate data:', args.start, 'to', args.end)
      return await cpapDao.getLeakRateData(args.start, args.end)
    } catch (error) {
      console.error('❌ Error fetching CPAP leak rate data:', error)
      throw new Error('Failed to fetch CPAP leak rate data')
    }
  },

  getCPAPSleepSessions: async (_: any, args: { start: string, end: string }) => {
    try {
      console.log('😴 Fetching CPAP sleep sessions:', args.start, 'to', args.end)
      return await cpapDao.getSleepSessionData(args.start, args.end)
    } catch (error) {
      console.error('❌ Error fetching CPAP sleep sessions:', error)
      throw new Error('Failed to fetch CPAP sleep sessions')
    }
  },

  // Workout Data Queries - Issue #9
  getWorkoutSessions: async (_: any, args: { start: string, end: string }) => {
    try {
      console.log('🏃 Fetching workout sessions:', args.start, 'to', args.end)
      return await polarDao.detectWorkoutSessions({
        startDate: args.start,
        endDate: args.end
      })
    } catch (error) {
      console.error('❌ Error fetching workout sessions:', error)
      throw new Error('Failed to fetch workout sessions')
    }
  },

  getWeeklyZoneBreakdown: async (_: any, args: { weekStart: string }) => {
    try {
      console.log('📊 Fetching weekly zone breakdown for week starting:', args.weekStart)

      // Calculate week end date (7 days from start)
      const startDate = new Date(args.weekStart)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)

      const sessions = await polarDao.detectWorkoutSessions({
        startDate: args.weekStart,
        endDate: endDate.toISOString().split('T')[0]!
      })

      // Aggregate zones across all sessions in the week
      const weeklyZones = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 }
      sessions.forEach(session => {
        Object.keys(weeklyZones).forEach(zone => {
          weeklyZones[zone as keyof typeof weeklyZones] += session.zones[zone as keyof typeof session.zones]
        })
      })

      return weeklyZones
    } catch (error) {
      console.error('❌ Error fetching weekly zone breakdown:', error)
      throw new Error('Failed to fetch weekly zone breakdown')
    }
  },

  getTrainingLoadTrend: async (_: any, args: { days: number }) => {
    try {
      console.log('📈 Fetching training load trend for', args.days, 'days')

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - args.days)

      const sessions = await polarDao.detectWorkoutSessions({
        startDate: startDate.toISOString().split('T')[0]!,
        endDate: endDate.toISOString().split('T')[0]!
      })

      // Group sessions by date and calculate daily TRIMP scores
      const dailyScores: Record<string, number> = {}
      sessions.forEach(session => {
        const date = session.session_start.split('T')[0]!
        if (!dailyScores[date]) {
          dailyScores[date] = 0
        }
        dailyScores[date] += session.trimp_score || 0
      })

      // Convert to array format
      return Object.entries(dailyScores).map(([date, trimp_score]) => ({
        date,
        trimp_score
      })).sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('❌ Error fetching training load trend:', error)
      throw new Error('Failed to fetch training load trend')
    }
  },

  // HUME Scale Data Queries - Issue #11
  getWeightSessions: async (_: any, args: { start: string, end: string }) => {
    try {
      console.log('⚖️ Fetching weight sessions:', args.start, 'to', args.end)
      return await scaleDao.getWeightSessions({
        startDate: args.start,
        endDate: args.end
      })
    } catch (error) {
      console.error('❌ Error fetching weight sessions:', error)
      throw new Error('Failed to fetch weight sessions')
    }
  },

  getWeightDelta: async (_: any, args: { days: number }) => {
    try {
      console.log('📊 Fetching weight delta for', args.days, 'days')
      return await scaleDao.getWeightDelta(args.days)
    } catch (error) {
      console.error('❌ Error fetching weight delta:', error)
      throw new Error('Failed to fetch weight delta')
    }
  },

  getHealthScoreTrend: async (_: any, args: { start: string, end: string }) => {
    try {
      console.log('📈 Fetching health score trend:', args.start, 'to', args.end)
      const sessions = await scaleDao.getWeightSessions({
        startDate: args.start,
        endDate: args.end
      })

      // Convert to health score points
      return sessions
        .filter(session => session.health_score !== null && session.health_score !== undefined)
        .map(session => ({
          date: session.date,
          health_score: session.health_score
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('❌ Error fetching health score trend:', error)
      throw new Error('Failed to fetch health score trend')
    }
  },

  getLatestHealthSnapshot: async () => {
    try {
      console.log('📸 Fetching latest health snapshot')
      return await scaleDao.getLatestHealthSnapshot()
    } catch (error) {
      console.error('❌ Error fetching latest health snapshot:', error)
      throw new Error('Failed to fetch latest health snapshot')
    }
  },

  // Bloodwork Lab Data Queries - Issue #13
  getLabResults: async (_: any, args: any) => {
    try {
      console.log('🧬 Fetching lab results:', args)
      return await bloodworkDao.getLabResults(args)
    } catch (error) {
      console.error('❌ Error fetching lab results:', error)
      throw new Error('Failed to fetch lab results')
    }
  },

  getEnhancedLabResults: async (_: any, args: any) => {
    try {
      console.log('🧬 Fetching enhanced lab results:', args)
      return await bloodworkDao.getEnhancedLabResults(args)
    } catch (error) {
      console.error('❌ Error fetching enhanced lab results:', error)
      throw new Error('Failed to fetch enhanced lab results')
    }
  },

  getLabSummary: async (_: any, args: { collectedOn: string }) => {
    try {
      console.log('🧬 Fetching lab summary for:', args.collectedOn)
      return await bloodworkDao.getLabSummary(args.collectedOn)
    } catch (error) {
      console.error('❌ Error fetching lab summary:', error)
      throw new Error('Failed to fetch lab summary')
    }
  },

  getLabTrend: async (_: any, args: { testName: string, days?: number }) => {
    try {
      console.log('🧬 Fetching lab trend for:', args.testName, 'days:', args.days)
      return await bloodworkDao.getLabTrend(args.testName, args.days)
    } catch (error) {
      console.error('❌ Error fetching lab trend:', error)
      throw new Error('Failed to fetch lab trend')
    }
  },

  getLatestLabResults: async () => {
    try {
      console.log('🧬 Fetching latest lab results')
      return await bloodworkDao.getLatestLabResults()
    } catch (error) {
      console.error('❌ Error fetching latest lab results:', error)
      throw new Error('Failed to fetch latest lab results')
    }
  },

  getLabMetrics: async (_: any, args: { testNames?: string[] }) => {
    try {
      console.log('🧬 Fetching lab metrics:', args.testNames)
      return await bloodworkDao.getLabMetrics(args.testNames)
    } catch (error) {
      console.error('❌ Error fetching lab metrics:', error)
      throw new Error('Failed to fetch lab metrics')
    }
  },

  getAvailableLabDates: async () => {
    try {
      console.log('🧬 Fetching available lab dates')
      return await bloodworkDao.getAvailableDates()
    } catch (error) {
      console.error('❌ Error fetching available lab dates:', error)
      throw new Error('Failed to fetch available lab dates')
    }
  },

  // System Queries
  health: () => {
    return 'GraphQL Health Dashboard API with CPAP, Workout, Scale, and Bloodwork support is running! 🚀🫁⚖️🧬'
  },

  widgetRegistry: () => {
    console.log('📋 Fetching widget registry...')
    return widgetRegistry.getFullRegistry()
  }
}

// Mutation Resolvers
const Mutation = {
  refreshWidget: async (_: any, args: any, _context: any) => {
    try {
      console.log(`🔄 Refreshing widget: ${args.widgetType}`)
      
      // Simulate widget refresh
      const datasetName = widgetRegistry.getDatasetByWidget(args.widgetType)
      if (!datasetName) {
        throw new Error(`Unknown widget type: ${args.widgetType}`)
      }

      // Update timestamp in registry
      widgetRegistry.updateDatasetTimestamp(datasetName)

      // Note: Real-time updates removed - using simple auto-refresh instead

      console.log(`✅ Widget ${args.widgetType} refreshed successfully`)
      return true
    } catch (error) {
      console.error(`❌ Error refreshing widget ${args.widgetType}:`, error)
      throw new Error(`Failed to refresh widget: ${args.widgetType}`)
    }
  },

  // CPAP Data Mutations - Issue #7
  refreshCPAPData: async (_: any, _args: any, _context: any) => {
    try {
      console.log('🔄 Refreshing CPAP data...')

      // Note: Real-time updates removed - using simple auto-refresh instead

      console.log('✅ CPAP data refreshed successfully')
      return true
    } catch (error) {
      console.error('❌ Error refreshing CPAP data:', error)
      throw new Error('Failed to refresh CPAP data')
    }
  }
}

// Note: Subscription resolvers removed - using simple auto-refresh instead

// Export all resolvers
export const resolvers = {
  DateTime: DateTimeScalar,
  Query,
  Mutation
}
