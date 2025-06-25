"use strict";
/**
 * Bloodwork Lab API Routes - Issue #13
 *
 * REST API endpoints for bloodwork lab data visualization
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bloodworkDao_1 = require("../database/bloodworkDao");
const bloodwork_1 = require("../types/bloodwork");
const router = (0, express_1.Router)();
const bloodworkDao = new bloodworkDao_1.BloodworkDao();
/**
 * GET /api/labs - API status and info
 */
router.get('/', async (_req, res) => {
    try {
        const availableDates = await bloodworkDao.getAvailableDates();
        res.json({
            success: true,
            message: 'Bloodwork Lab API - Issue #13',
            version: '1.0.0',
            endpoints: [
                'GET /api/labs/summary/:date - Lab summary for specific date',
                'GET /api/labs/results - Lab results with filtering',
                'GET /api/labs/latest - Latest lab results',
                'GET /api/labs/trends/:testName - Trend analysis for specific test',
                'GET /api/labs/metrics - Lab test reference ranges',
                'GET /api/labs/dates - Available test dates'
            ],
            available_dates: availableDates.slice(0, 10), // Show last 10 dates
            total_dates: availableDates.length
        });
    }
    catch (error) {
        console.error('❌ Bloodwork API status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get API status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/labs/summary/:date - Get lab summary for specific date
 */
router.get('/summary/:date', async (req, res) => {
    try {
        const { date } = req.params;
        if (!date) {
            res.status(400).json({
                success: false,
                error: 'Date parameter is required'
            });
            return;
        }
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
            return;
        }
        const summary = await bloodworkDao.getLabSummary(date);
        if (!summary) {
            res.status(404).json({
                success: false,
                error: 'No lab results found for the specified date'
            });
            return;
        }
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('❌ Lab summary error:', error);
        if (error instanceof bloodwork_1.BloodworkDataError) {
            res.status(400).json({
                success: false,
                error: error.message,
                code: error.code
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch lab summary',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
});
/**
 * GET /api/labs/results - Get lab results with filtering
 */
router.get('/results', async (req, res) => {
    try {
        const { startDate, endDate, testNames, limit, offset, onlyAbnormal, enhanced } = req.query;
        const filters = {};
        if (startDate)
            filters.startDate = startDate;
        if (endDate)
            filters.endDate = endDate;
        if (testNames)
            filters.testNames = testNames.split(',');
        if (limit)
            filters.limit = parseInt(limit);
        if (offset)
            filters.offset = parseInt(offset);
        if (onlyAbnormal === 'true')
            filters.onlyAbnormal = true;
        const results = enhanced === 'true'
            ? await bloodworkDao.getEnhancedLabResults(filters)
            : await bloodworkDao.getLabResults(filters);
        res.json({
            success: true,
            data: results,
            count: results.length,
            filters: filters
        });
    }
    catch (error) {
        console.error('❌ Lab results error:', error);
        if (error instanceof bloodwork_1.BloodworkDataError) {
            res.status(400).json({
                success: false,
                error: error.message,
                code: error.code
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch lab results',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
});
/**
 * GET /api/labs/latest - Get latest lab results
 */
router.get('/latest', async (_req, res) => {
    try {
        const results = await bloodworkDao.getLatestLabResults();
        res.json({
            success: true,
            data: results,
            count: results.length,
            date: results.length > 0 ? results[0]?.collected_on : null
        });
    }
    catch (error) {
        console.error('❌ Latest lab results error:', error);
        if (error instanceof bloodwork_1.BloodworkDataError) {
            res.status(400).json({
                success: false,
                error: error.message,
                code: error.code
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch latest lab results',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
});
/**
 * GET /api/labs/trends/:testName - Get trend analysis for specific test
 */
router.get('/trends/:testName', async (req, res) => {
    try {
        const { testName } = req.params;
        const { days } = req.query;
        if (!testName) {
            res.status(400).json({
                success: false,
                error: 'Test name parameter is required'
            });
            return;
        }
        const daysNumber = days ? parseInt(days) : 365;
        if (isNaN(daysNumber) || daysNumber <= 0) {
            res.status(400).json({
                success: false,
                error: 'Invalid days parameter. Must be a positive number'
            });
            return;
        }
        const trend = await bloodworkDao.getLabTrend(testName, daysNumber);
        if (!trend) {
            res.status(404).json({
                success: false,
                error: 'No trend data found for the specified test'
            });
            return;
        }
        res.json({
            success: true,
            data: trend
        });
    }
    catch (error) {
        console.error('❌ Lab trend error:', error);
        if (error instanceof bloodwork_1.BloodworkDataError) {
            res.status(400).json({
                success: false,
                error: error.message,
                code: error.code
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch lab trend',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
});
/**
 * GET /api/labs/metrics - Get lab test reference ranges
 */
router.get('/metrics', async (req, res) => {
    try {
        const { testNames } = req.query;
        const testNamesArray = testNames ? testNames.split(',') : undefined;
        const metrics = await bloodworkDao.getLabMetrics(testNamesArray);
        res.json({
            success: true,
            data: metrics,
            count: metrics.length
        });
    }
    catch (error) {
        console.error('❌ Lab metrics error:', error);
        if (error instanceof bloodwork_1.BloodworkDataError) {
            res.status(400).json({
                success: false,
                error: error.message,
                code: error.code
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch lab metrics',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
});
/**
 * GET /api/labs/dates - Get available test dates
 */
router.get('/dates', async (_req, res) => {
    try {
        const dates = await bloodworkDao.getAvailableDates();
        res.json({
            success: true,
            data: dates,
            count: dates.length
        });
    }
    catch (error) {
        console.error('❌ Available dates error:', error);
        if (error instanceof bloodwork_1.BloodworkDataError) {
            res.status(400).json({
                success: false,
                error: error.message,
                code: error.code
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch available dates',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
});
exports.default = router;
//# sourceMappingURL=bloodworkRoutes.js.map