"use strict";
/**
 * HUME Scale REST API Routes - Issue #11
 *
 * REST endpoints for HUME smart scale data from scale_data_ingest table
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scaleDao_1 = require("../database/scaleDao");
const scale_1 = require("../types/scale");
const cpapDatabase_1 = require("../database/cpapDatabase");
const router = (0, express_1.Router)();
const scaleDao = new scaleDao_1.ScaleDao();
/**
 * GET /api/scale/health
 * Returns database health and scale_data_ingest table statistics
 */
router.get('/health', async (_req, res) => {
    try {
        const client = await cpapDatabase_1.cpapPool.connect();
        // Test scale_data_ingest table access
        const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT image_date) as unique_days,
        MIN(image_date) as earliest_record,
        MAX(image_date) as latest_record,
        COUNT(*) FILTER (WHERE weight_after IS NOT NULL) as weight_records,
        AVG(weight_after) FILTER (WHERE weight_after > 0) as avg_weight,
        AVG(health_score) FILTER (WHERE health_score > 0) as avg_health_score
      FROM scale_data_ingest
    `);
        const sportBreakdown = await client.query(`
      SELECT 
        'HUME Scale' as device_type,
        COUNT(*) as record_count,
        AVG(weight_after) FILTER (WHERE weight_after > 0) as avg_weight,
        AVG(body_fat_percentage_after) FILTER (WHERE body_fat_percentage_after > 0) as avg_body_fat
      FROM scale_data_ingest
      WHERE weight_after IS NOT NULL
    `);
        client.release();
        const stats = statsResult.rows[0];
        const breakdown = sportBreakdown.rows;
        const response = {
            success: true,
            data: {
                database: 'health_ingest',
                table: 'scale_data_ingest',
                status: 'connected',
                statistics: {
                    total_records: parseInt(stats.total_records),
                    weight_records: parseInt(stats.weight_records),
                    unique_days: parseInt(stats.unique_days),
                    date_range: {
                        earliest: stats.earliest_record,
                        latest: stats.latest_record
                    },
                    avg_weight: stats.avg_weight ? parseFloat(stats.avg_weight).toFixed(1) : null,
                    avg_health_score: stats.avg_health_score ? parseFloat(stats.avg_health_score).toFixed(1) : null
                },
                device_breakdown: breakdown
            },
            timestamp: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Scale health check error:', error);
        const response = {
            success: false,
            error: 'Database connection failed',
            timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
    }
});
/**
 * GET /api/scale/weight-sessions/summary
 * Returns weight session summaries with optional date filtering
 */
router.get('/weight-sessions/summary', async (req, res) => {
    try {
        const { startDate, endDate, limit = '30', offset = '0' } = req.query;
        const filters = {
            startDate: startDate,
            endDate: endDate,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
        const sessions = await scaleDao.getWeightSessionSummary(filters);
        const response = {
            success: true,
            data: sessions,
            timestamp: new Date().toISOString(),
            total_records: sessions.length
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Error fetching weight sessions summary:', error);
        const response = {
            success: false,
            error: error instanceof scale_1.ScaleDataError ? error.message : 'Failed to fetch weight sessions',
            timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
    }
});
/**
 * GET /api/scale/weight-sessions
 * Returns weight sessions with optional date filtering
 */
router.get('/weight-sessions', async (req, res) => {
    try {
        const { startDate, endDate, limit = '30', offset = '0' } = req.query;
        const filters = {
            startDate: startDate,
            endDate: endDate,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
        const sessions = await scaleDao.getWeightSessions(filters);
        const response = {
            success: true,
            data: sessions,
            timestamp: new Date().toISOString(),
            total_records: sessions.length
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Error fetching weight sessions:', error);
        const response = {
            success: false,
            error: error instanceof scale_1.ScaleDataError ? error.message : 'Failed to fetch weight sessions',
            timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
    }
});
/**
 * GET /api/scale/health-snapshot
 * Returns latest health snapshot with all key metrics
 */
router.get('/health-snapshot', async (_req, res) => {
    try {
        const snapshot = await scaleDao.getLatestHealthSnapshot();
        const response = {
            success: true,
            data: snapshot,
            timestamp: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Error fetching health snapshot:', error);
        const response = {
            success: false,
            error: error instanceof scale_1.ScaleDataError ? error.message : 'Failed to fetch health snapshot',
            timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
    }
});
/**
 * GET /api/scale/weight-delta
 * Returns weight change over specified number of days
 */
router.get('/weight-delta', async (req, res) => {
    try {
        const { days = '7' } = req.query;
        const dayCount = parseInt(days);
        if (isNaN(dayCount) || dayCount < 1 || dayCount > 365) {
            const response = {
                success: false,
                error: 'Days parameter must be between 1 and 365',
                timestamp: new Date().toISOString()
            };
            return res.status(400).json(response);
        }
        const delta = await scaleDao.getWeightDelta(dayCount);
        const response = {
            success: true,
            data: delta,
            timestamp: new Date().toISOString()
        };
        return res.json(response);
    }
    catch (error) {
        console.error('❌ Error calculating weight delta:', error);
        const response = {
            success: false,
            error: error instanceof scale_1.ScaleDataError ? error.message : 'Failed to calculate weight delta',
            timestamp: new Date().toISOString()
        };
        return res.status(500).json(response);
    }
});
/**
 * GET /api/scale/raw
 * Returns raw scale data for debugging (limited to recent records)
 */
router.get('/raw', async (req, res) => {
    try {
        const { limit = '10' } = req.query;
        const queryLimit = Math.min(parseInt(limit), 50); // Max 50 records
        const client = await cpapDatabase_1.cpapPool.connect();
        const result = await client.query(`
      SELECT *
      FROM scale_data_ingest
      ORDER BY image_date DESC
      LIMIT $1
    `, [queryLimit]);
        client.release();
        const response = {
            success: true,
            data: result.rows,
            timestamp: new Date().toISOString(),
            total_records: result.rows.length
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Error fetching raw scale data:', error);
        const response = {
            success: false,
            error: 'Failed to fetch raw scale data',
            timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=scaleRoutes.js.map