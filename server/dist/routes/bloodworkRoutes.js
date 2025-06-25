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
const mockData_1 = require("../utils/mockData");
const router = (0, express_1.Router)();
const bloodworkDao = new bloodworkDao_1.BloodworkDao();
// Generate mock data once at startup
const mockData = (0, mockData_1.generateBloodworkData)(180); // 6 months of data
let useMockData = true; // Default to mock data
// Test database connection and fallback to mock data if needed
const initializeBloodworkData = async () => {
    try {
        await bloodworkDao.getAvailableDates();
        console.log('✅ Bloodwork database connection successful');
        useMockData = false;
    }
    catch (error) {
        console.log('⚠️ Bloodwork database unavailable, using mock data');
        useMockData = true;
    }
};
// Initialize on startup (non-blocking)
initializeBloodworkData().catch(() => {
    console.log('⚠️ Bloodwork initialization failed, using mock data');
    useMockData = true;
});
// Helper function to safely execute database operations with fallback
const safeDbOperation = async (dbOperation, mockFallback) => {
    if (useMockData) {
        return mockFallback();
    }
    try {
        return await dbOperation();
    }
    catch (error) {
        console.log('⚠️ Database operation failed, falling back to mock data:', error);
        useMockData = true;
        return mockFallback();
    }
};
/**
 * GET /api/labs - API status and info
 */
router.get('/', async (_req, res) => {
    try {
        const availableDates = await safeDbOperation(() => bloodworkDao.getAvailableDates(), () => mockData.availableDates);
        res.json({
            success: true,
            message: 'Bloodwork Lab API - Issue #13',
            version: '1.0.0',
            data_source: useMockData ? 'mock' : 'database',
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
        let results;
        if (useMockData) {
            // Apply filters to mock data
            let filteredResults = mockData.labResults.filter(result => {
                if (filters.startDate && result.collected_on < filters.startDate)
                    return false;
                if (filters.endDate && result.collected_on > filters.endDate)
                    return false;
                if (filters.testNames && !filters.testNames.includes(result.test_name))
                    return false;
                return true;
            });
            // Apply pagination
            const startIndex = filters.offset || 0;
            const endIndex = startIndex + (filters.limit || 50);
            results = filteredResults.slice(startIndex, endIndex);
            // Add enhanced data if requested
            if (enhanced === 'true') {
                results = results.map(result => ({
                    ...result,
                    metric: mockData.labMetrics.find(m => m.test_name === result.test_name),
                    is_in_range: result.numeric_value >= (mockData.labMetrics.find(m => m.test_name === result.test_name)?.range_min || 0) &&
                        result.numeric_value <= (mockData.labMetrics.find(m => m.test_name === result.test_name)?.range_max || 999)
                }));
            }
        }
        else {
            results = enhanced === 'true'
                ? await bloodworkDao.getEnhancedLabResults(filters)
                : await bloodworkDao.getLabResults(filters);
        }
        res.json({
            success: true,
            data: results,
            count: results.length,
            filters: filters,
            data_source: useMockData ? 'mock' : 'database'
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
        let results;
        if (useMockData) {
            // Get latest date from mock data
            const latestDate = mockData.availableDates[0];
            results = mockData.labResults
                .filter(result => result.collected_on === latestDate)
                .map(result => ({
                ...result,
                metric: mockData.labMetrics.find(m => m.test_name === result.test_name),
                is_in_range: result.numeric_value >= (mockData.labMetrics.find(m => m.test_name === result.test_name)?.range_min || 0) &&
                    result.numeric_value <= (mockData.labMetrics.find(m => m.test_name === result.test_name)?.range_max || 999)
            }));
        }
        else {
            results = await bloodworkDao.getLatestLabResults();
        }
        res.json({
            success: true,
            data: results,
            count: results.length,
            date: results.length > 0 ? results[0]?.collected_on : null,
            data_source: useMockData ? 'mock' : 'database'
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
        let metrics;
        if (useMockData) {
            const testNamesArray = testNames ? testNames.split(',') : undefined;
            metrics = testNamesArray
                ? mockData.labMetrics.filter(m => testNamesArray.includes(m.test_name))
                : mockData.labMetrics;
        }
        else {
            const testNamesArray = testNames ? testNames.split(',') : undefined;
            metrics = await bloodworkDao.getLabMetrics(testNamesArray);
        }
        res.json({
            success: true,
            data: metrics,
            count: metrics.length,
            data_source: useMockData ? 'mock' : 'database'
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
 * GET /api/labs/summary/:date - Get lab summary for specific date
 */
router.get('/summary/:date', async (req, res) => {
    try {
        const { date } = req.params;
        let summary;
        if (useMockData) {
            // Generate summary from mock data for the specified date
            const dateResults = mockData.labResults.filter(result => result.collected_on === date);
            if (dateResults.length === 0) {
                res.status(404).json({
                    success: false,
                    error: 'No lab data found for the specified date',
                    date
                });
                return;
            }
            // Group results by category
            const categories = {};
            const categoryStats = {};
            dateResults.forEach(result => {
                const metric = mockData.labMetrics.find(m => m.test_name === result.test_name);
                if (metric) {
                    if (!categories[metric.category]) {
                        categories[metric.category] = [];
                        categoryStats[metric.category] = { total: 0, inRange: 0, outOfRange: 0 };
                    }
                    const isInRange = result.numeric_value >= metric.range_min && result.numeric_value <= metric.range_max;
                    categories[metric.category]?.push({
                        ...result,
                        metric,
                        is_in_range: isInRange
                    });
                    const stats = categoryStats[metric.category];
                    if (stats) {
                        stats.total++;
                        if (isInRange) {
                            stats.inRange++;
                        }
                        else {
                            stats.outOfRange++;
                        }
                    }
                }
            });
            summary = {
                date,
                totalTests: dateResults.length,
                categories,
                categoryStats,
                overallStats: {
                    total: dateResults.length,
                    inRange: Object.values(categoryStats).reduce((sum, cat) => sum + cat.inRange, 0),
                    outOfRange: Object.values(categoryStats).reduce((sum, cat) => sum + cat.outOfRange, 0)
                }
            };
        }
        else {
            // Use database operation (not implemented yet)
            throw new Error('Database summary not implemented yet');
        }
        res.json({
            success: true,
            data: summary,
            data_source: useMockData ? 'mock' : 'database'
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
 * GET /api/labs/lifestyle-correlations - Get lifestyle-lab correlations
 */
router.get('/lifestyle-correlations', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // For now, return mock correlation data
        const mockCorrelations = [
            {
                lifestyle_factor: 'Sleep Quality',
                lab_test: 'Cortisol',
                correlation: -0.72,
                significance: 0.001,
                sample_size: 45,
                description: 'Better sleep quality strongly correlates with lower cortisol levels'
            },
            {
                lifestyle_factor: 'Exercise Frequency',
                lab_test: 'HDL Cholesterol',
                correlation: 0.68,
                significance: 0.003,
                sample_size: 52,
                description: 'Regular exercise positively correlates with higher HDL cholesterol'
            },
            {
                lifestyle_factor: 'Stress Level',
                lab_test: 'Glucose',
                correlation: 0.45,
                significance: 0.02,
                sample_size: 38,
                description: 'Higher stress levels correlate with elevated glucose levels'
            }
        ];
        res.json({
            success: true,
            data: mockCorrelations,
            count: mockCorrelations.length,
            data_source: 'mock',
            timeframe: { startDate, endDate }
        });
    }
    catch (error) {
        console.error('❌ Lifestyle correlations error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch lifestyle correlations',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/labs/hormones - Get hormone analysis
 */
router.get('/hormones', async (req, res) => {
    try {
        const { category, gender, enhanced } = req.query;
        // For now, return mock hormone data
        const mockHormoneData = [
            {
                category: 'thyroid',
                name: 'TSH',
                value: 2.5,
                units: 'mIU/L',
                range_min: 0.4,
                range_max: 4.0,
                optimal_min: 1.0,
                optimal_max: 2.5,
                status: 'optimal'
            },
            {
                category: 'thyroid',
                name: 'Free T4',
                value: 1.2,
                units: 'ng/dL',
                range_min: 0.8,
                range_max: 1.8,
                optimal_min: 1.0,
                optimal_max: 1.5,
                status: 'optimal'
            },
            {
                category: 'reproductive',
                name: 'Testosterone Total',
                value: 650,
                units: 'ng/dL',
                range_min: 300,
                range_max: 1000,
                optimal_min: 500,
                optimal_max: 800,
                status: 'optimal'
            }
        ];
        res.json({
            success: true,
            data: mockHormoneData,
            count: mockHormoneData.length,
            data_source: 'mock',
            filters: { category, gender, enhanced }
        });
    }
    catch (error) {
        console.error('❌ Hormone data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch hormone data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/labs/dates - Get available test dates
 */
router.get('/dates', async (_req, res) => {
    try {
        const dates = await safeDbOperation(() => bloodworkDao.getAvailableDates(), () => mockData.availableDates);
        res.json({
            success: true,
            data: dates,
            count: dates.length,
            data_source: useMockData ? 'mock' : 'database'
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