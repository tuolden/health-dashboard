"use strict";
/**
 * CPAP REST API Routes - Issue #7
 *
 * REST endpoints for CPAP metrics data from health_ingest database
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cpapDao_1 = require("../database/cpapDao");
const cpap_1 = require("../types/cpap");
const cpapDatabase_1 = require("../database/cpapDatabase");
const router = (0, express_1.Router)();
const cpapDao = new cpapDao_1.CpapDao();
/**
 * GET /api/cpap/daily-summary
 * Returns daily aggregates (1 point per session_start day)
 *
 * Query parameters:
 * - startDate: YYYY-MM-DD (optional)
 * - endDate: YYYY-MM-DD (optional)
 * - limit: number (optional, default: 30)
 * - offset: number (optional, default: 0)
 */
router.get('/daily-summary', async (req, res) => {
    try {
        const filters = {
            startDate: req.query['startDate'],
            endDate: req.query['endDate'],
            limit: req.query['limit'] ? parseInt(req.query['limit']) : 30,
            offset: req.query['offset'] ? parseInt(req.query['offset']) : 0
        };
        // Validate date formats if provided
        if (filters.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(filters.startDate)) {
            throw new cpap_1.CpapValidationError('startDate must be in YYYY-MM-DD format');
        }
        if (filters.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
            throw new cpap_1.CpapValidationError('endDate must be in YYYY-MM-DD format');
        }
        // Validate numeric parameters
        if (filters.limit && (filters.limit < 1 || filters.limit > 365)) {
            throw new cpap_1.CpapValidationError('limit must be between 1 and 365');
        }
        if (filters.offset && filters.offset < 0) {
            throw new cpap_1.CpapValidationError('offset must be non-negative');
        }
        const data = await cpapDao.getDailySummary(filters);
        res.json({
            success: true,
            data,
            meta: {
                count: data.length,
                filters: {
                    startDate: filters.startDate || null,
                    endDate: filters.endDate || null,
                    limit: filters.limit,
                    offset: filters.offset
                }
            }
        });
    }
    catch (error) {
        console.error('❌ CPAP daily summary error:', error);
        if (error instanceof cpap_1.CpapDataError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error'
                }
            });
        }
    }
});
/**
 * GET /api/cpap/spo2-trend
 * Returns SpO2 trend data for SpO2 Daily Trend Widget
 */
router.get('/spo2-trend', async (req, res) => {
    try {
        const startDate = req.query['startDate'] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = req.query['endDate'] || new Date().toISOString().split('T')[0];
        const data = await cpapDao.getSpo2TrendData(startDate, endDate);
        res.json({
            success: true,
            data,
            meta: {
                count: data.length,
                dateRange: { startDate, endDate }
            }
        });
    }
    catch (error) {
        console.error('❌ CPAP SpO2 trend error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'FETCH_ERROR', message: 'Failed to fetch SpO2 trend data' }
        });
    }
});
/**
 * GET /api/cpap/spo2-pulse
 * Returns SpO2 + Pulse Rate data for dual-axis widget
 */
router.get('/spo2-pulse', async (req, res) => {
    try {
        const startDate = req.query['startDate'] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = req.query['endDate'] || new Date().toISOString().split('T')[0];
        const data = await cpapDao.getSpo2PulseData(startDate, endDate);
        res.json({
            success: true,
            data,
            meta: {
                count: data.length,
                dateRange: { startDate, endDate }
            }
        });
    }
    catch (error) {
        console.error('❌ CPAP SpO2/Pulse error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'FETCH_ERROR', message: 'Failed to fetch SpO2/Pulse data' }
        });
    }
});
/**
 * GET /api/cpap/leak-rate
 * Returns leak rate data for Leak Rate Trend Widget
 */
router.get('/leak-rate', async (req, res) => {
    try {
        const startDate = req.query['startDate'] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = req.query['endDate'] || new Date().toISOString().split('T')[0];
        const data = await cpapDao.getLeakRateData(startDate, endDate);
        res.json({
            success: true,
            data,
            meta: {
                count: data.length,
                dateRange: { startDate, endDate },
                threshold: '24 L/min'
            }
        });
    }
    catch (error) {
        console.error('❌ CPAP leak rate error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'FETCH_ERROR', message: 'Failed to fetch leak rate data' }
        });
    }
});
/**
 * GET /api/cpap/sleep-sessions
 * Returns sleep session start time data for Sleep Session Start Time Widget
 */
router.get('/sleep-sessions', async (req, res) => {
    try {
        const startDate = req.query['startDate'] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = req.query['endDate'] || new Date().toISOString().split('T')[0];
        const data = await cpapDao.getSleepSessionData(startDate, endDate);
        res.json({
            success: true,
            data,
            meta: {
                count: data.length,
                dateRange: { startDate, endDate }
            }
        });
    }
    catch (error) {
        console.error('❌ CPAP sleep sessions error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'FETCH_ERROR', message: 'Failed to fetch sleep session data' }
        });
    }
});
/**
 * GET /api/cpap/health
 * Health check and database statistics for CPAP connection
 */
router.get('/health', async (_req, res) => {
    try {
        const isConnected = await (0, cpapDatabase_1.testCpapConnection)();
        const stats = await (0, cpapDatabase_1.getCpapDbStats)();
        res.json({
            success: true,
            database: {
                connected: isConnected,
                stats: stats || 'Unable to fetch stats'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ CPAP health check error:', error);
        res.status(500).json({
            success: false,
            database: {
                connected: false,
                error: 'Connection failed'
            },
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/cpap/raw
 * Returns raw CPAP metrics with optional filters (for debugging)
 */
router.get('/raw', async (req, res) => {
    try {
        const filters = {
            startDate: req.query['startDate'],
            endDate: req.query['endDate'],
            limit: req.query['limit'] ? parseInt(req.query['limit']) : 10,
            offset: req.query['offset'] ? parseInt(req.query['offset']) : 0
        };
        const data = await cpapDao.getRawMetrics(filters);
        res.json({
            success: true,
            data,
            meta: {
                count: data.length,
                filters
            }
        });
    }
    catch (error) {
        console.error('❌ CPAP raw data error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'FETCH_ERROR', message: 'Failed to fetch raw CPAP data' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=cpapRoutes.js.map