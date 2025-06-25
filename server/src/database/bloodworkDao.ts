/**
 * Bloodwork Data Access Object - Issue #13
 * 
 * Database operations for bloodwork lab data visualization
 */

import { Pool } from 'pg'
import { bloodworkPool } from './bloodworkDatabase'
import {
  LabResult,
  LabMetric,
  EnhancedLabResult,
  LabPanel,
  LabSummary,
  LabTrend,
  BloodworkQueryFilters,
  BloodworkDataError,
  LAB_CATEGORIES,
  LAB_PANELS,
  calculateDeviationScore,
  getRiskLevel,
  calculateTrendDirection,
  DEFAULT_QUERY_LIMIT,
  MAX_QUERY_LIMIT
} from '../types/bloodwork'

export class BloodworkDao {
  private pool: Pool

  constructor(dbPool: Pool = bloodworkPool) {
    this.pool = dbPool
  }

  /**
   * Get lab results with optional filtering
   */
  async getLabResults(filters: BloodworkQueryFilters = {}): Promise<LabResult[]> {
    try {
      const {
        startDate,
        endDate,
        testNames,
        limit = DEFAULT_QUERY_LIMIT,
        offset = 0
      } = filters

      const queryLimit = Math.min(limit, MAX_QUERY_LIMIT)
      
      let query = `
        SELECT 
          id,
          test_name,
          value,
          collected_on::text as collected_on
        FROM bloodwork_by_date
        WHERE 1=1
      `
      
      const params: any[] = []
      let paramIndex = 1

      if (startDate) {
        query += ` AND collected_on >= $${paramIndex}`
        params.push(startDate)
        paramIndex++
      }

      if (endDate) {
        query += ` AND collected_on <= $${paramIndex}`
        params.push(endDate)
        paramIndex++
      }

      if (testNames && testNames.length > 0) {
        query += ` AND test_name = ANY($${paramIndex})`
        params.push(testNames)
        paramIndex++
      }

      query += ` ORDER BY collected_on DESC, test_name ASC`
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(queryLimit, offset)

      const result = await this.pool.query(query, params)
      return result.rows
    } catch (error) {
      console.error('❌ Error fetching lab results:', error)
      throw new BloodworkDataError('Failed to fetch lab results', 'FETCH_ERROR', error)
    }
  }

  /**
   * Get lab metrics (reference ranges)
   */
  async getLabMetrics(testNames?: string[]): Promise<LabMetric[]> {
    try {
      let query = `
        SELECT 
          id,
          test_name,
          range_min,
          range_max,
          units,
          category,
          description
        FROM bloodwork_metrics
      `
      
      const params: any[] = []
      
      if (testNames && testNames.length > 0) {
        query += ` WHERE test_name = ANY($1)`
        params.push(testNames)
      }
      
      query += ` ORDER BY test_name ASC`

      const result = await this.pool.query(query, params)
      return result.rows
    } catch (error) {
      console.error('❌ Error fetching lab metrics:', error)
      throw new BloodworkDataError('Failed to fetch lab metrics', 'FETCH_ERROR', error)
    }
  }

  /**
   * Get enhanced lab results with metadata and risk assessment
   */
  async getEnhancedLabResults(filters: BloodworkQueryFilters = {}): Promise<EnhancedLabResult[]> {
    try {
      const {
        startDate,
        endDate,
        testNames,
        limit = DEFAULT_QUERY_LIMIT,
        offset = 0,
        onlyAbnormal = false
      } = filters

      const queryLimit = Math.min(limit, MAX_QUERY_LIMIT)
      
      let query = `
        SELECT 
          bd.id,
          bd.test_name,
          bd.value,
          bd.collected_on::text as collected_on,
          bm.range_min,
          bm.range_max,
          bm.units,
          bm.category,
          bm.description,
          CASE 
            WHEN bd.value ~ '^[0-9]+\.?[0-9]*$' THEN bd.value::DOUBLE PRECISION
            ELSE NULL
          END as numeric_value,
          CASE 
            WHEN bd.value ~ '^[0-9]+\.?[0-9]*$' THEN true
            ELSE false
          END as is_numeric
        FROM bloodwork_by_date bd
        LEFT JOIN bloodwork_metrics bm ON bd.test_name = bm.test_name
        WHERE 1=1
      `
      
      const params: any[] = []
      let paramIndex = 1

      if (startDate) {
        query += ` AND bd.collected_on >= $${paramIndex}`
        params.push(startDate)
        paramIndex++
      }

      if (endDate) {
        query += ` AND bd.collected_on <= $${paramIndex}`
        params.push(endDate)
        paramIndex++
      }

      if (testNames && testNames.length > 0) {
        query += ` AND bd.test_name = ANY($${paramIndex})`
        params.push(testNames)
        paramIndex++
      }

      if (onlyAbnormal) {
        query += ` AND (
          bm.range_min IS NULL OR bm.range_max IS NULL OR
          (bd.value ~ '^[0-9]+\.?[0-9]*$' AND (
            bd.value::DOUBLE PRECISION < bm.range_min OR 
            bd.value::DOUBLE PRECISION > bm.range_max
          ))
        )`
      }

      query += ` ORDER BY bd.collected_on DESC, bd.test_name ASC`
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(queryLimit, offset)

      const result = await this.pool.query(query, params)
      
      // Enhance results with risk assessment
      const enhancedResults: EnhancedLabResult[] = result.rows.map(row => {
        const metric: LabMetric | undefined = row.range_min !== null ? {
          test_name: row.test_name,
          range_min: row.range_min,
          range_max: row.range_max,
          units: row.units,
          category: row.category,
          description: row.description
        } : undefined

        const enhanced: EnhancedLabResult = {
          id: row.id,
          test_name: row.test_name,
          value: row.value,
          collected_on: row.collected_on,
          numeric_value: row.numeric_value,
          is_numeric: row.is_numeric
        }

        if (metric) {
          enhanced.metric = metric
        }

        // Calculate risk assessment for numeric values
        if (enhanced.is_numeric && enhanced.numeric_value !== null && enhanced.numeric_value !== undefined && enhanced.metric) {
          const deviationScore = calculateDeviationScore(
            enhanced.numeric_value,
            enhanced.metric.range_min,
            enhanced.metric.range_max
          )

          enhanced.deviation_score = deviationScore
          enhanced.risk_level = getRiskLevel(deviationScore)
          enhanced.is_in_range = deviationScore === 0
        }

        return enhanced
      })

      return enhancedResults
    } catch (error) {
      console.error('❌ Error fetching enhanced lab results:', error)
      throw new BloodworkDataError('Failed to fetch enhanced lab results', 'FETCH_ERROR', error)
    }
  }

  /**
   * Get lab summary for a specific date
   */
  async getLabSummary(collectedOn: string): Promise<LabSummary | null> {
    try {
      const results = await this.getEnhancedLabResults({
        startDate: collectedOn,
        endDate: collectedOn,
        limit: 1000
      })

      if (results.length === 0) {
        return null
      }

      const totalTests = results.length
      const inRangeCount = results.filter(r => r.is_in_range === true).length
      const outOfRangeCount = totalTests - inRangeCount
      const criticalCount = results.filter(r => r.risk_level === 'critical').length

      // Group by panels
      const panels: LabPanel[] = []
      
      for (const [panelKey, panelName] of Object.entries(LAB_PANELS)) {
        const panelTests = (LAB_CATEGORIES as any)[panelKey] || []
        const panelResults = results.filter(r => panelTests.includes(r.test_name))
        
        if (panelResults.length > 0) {
          const abnormalCount = panelResults.filter(r => r.is_in_range === false).length
          
          panels.push({
            panel_name: panelName,
            tests: panelResults,
            overall_status: abnormalCount === 0 ? 'normal' : 
                           panelResults.some(r => r.risk_level === 'critical') ? 'critical' : 'abnormal',
            abnormal_count: abnormalCount,
            total_count: panelResults.length
          })
        }
      }

      // Get top 3 concerns
      const topConcerns = results
        .filter(r => r.deviation_score && r.deviation_score > 0)
        .sort((a, b) => (b.deviation_score || 0) - (a.deviation_score || 0))
        .slice(0, 3)

      return {
        collected_on: collectedOn,
        total_tests: totalTests,
        in_range_count: inRangeCount,
        out_of_range_count: outOfRangeCount,
        critical_count: criticalCount,
        panels,
        top_concerns: topConcerns,
        overall_health_score: Math.round((inRangeCount / totalTests) * 100)
      }
    } catch (error) {
      console.error('❌ Error generating lab summary:', error)
      throw new BloodworkDataError('Failed to generate lab summary', 'SUMMARY_ERROR', error)
    }
  }

  /**
   * Get trend analysis for a specific test
   */
  async getLabTrend(testName: string, days: number = 365): Promise<LabTrend | null> {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const query = `
        SELECT 
          bd.value,
          bd.collected_on::text as date,
          bm.range_min,
          bm.range_max,
          CASE 
            WHEN bd.value ~ '^[0-9]+\.?[0-9]*$' THEN bd.value::DOUBLE PRECISION
            ELSE NULL
          END as numeric_value
        FROM bloodwork_by_date bd
        LEFT JOIN bloodwork_metrics bm ON bd.test_name = bm.test_name
        WHERE bd.test_name = $1 
          AND bd.collected_on >= $2 
          AND bd.collected_on <= $3
          AND bd.value ~ '^[0-9]+\.?[0-9]*$'
        ORDER BY bd.collected_on ASC
      `

      const result = await this.pool.query(query, [testName, startDate, endDate])
      
      if (result.rows.length === 0) {
        return null
      }

      const values = result.rows.map(row => ({
        date: row.date,
        value: row.numeric_value,
        is_in_range: row.range_min && row.range_max ? 
          (row.numeric_value >= row.range_min && row.numeric_value <= row.range_max) : true
      }))

      const latestValue = values[values.length - 1]?.value
      const previousValue = values.length > 1 ? values[values.length - 2]?.value : undefined
      
      let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable'
      let changeAmount: number | undefined
      let changePercentage: number | undefined

      if (previousValue !== undefined) {
        changeAmount = latestValue - previousValue
        changePercentage = (changeAmount / previousValue) * 100
        trendDirection = calculateTrendDirection(latestValue, previousValue)
      }

      const trend: LabTrend = {
        test_name: testName,
        values,
        trend_direction: trendDirection,
        latest_value: latestValue
      }

      if (previousValue !== undefined) {
        trend.previous_value = previousValue
      }
      if (changeAmount !== undefined) {
        trend.change_amount = changeAmount
      }
      if (changePercentage !== undefined) {
        trend.change_percentage = changePercentage
      }

      return trend
    } catch (error) {
      console.error('❌ Error fetching lab trend:', error)
      throw new BloodworkDataError('Failed to fetch lab trend', 'TREND_ERROR', error)
    }
  }

  /**
   * Get latest lab results (most recent date)
   */
  async getLatestLabResults(): Promise<EnhancedLabResult[]> {
    try {
      // First, get the most recent collection date
      const dateQuery = `
        SELECT MAX(collected_on) as latest_date 
        FROM bloodwork_by_date
      `
      
      const dateResult = await this.pool.query(dateQuery)
      const latestDate = dateResult.rows[0]?.latest_date

      if (!latestDate) {
        return []
      }

      return this.getEnhancedLabResults({
        startDate: latestDate,
        endDate: latestDate,
        limit: 1000
      })
    } catch (error) {
      console.error('❌ Error fetching latest lab results:', error)
      throw new BloodworkDataError('Failed to fetch latest lab results', 'FETCH_ERROR', error)
    }
  }

  /**
   * Get available test dates
   */
  async getAvailableDates(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT collected_on::text as date
        FROM bloodwork_by_date
        ORDER BY collected_on DESC
      `
      
      const result = await this.pool.query(query)
      return result.rows.map(row => row.date)
    } catch (error) {
      console.error('❌ Error fetching available dates:', error)
      throw new BloodworkDataError('Failed to fetch available dates', 'FETCH_ERROR', error)
    }
  }
}
