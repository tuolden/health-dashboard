/**
 * Scale Data Access Object - Issue #11
 * 
 * Database operations for scale_data_ingest table and HUME scale metrics
 */

import { Pool } from 'pg'
import { cpapPool } from './cpapDatabase' // Reuse same database connection
import {
  WeightSession,
  WeightSessionSummary,
  WeightTrend,
  HealthSnapshot,
  ScaleQueryFilters,
  ScaleDataError,
  calculateChange,
  calculatePercentageChange,
  getTrendDirection,
  DEFAULT_QUERY_LIMIT,
  MAX_QUERY_LIMIT,
  HEALTH_METRICS
} from '../types/scale'

export class ScaleDao {
  private pool: Pool

  constructor(dbPool: Pool = cpapPool) {
    this.pool = dbPool
  }

  /**
   * Get weight sessions with date filtering
   */
  async getWeightSessions(filters: ScaleQueryFilters = {}): Promise<WeightSession[]> {
    try {
      const {
        startDate,
        endDate,
        limit = DEFAULT_QUERY_LIMIT,
        offset = 0
      } = filters

      const queryLimit = Math.min(limit, MAX_QUERY_LIMIT)
      
      let query = `
        SELECT 
          image_date as date,
          health_score,
          weight_after,
          body_fat_percentage_after,
          body_fat_mass_after,
          lean_mass_after,
          skeletal_muscle_mass_after,
          skeletal_mass_after,
          body_water_after,
          bmr_after,
          metabolic_age_after,
          resting_heart_rate_after,
          body_cell_mass_after,
          subcutaneous_fat_mass_after,
          visceral_fat_index_after
        FROM scale_data_ingest
        WHERE 1=1
      `
      
      const params: any[] = []
      let paramIndex = 1

      if (startDate) {
        query += ` AND image_date >= $${paramIndex}`
        params.push(startDate)
        paramIndex++
      }

      if (endDate) {
        query += ` AND image_date <= $${paramIndex}`
        params.push(endDate)
        paramIndex++
      }

      query += ` ORDER BY image_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(queryLimit, offset)

      const client = await this.pool.connect()
      const result = await client.query(query, params)
      client.release()

      return result.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        health_score: row.health_score,
        weight_after: row.weight_after,
        body_fat_percentage_after: row.body_fat_percentage_after,
        body_fat_mass_after: row.body_fat_mass_after,
        lean_mass_after: row.lean_mass_after,
        skeletal_muscle_mass_after: row.skeletal_muscle_mass_after,
        skeletal_mass_after: row.skeletal_mass_after,
        body_water_after: row.body_water_after,
        bmr_after: row.bmr_after,
        metabolic_age_after: row.metabolic_age_after,
        resting_heart_rate_after: row.resting_heart_rate_after,
        body_cell_mass_after: row.body_cell_mass_after,
        subcutaneous_fat_mass_after: row.subcutaneous_fat_mass_after,
        visceral_fat_index_after: row.visceral_fat_index_after
      }))
    } catch (error) {
      console.error('❌ Error fetching weight sessions:', error)
      throw new ScaleDataError('Failed to fetch weight sessions')
    }
  }

  /**
   * Get weight session summary with before/after comparison
   */
  async getWeightSessionSummary(filters: ScaleQueryFilters = {}): Promise<WeightSessionSummary[]> {
    try {
      const {
        startDate,
        endDate,
        limit = DEFAULT_QUERY_LIMIT,
        offset = 0
      } = filters

      const queryLimit = Math.min(limit, MAX_QUERY_LIMIT)
      
      let query = `
        SELECT 
          image_date as date,
          health_score,
          weight_before,
          weight_after,
          body_fat_percentage_before,
          body_fat_percentage_after,
          body_fat_mass_after,
          lean_mass_after,
          skeletal_muscle_mass_after,
          skeletal_mass_after,
          body_water_after,
          bmr_after,
          metabolic_age_after,
          resting_heart_rate_after,
          body_cell_mass_after,
          subcutaneous_fat_mass_after,
          visceral_fat_index_after
        FROM scale_data_ingest
        WHERE 1=1
      `
      
      const params: any[] = []
      let paramIndex = 1

      if (startDate) {
        query += ` AND image_date >= $${paramIndex}`
        params.push(startDate)
        paramIndex++
      }

      if (endDate) {
        query += ` AND image_date <= $${paramIndex}`
        params.push(endDate)
        paramIndex++
      }

      query += ` ORDER BY image_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(queryLimit, offset)

      const client = await this.pool.connect()
      const result = await client.query(query, params)
      client.release()

      return result.rows.map(row => {
        const weightChange = calculateChange(row.weight_after, row.weight_before)
        const bodyFatChange = calculateChange(row.body_fat_percentage_after, row.body_fat_percentage_before)

        return {
          date: row.date.toISOString().split('T')[0],
          health_score: row.health_score,
          weight_before: row.weight_before,
          weight_after: row.weight_after,
          body_fat_percentage_before: row.body_fat_percentage_before,
          body_fat_percentage_after: row.body_fat_percentage_after,
          body_fat_mass_after: row.body_fat_mass_after,
          lean_mass_after: row.lean_mass_after,
          skeletal_muscle_mass_after: row.skeletal_muscle_mass_after,
          skeletal_mass_after: row.skeletal_mass_after,
          body_water_after: row.body_water_after,
          bmr_after: row.bmr_after,
          metabolic_age_after: row.metabolic_age_after,
          resting_heart_rate_after: row.resting_heart_rate_after,
          body_cell_mass_after: row.body_cell_mass_after,
          subcutaneous_fat_mass_after: row.subcutaneous_fat_mass_after,
          visceral_fat_index_after: row.visceral_fat_index_after,
          weight_change: weightChange,
          body_fat_change: bodyFatChange
        }
      })
    } catch (error) {
      console.error('❌ Error fetching weight session summary:', error)
      throw new ScaleDataError('Failed to fetch weight session summary')
    }
  }

  /**
   * Get latest health snapshot
   */
  async getLatestHealthSnapshot(): Promise<HealthSnapshot | null> {
    try {
      const query = `
        SELECT 
          image_date as date,
          weight_after as weight,
          body_fat_percentage_after as body_fat_percentage,
          skeletal_muscle_mass_after as skeletal_muscle_mass,
          body_water_after as body_water,
          bmr_after as bmr,
          resting_heart_rate_after as resting_heart_rate,
          metabolic_age_after as metabolic_age,
          health_score
        FROM scale_data_ingest
        ORDER BY image_date DESC
        LIMIT 1
      `

      const client = await this.pool.connect()
      const result = await client.query(query)
      client.release()

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        date: row.date.toISOString().split('T')[0],
        weight: row.weight,
        body_fat_percentage: row.body_fat_percentage,
        skeletal_muscle_mass: row.skeletal_muscle_mass,
        body_water: row.body_water,
        bmr: row.bmr,
        resting_heart_rate: row.resting_heart_rate,
        metabolic_age: row.metabolic_age,
        health_score: row.health_score
      }
    } catch (error) {
      console.error('❌ Error fetching latest health snapshot:', error)
      throw new ScaleDataError('Failed to fetch latest health snapshot')
    }
  }

  /**
   * Calculate weight delta for specified time period
   */
  async getWeightDelta(days: number): Promise<WeightTrend | null> {
    try {
      const query = `
        WITH recent_data AS (
          SELECT 
            weight_after,
            image_date,
            ROW_NUMBER() OVER (ORDER BY image_date DESC) as rn
          FROM scale_data_ingest
          WHERE weight_after IS NOT NULL
          ORDER BY image_date DESC
          LIMIT $1
        )
        SELECT 
          (SELECT weight_after FROM recent_data WHERE rn = 1) as current_weight,
          (SELECT weight_after FROM recent_data WHERE rn = (SELECT COUNT(*) FROM recent_data)) as previous_weight,
          COUNT(*) as days_analyzed
        FROM recent_data
      `

      const client = await this.pool.connect()
      const result = await client.query(query, [days + 1])
      client.release()

      if (result.rows.length === 0 || !result.rows[0].current_weight) return null

      const row = result.rows[0]
      const change = calculateChange(row.current_weight, row.previous_weight)
      const changePercentage = calculatePercentageChange(row.current_weight, row.previous_weight)

      return {
        metric: HEALTH_METRICS.WEIGHT,
        current_value: row.current_weight,
        previous_value: row.previous_weight,
        change_amount: change,
        change_percentage: changePercentage,
        trend_direction: getTrendDirection(change),
        days_analyzed: Math.min(days, row.days_analyzed)
      }
    } catch (error) {
      console.error('❌ Error calculating weight delta:', error)
      throw new ScaleDataError('Failed to calculate weight delta')
    }
  }

  /**
   * Get database health statistics
   */
  async getScaleDbStats() {
    try {
      const client = await this.pool.connect()
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_records,
          MIN(image_date) as earliest_date,
          MAX(image_date) as latest_date,
          COUNT(DISTINCT image_date) as unique_days,
          AVG(weight_after) FILTER (WHERE weight_after > 0) as avg_weight,
          AVG(body_fat_percentage_after) FILTER (WHERE body_fat_percentage_after > 0) as avg_body_fat,
          AVG(health_score) FILTER (WHERE health_score > 0) as avg_health_score
        FROM scale_data_ingest
      `)
      client.release()
      
      return result.rows[0]
    } catch (error) {
      console.error('❌ Failed to get scale database stats:', error)
      return null
    }
  }
}
