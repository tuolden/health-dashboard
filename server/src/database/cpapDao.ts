/**
 * CPAP Data Access Object - Issue #7
 * 
 * Database operations for CPAP metrics from health_ingest database
 */

import { Pool, QueryResult } from 'pg'
import { cpapPool } from './cpapDatabase'
import {
  CpapMetrics,
  CpapDailySummary,
  CpapMetricsGraphQL,
  CpapQueryFilters,
  Spo2TrendData,
  Spo2PulseData,
  LeakRateData,
  SleepSessionData,
  CpapDataError,
  calculateSpo2Quality,
  calculateLeakSeverity,
  calculateSleepPattern,
  formatDateForApi
} from '../types/cpap'

export class CpapDao {
  private pool: Pool

  constructor(dbPool: Pool = cpapPool) {
    this.pool = dbPool
  }

  /**
   * Get daily summary for REST API /api/cpap/daily-summary
   */
  async getDailySummary(filters: CpapQueryFilters = {}): Promise<CpapDailySummary[]> {
    try {
      let query = `
        SELECT 
          DATE(session_start) as date,
          AVG(spo2_avg) FILTER (WHERE spo2_avg > 0) as spo2_avg,
          AVG(pulse_rate_avg) FILTER (WHERE pulse_rate_avg > 0) as pulse_rate_avg,
          AVG(leak_rate_avg) FILTER (WHERE leak_rate_avg > 0) as leak_rate_avg,
          MIN(session_start) as session_start
        FROM cpap_metrics
        WHERE 1=1
      `
      
      const params: any[] = []
      let paramCount = 0

      // Apply date filters
      if (filters.startDate) {
        query += ` AND DATE(session_start) >= $${++paramCount}`
        params.push(filters.startDate)
      }

      if (filters.endDate) {
        query += ` AND DATE(session_start) <= $${++paramCount}`
        params.push(filters.endDate)
      }

      query += `
        GROUP BY DATE(session_start)
        ORDER BY date DESC
      `

      // Apply pagination
      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`
        params.push(filters.limit)
      }

      if (filters.offset) {
        query += ` OFFSET $${++paramCount}`
        params.push(filters.offset)
      }

      const result: QueryResult = await this.pool.query(query, params)
      
      return result.rows.map(row => ({
        date: formatDateForApi(new Date(row.date)),
        spo2_avg: row.spo2_avg ? Math.round(row.spo2_avg * 10) / 10 : null,
        pulse_rate_avg: row.pulse_rate_avg ? Math.round(row.pulse_rate_avg) : null,
        leak_rate_avg: row.leak_rate_avg ? Math.round(row.leak_rate_avg * 10) / 10 : null,
        session_start: row.session_start ? row.session_start.toISOString() : null
      }))
    } catch (error) {
      throw new CpapDataError(`Failed to fetch CPAP daily summary: ${error}`, 'FETCH_ERROR')
    }
  }

  /**
   * Get CPAP metrics range for GraphQL getCPAPMetricsRange query
   */
  async getCpapMetricsRange(startDate: string, endDate: string): Promise<CpapMetricsGraphQL[]> {
    try {
      const query = `
        SELECT 
          DATE(session_start) as date,
          AVG(spo2_avg) FILTER (WHERE spo2_avg > 0) as spo2_avg,
          AVG(pulse_rate_avg) FILTER (WHERE pulse_rate_avg > 0) as pulse_rate_avg,
          AVG(leak_rate_avg) FILTER (WHERE leak_rate_avg > 0) as leak_rate_avg,
          MIN(session_start) as session_start
        FROM cpap_metrics
        WHERE DATE(session_start) >= $1 AND DATE(session_start) <= $2
        GROUP BY DATE(session_start)
        ORDER BY date ASC
      `

      const result: QueryResult = await this.pool.query(query, [startDate, endDate])
      
      return result.rows.map(row => ({
        date: formatDateForApi(new Date(row.date)),
        spo2_avg: row.spo2_avg ? Math.round(row.spo2_avg * 10) / 10 : null,
        pulse_rate_avg: row.pulse_rate_avg ? Math.round(row.pulse_rate_avg) : null,
        leak_rate_avg: row.leak_rate_avg ? Math.round(row.leak_rate_avg * 10) / 10 : null,
        session_start: row.session_start ? row.session_start.toISOString() : formatDateForApi(new Date(row.date))
      }))
    } catch (error) {
      throw new CpapDataError(`Failed to fetch CPAP metrics range: ${error}`, 'FETCH_ERROR')
    }
  }

  /**
   * Get SpO2 trend data for SpO2 Daily Trend Widget
   */
  async getSpo2TrendData(startDate: string, endDate: string): Promise<Spo2TrendData[]> {
    try {
      const query = `
        SELECT 
          DATE(session_start) as date,
          AVG(spo2_avg) FILTER (WHERE spo2_avg > 0) as spo2_avg
        FROM cpap_metrics
        WHERE DATE(session_start) >= $1 AND DATE(session_start) <= $2
        GROUP BY DATE(session_start)
        ORDER BY date ASC
      `

      const result: QueryResult = await this.pool.query(query, [startDate, endDate])
      
      return result.rows.map(row => {
        const spo2 = row.spo2_avg ? Math.round(row.spo2_avg * 10) / 10 : null
        return {
          date: formatDateForApi(new Date(row.date)),
          spo2_avg: spo2,
          isHealthy: spo2 ? spo2 >= 90 : false,
          qualityRating: calculateSpo2Quality(spo2)
        }
      })
    } catch (error) {
      throw new CpapDataError(`Failed to fetch SpO2 trend data: ${error}`, 'FETCH_ERROR')
    }
  }

  /**
   * Get SpO2 + Pulse Rate data for dual-axis widget
   */
  async getSpo2PulseData(startDate: string, endDate: string): Promise<Spo2PulseData[]> {
    try {
      const query = `
        SELECT 
          DATE(session_start) as date,
          AVG(spo2_avg) FILTER (WHERE spo2_avg > 0) as spo2_avg,
          AVG(pulse_rate_avg) FILTER (WHERE pulse_rate_avg > 0) as pulse_rate_avg
        FROM cpap_metrics
        WHERE DATE(session_start) >= $1 AND DATE(session_start) <= $2
        GROUP BY DATE(session_start)
        ORDER BY date ASC
      `

      const result: QueryResult = await this.pool.query(query, [startDate, endDate])
      
      return result.rows.map(row => {
        const spo2 = row.spo2_avg ? Math.round(row.spo2_avg * 10) / 10 : null
        const pulse = row.pulse_rate_avg ? Math.round(row.pulse_rate_avg) : null
        
        // Determine correlation status
        let correlation: 'normal' | 'concerning' | 'critical' = 'normal'
        if (spo2 && spo2 < 90) correlation = 'critical'
        else if (spo2 && spo2 < 92) correlation = 'concerning'
        else if (pulse && (pulse < 50 || pulse > 100)) correlation = 'concerning'
        
        return {
          date: formatDateForApi(new Date(row.date)),
          spo2_avg: spo2,
          pulse_rate_avg: pulse,
          correlation
        }
      })
    } catch (error) {
      throw new CpapDataError(`Failed to fetch SpO2/Pulse data: ${error}`, 'FETCH_ERROR')
    }
  }

  /**
   * Get leak rate data for Leak Rate Trend Widget
   */
  async getLeakRateData(startDate: string, endDate: string): Promise<LeakRateData[]> {
    try {
      const query = `
        SELECT 
          DATE(session_start) as date,
          AVG(leak_rate_avg) FILTER (WHERE leak_rate_avg > 0) as leak_rate_avg
        FROM cpap_metrics
        WHERE DATE(session_start) >= $1 AND DATE(session_start) <= $2
        GROUP BY DATE(session_start)
        ORDER BY date ASC
      `

      const result: QueryResult = await this.pool.query(query, [startDate, endDate])
      
      return result.rows.map(row => {
        const leakRate = row.leak_rate_avg ? Math.round(row.leak_rate_avg * 10) / 10 : null
        return {
          date: formatDateForApi(new Date(row.date)),
          leak_rate_avg: leakRate,
          isWithinThreshold: leakRate ? leakRate <= 24 : false, // 24 L/min threshold from issue
          severity: calculateLeakSeverity(leakRate)
        }
      })
    } catch (error) {
      throw new CpapDataError(`Failed to fetch leak rate data: ${error}`, 'FETCH_ERROR')
    }
  }

  /**
   * Get sleep session start time data for Sleep Session Start Time Widget
   */
  async getSleepSessionData(startDate: string, endDate: string): Promise<SleepSessionData[]> {
    try {
      const query = `
        SELECT 
          DATE(session_start) as date,
          MIN(session_start) as session_start
        FROM cpap_metrics
        WHERE DATE(session_start) >= $1 AND DATE(session_start) <= $2
        GROUP BY DATE(session_start)
        ORDER BY date ASC
      `

      const result: QueryResult = await this.pool.query(query, [startDate, endDate])
      
      return result.rows.map(row => {
        const sessionStart = new Date(row.session_start)
        const bedtimeHour = sessionStart.getHours()
        
        return {
          date: formatDateForApi(new Date(row.date)),
          session_start: sessionStart.toISOString(),
          bedtime_hour: bedtimeHour,
          sleep_pattern: calculateSleepPattern(sessionStart)
        }
      })
    } catch (error) {
      throw new CpapDataError(`Failed to fetch sleep session data: ${error}`, 'FETCH_ERROR')
    }
  }

  /**
   * Get raw CPAP metrics with optional filters
   */
  async getRawMetrics(filters: CpapQueryFilters = {}): Promise<CpapMetrics[]> {
    try {
      let query = `
        SELECT 
          id, session_start, file_type, flow_rate_avg, mask_pressure_avg,
          tidal_volume_avg, minute_ventilation_avg, respiratory_rate_avg,
          leak_rate_avg, spo2_avg, pulse_rate_avg, pressure_avg, file_path
        FROM cpap_metrics
        WHERE 1=1
      `
      
      const params: any[] = []
      let paramCount = 0

      // Apply filters
      if (filters.startDate) {
        query += ` AND DATE(session_start) >= $${++paramCount}`
        params.push(filters.startDate)
      }

      if (filters.endDate) {
        query += ` AND DATE(session_start) <= $${++paramCount}`
        params.push(filters.endDate)
      }

      query += ` ORDER BY session_start DESC`

      // Pagination
      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`
        params.push(filters.limit)
      }

      if (filters.offset) {
        query += ` OFFSET $${++paramCount}`
        params.push(filters.offset)
      }

      const result: QueryResult<CpapMetrics> = await this.pool.query(query, params)
      return result.rows
    } catch (error) {
      throw new CpapDataError(`Failed to fetch raw CPAP metrics: ${error}`, 'FETCH_ERROR')
    }
  }
}
