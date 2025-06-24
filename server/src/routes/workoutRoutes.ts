/**
 * Workout REST API Routes - Issue #9
 * 
 * REST endpoints for workout session data from polar_metrics table
 */

import { Router, Request, Response } from 'express'
import { PolarDao } from '../database/polarDao'
import { PolarQueryFilters, PolarDataError } from '../types/polar'
import { cpapPool } from '../database/cpapDatabase'

const router = Router()
const polarDao = new PolarDao()

/**
 * GET /api/workouts/health
 * Returns database health and polar_metrics table statistics
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const client = await cpapPool.connect()
    
    // Test polar_metrics table access
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT sport) as unique_sports,
        MIN(recorded_time_utc) as earliest_record,
        MAX(recorded_time_utc) as latest_record,
        COUNT(*) FILTER (WHERE heart_rate IS NOT NULL) as heart_rate_records,
        AVG(heart_rate) FILTER (WHERE heart_rate > 0) as avg_heart_rate,
        COUNT(DISTINCT DATE(recorded_time_utc)) as unique_days
      FROM polar_metrics
    `)
    
    // Get sport breakdown
    const sportsResult = await client.query(`
      SELECT 
        sport,
        COUNT(*) as record_count,
        AVG(heart_rate) FILTER (WHERE heart_rate > 0) as avg_heart_rate
      FROM polar_metrics
      WHERE sport IS NOT NULL
      GROUP BY sport
      ORDER BY record_count DESC
      LIMIT 10
    `)
    
    client.release()
    
    const stats = statsResult.rows[0]
    const sports = sportsResult.rows
    
    res.json({
      success: true,
      database: 'health_ingest',
      table: 'polar_metrics',
      status: 'connected',
      statistics: {
        total_records: parseInt(stats.total_records),
        heart_rate_records: parseInt(stats.heart_rate_records),
        unique_sports: parseInt(stats.unique_sports),
        unique_days: parseInt(stats.unique_days),
        date_range: {
          earliest: stats.earliest_record,
          latest: stats.latest_record
        },
        avg_heart_rate: stats.avg_heart_rate ? Math.round(stats.avg_heart_rate) : null
      },
      sports_breakdown: sports.map(sport => ({
        sport: sport.sport,
        record_count: parseInt(sport.record_count),
        avg_heart_rate: sport.avg_heart_rate ? Math.round(sport.avg_heart_rate) : null
      })),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Workout health check error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to connect to polar_metrics table' }
    })
  }
})

/**
 * GET /api/workouts/summary
 * Returns workout session summaries with comprehensive metrics
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query['startDate'] as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
    const endDate = (req.query['endDate'] as string) || new Date().toISOString().split('T')[0]!
    const sport = req.query['sport'] as string
    const limitParam = req.query['limit'] ? parseInt(req.query['limit'] as string) : undefined

    const filters: PolarQueryFilters = {
      startDate,
      endDate,
      sport,
      ...(limitParam && { limit: limitParam })
    }

    const workoutSummaries = await polarDao.getWorkoutSummary(filters)
    
    res.json({
      success: true,
      data: workoutSummaries,
      meta: {
        count: workoutSummaries.length,
        dateRange: { startDate, endDate },
        sport: sport || 'all',
        filters
      }
    })
  } catch (error) {
    console.error('❌ Workout summary error:', error)
    if (error instanceof PolarDataError) {
      res.status(500).json({
        success: false,
        error: { code: error.code, message: error.message }
      })
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch workout summary' }
      })
    }
  }
})

/**
 * GET /api/workouts/sessions
 * Returns detected workout sessions with detailed analysis
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query['startDate'] as string) || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
    const endDate = (req.query['endDate'] as string) || new Date().toISOString().split('T')[0]!
    const sport = req.query['sport'] as string
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 50

    const filters: PolarQueryFilters = {
      startDate,
      endDate,
      sport,
      limit
    }

    const sessions = await polarDao.detectWorkoutSessions(filters)
    
    res.json({
      success: true,
      data: sessions,
      meta: {
        count: sessions.length,
        dateRange: { startDate, endDate },
        sport: sport || 'all',
        session_detection: {
          min_duration_minutes: 10,
          max_gap_minutes: 5,
          heart_rate_range: [50, 220]
        }
      }
    })
  } catch (error) {
    console.error('❌ Workout sessions error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch workout sessions' }
    })
  }
})

/**
 * GET /api/workouts/zones
 * Returns heart rate zone analysis for a date range
 */
router.get('/zones', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query['startDate'] as string) || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
    const endDate = (req.query['endDate'] as string) || new Date().toISOString().split('T')[0]!
    const sport = req.query['sport'] as string

    const filters: PolarQueryFilters = {
      startDate,
      endDate,
      sport
    }

    const sessions = await polarDao.detectWorkoutSessions(filters)
    
    // Aggregate zone data across all sessions
    const totalZones = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 }
    let totalDuration = 0
    let totalCalories = 0

    sessions.forEach(session => {
      Object.keys(totalZones).forEach(zone => {
        totalZones[zone as keyof typeof totalZones] += session.zones[zone as keyof typeof session.zones]
      })
      totalDuration += session.duration_min
      totalCalories += session.calories_burned || 0
    })

    // Calculate percentages
    const zonePercentages = Object.entries(totalZones).reduce((acc, [zone, minutes]) => {
      acc[zone] = totalDuration > 0 ? Math.round((minutes / totalDuration) * 100) : 0
      return acc
    }, {} as Record<string, number>)

    res.json({
      success: true,
      data: {
        total_duration_minutes: totalDuration,
        total_calories: totalCalories,
        zone_distribution: totalZones,
        zone_percentages: zonePercentages,
        sessions_analyzed: sessions.length
      },
      meta: {
        dateRange: { startDate, endDate },
        sport: sport || 'all'
      }
    })
  } catch (error) {
    console.error('❌ Workout zones error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch zone analysis' }
    })
  }
})

/**
 * GET /api/workouts/raw
 * Returns raw polar metrics with optional filters (for debugging)
 */
router.get('/raw', async (req: Request, res: Response) => {
  try {
    const filters: PolarQueryFilters = {
      startDate: req.query['startDate'] as string,
      endDate: req.query['endDate'] as string,
      sport: req.query['sport'] as string,
      limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : 100,
      offset: req.query['offset'] ? parseInt(req.query['offset'] as string) : 0
    }

    const data = await polarDao.getRawMetrics(filters)
    
    res.json({
      success: true,
      data,
      meta: {
        count: data.length,
        filters
      }
    })
  } catch (error) {
    console.error('❌ Workout raw data error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch raw workout data' }
    })
  }
})

/**
 * GET /api/workouts/sports
 * Returns list of available sports in the database
 */
router.get('/sports', async (_req: Request, res: Response) => {
  try {
    const client = await cpapPool.connect()
    const result = await client.query(`
      SELECT 
        sport,
        COUNT(*) as record_count,
        COUNT(DISTINCT DATE(recorded_time_utc)) as unique_days,
        MIN(recorded_time_utc) as first_recorded,
        MAX(recorded_time_utc) as last_recorded,
        AVG(heart_rate) FILTER (WHERE heart_rate > 0) as avg_heart_rate
      FROM polar_metrics
      WHERE sport IS NOT NULL AND sport != ''
      GROUP BY sport
      ORDER BY record_count DESC
    `)
    client.release()
    
    const sports = result.rows.map(row => ({
      sport: row.sport,
      record_count: parseInt(row.record_count),
      unique_days: parseInt(row.unique_days),
      date_range: {
        first_recorded: row.first_recorded,
        last_recorded: row.last_recorded
      },
      avg_heart_rate: row.avg_heart_rate ? Math.round(row.avg_heart_rate) : null
    }))
    
    res.json({
      success: true,
      data: sports,
      meta: {
        total_sports: sports.length
      }
    })
  } catch (error) {
    console.error('❌ Workout sports error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch sports list' }
    })
  }
})

export default router
