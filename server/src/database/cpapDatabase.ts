/**
 * CPAP Database Configuration - Issue #7
 * 
 * PostgreSQL connection setup for health_ingest database with CPAP metrics
 */

import { Pool, PoolConfig } from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// CPAP Database configuration from Issue #7
const cpapDbConfig: PoolConfig = {
  host: process.env['CPAP_DB_HOST'] || '192.168.0.162',
  port: parseInt(process.env['CPAP_DB_PORT'] || '30017'),
  database: process.env['CPAP_DB_NAME'] || 'health_ingest',
  user: process.env['CPAP_DB_USER'] || 'user',
  password: process.env['CPAP_DB_PASSWORD'] || '8M&=3[Io944',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  ssl: false // No SSL for internal network
}

// Create CPAP connection pool
export const cpapPool = new Pool(cpapDbConfig)

// Test CPAP database connection
export const testCpapConnection = async (): Promise<boolean> => {
  try {
    const client = await cpapPool.connect()
    const result = await client.query('SELECT NOW(), COUNT(*) as table_count FROM cpap_metrics')
    client.release()
    
    console.log('✅ CPAP Database connected successfully:', {
      timestamp: result.rows[0].now,
      cpap_records: result.rows[0].table_count
    })
    return true
  } catch (error) {
    console.error('❌ CPAP Database connection failed:', error)
    return false
  }
}

// Get CPAP database statistics
export const getCpapDbStats = async () => {
  try {
    const client = await cpapPool.connect()
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        MIN(session_start) as earliest_session,
        MAX(session_start) as latest_session,
        COUNT(DISTINCT DATE(session_start)) as unique_days,
        AVG(spo2_avg) FILTER (WHERE spo2_avg > 0) as avg_spo2,
        AVG(pulse_rate_avg) FILTER (WHERE pulse_rate_avg > 0) as avg_pulse,
        AVG(leak_rate_avg) FILTER (WHERE leak_rate_avg > 0) as avg_leak_rate
      FROM cpap_metrics
    `)
    client.release()
    
    return result.rows[0]
  } catch (error) {
    console.error('❌ Failed to get CPAP database stats:', error)
    return null
  }
}

// Graceful shutdown for CPAP pool
export const closeCpapPool = async (): Promise<void> => {
  try {
    await cpapPool.end()
    console.log('🔌 CPAP Database pool closed')
  } catch (error) {
    console.error('❌ Error closing CPAP database pool:', error)
  }
}

// Handle process termination
process.on('SIGINT', closeCpapPool)
process.on('SIGTERM', closeCpapPool)

export default cpapPool
