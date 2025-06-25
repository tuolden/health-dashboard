/**
 * Bloodwork Database Connection - Issue #13
 * 
 * PostgreSQL connection pool for bloodwork_ingest database
 */

import { Pool } from 'pg'

// Database configuration for bloodwork_ingest
const bloodworkConfig = {
  user: process.env['BLOODWORK_DB_USER'] || 'user',
  password: process.env['BLOODWORK_DB_PASSWORD'] || '8M&=3[Io944',
  host: process.env['BLOODWORK_DB_HOST'] || '192.168.0.162',
  port: parseInt(process.env['BLOODWORK_DB_PORT'] || '30017'),
  database: process.env['BLOODWORK_DB_NAME'] || 'bloodwork_ingest',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

// Create connection pool
export const bloodworkPool = new Pool(bloodworkConfig)

// Connection event handlers
bloodworkPool.on('connect', () => {
  console.log('🧬 Connected to bloodwork database')
})

bloodworkPool.on('error', (err) => {
  console.error('❌ Bloodwork database error:', err)
})

// Test connection function
export async function testBloodworkConnection(): Promise<boolean> {
  try {
    const client = await bloodworkPool.connect()
    const result = await client.query('SELECT NOW() as current_time')
    client.release()
    
    console.log('✅ Bloodwork database connection successful:', result.rows[0].current_time)
    return true
  } catch (error) {
    console.error('❌ Bloodwork database connection failed:', error)
    return false
  }
}

// Initialize database tables if they don't exist
export async function initializeBloodworkTables(): Promise<void> {
  try {
    const client = await bloodworkPool.connect()
    
    // Create bloodwork_metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bloodwork_metrics (
        id SERIAL PRIMARY KEY,
        test_name TEXT NOT NULL UNIQUE,
        range_min DOUBLE PRECISION,
        range_max DOUBLE PRECISION,
        units TEXT,
        category TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create bloodwork_by_date table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bloodwork_by_date (
        id SERIAL PRIMARY KEY,
        test_name TEXT NOT NULL,
        value TEXT,
        collected_on DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (test_name, collected_on)
      )
    `)
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bloodwork_by_date_test_name 
      ON bloodwork_by_date(test_name)
    `)
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bloodwork_by_date_collected_on 
      ON bloodwork_by_date(collected_on)
    `)
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bloodwork_by_date_test_date 
      ON bloodwork_by_date(test_name, collected_on)
    `)
    
    client.release()
    console.log('✅ Bloodwork database tables initialized')
    
  } catch (error) {
    console.error('❌ Failed to initialize bloodwork tables:', error)
    throw error
  }
}

// Graceful shutdown
export async function closeBloodworkConnection(): Promise<void> {
  try {
    await bloodworkPool.end()
    console.log('🧬 Bloodwork database connection closed')
  } catch (error) {
    console.error('❌ Error closing bloodwork database connection:', error)
  }
}

// Export default pool
export default bloodworkPool
