/**
 * Bloodwork Lab API Routes - Issue #13
 * 
 * REST API endpoints for bloodwork lab data visualization
 */

import { Router, Request, Response } from 'express'
import { BloodworkDao } from '../database/bloodworkDao'
import { BloodworkQueryFilters, BloodworkDataError } from '../types/bloodwork'
import { generateBloodworkData } from '../utils/mockData'

const router = Router()
const bloodworkDao = new BloodworkDao()

// Generate mock data once at startup
const mockData = generateBloodworkData(180) // 6 months of data
let useMockData = false

// Test database connection and fallback to mock data if needed
const initializeBloodworkData = async () => {
  try {
    await bloodworkDao.getAvailableDates()
    console.log('✅ Bloodwork database connection successful')
    useMockData = false
  } catch (error) {
    console.log('⚠️ Bloodwork database unavailable, using mock data')
    useMockData = true
  }
}

// Initialize on startup
initializeBloodworkData()

/**
 * GET /api/labs - API status and info
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const availableDates = useMockData ? mockData.availableDates : await bloodworkDao.getAvailableDates()

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
    })
  } catch (error) {
    console.error('❌ Bloodwork API status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get API status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/labs/summary/:date - Get lab summary for specific date
 */
router.get('/summary/:date', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params

    if (!date) {
      res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      })
      return
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      })
      return
    }

    const summary = await bloodworkDao.getLabSummary(date)
    
    if (!summary) {
      res.status(404).json({
        success: false,
        error: 'No lab results found for the specified date'
      })
      return
    }

    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('❌ Lab summary error:', error)
    
    if (error instanceof BloodworkDataError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lab summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
})

/**
 * GET /api/labs/results - Get lab results with filtering
 */
router.get('/results', async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      testNames,
      limit,
      offset,
      onlyAbnormal,
      enhanced
    } = req.query

    const filters: BloodworkQueryFilters = {}

    if (startDate) filters.startDate = startDate as string
    if (endDate) filters.endDate = endDate as string
    if (testNames) filters.testNames = (testNames as string).split(',')
    if (limit) filters.limit = parseInt(limit as string)
    if (offset) filters.offset = parseInt(offset as string)
    if (onlyAbnormal === 'true') filters.onlyAbnormal = true

    let results

    if (useMockData) {
      // Apply filters to mock data
      let filteredResults = mockData.labResults.filter(result => {
        if (filters.startDate && result.collected_on < filters.startDate) return false
        if (filters.endDate && result.collected_on > filters.endDate) return false
        if (filters.testNames && !filters.testNames.includes(result.test_name)) return false
        return true
      })

      // Apply pagination
      const startIndex = filters.offset || 0
      const endIndex = startIndex + (filters.limit || 50)
      results = filteredResults.slice(startIndex, endIndex)

      // Add enhanced data if requested
      if (enhanced === 'true') {
        results = results.map(result => ({
          ...result,
          metric: mockData.labMetrics.find(m => m.test_name === result.test_name),
          is_in_range: result.numeric_value >= (mockData.labMetrics.find(m => m.test_name === result.test_name)?.range_min || 0) &&
                      result.numeric_value <= (mockData.labMetrics.find(m => m.test_name === result.test_name)?.range_max || 999)
        }))
      }
    } else {
      results = enhanced === 'true'
        ? await bloodworkDao.getEnhancedLabResults(filters)
        : await bloodworkDao.getLabResults(filters)
    }

    res.json({
      success: true,
      data: results,
      count: results.length,
      filters: filters,
      data_source: useMockData ? 'mock' : 'database'
    })
  } catch (error) {
    console.error('❌ Lab results error:', error)
    
    if (error instanceof BloodworkDataError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lab results',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
})

/**
 * GET /api/labs/latest - Get latest lab results
 */
router.get('/latest', async (_req: Request, res: Response) => {
  try {
    let results

    if (useMockData) {
      // Get latest date from mock data
      const latestDate = mockData.availableDates[0]
      results = mockData.labResults
        .filter(result => result.collected_on === latestDate)
        .map(result => ({
          ...result,
          metric: mockData.labMetrics.find(m => m.test_name === result.test_name),
          is_in_range: result.numeric_value >= (mockData.labMetrics.find(m => m.test_name === result.test_name)?.range_min || 0) &&
                      result.numeric_value <= (mockData.labMetrics.find(m => m.test_name === result.test_name)?.range_max || 999)
        }))
    } else {
      results = await bloodworkDao.getLatestLabResults()
    }

    res.json({
      success: true,
      data: results,
      count: results.length,
      date: results.length > 0 ? results[0]?.collected_on : null,
      data_source: useMockData ? 'mock' : 'database'
    })
  } catch (error) {
    console.error('❌ Latest lab results error:', error)

    if (error instanceof BloodworkDataError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch latest lab results',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
})

/**
 * GET /api/labs/trends/:testName - Get trend analysis for specific test
 */
router.get('/trends/:testName', async (req: Request, res: Response): Promise<void> => {
  try {
    const { testName } = req.params
    const { days } = req.query

    if (!testName) {
      res.status(400).json({
        success: false,
        error: 'Test name parameter is required'
      })
      return
    }

    const daysNumber = days ? parseInt(days as string) : 365

    if (isNaN(daysNumber) || daysNumber <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid days parameter. Must be a positive number'
      })
      return
    }

    const trend = await bloodworkDao.getLabTrend(testName, daysNumber)
    
    if (!trend) {
      res.status(404).json({
        success: false,
        error: 'No trend data found for the specified test'
      })
      return
    }

    res.json({
      success: true,
      data: trend
    })
  } catch (error) {
    console.error('❌ Lab trend error:', error)
    
    if (error instanceof BloodworkDataError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lab trend',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
})

/**
 * GET /api/labs/metrics - Get lab test reference ranges
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { testNames } = req.query

    let metrics

    if (useMockData) {
      const testNamesArray = testNames ? (testNames as string).split(',') : undefined
      metrics = testNamesArray
        ? mockData.labMetrics.filter(m => testNamesArray.includes(m.test_name))
        : mockData.labMetrics
    } else {
      const testNamesArray = testNames ? (testNames as string).split(',') : undefined
      metrics = await bloodworkDao.getLabMetrics(testNamesArray)
    }

    res.json({
      success: true,
      data: metrics,
      count: metrics.length,
      data_source: useMockData ? 'mock' : 'database'
    })
  } catch (error) {
    console.error('❌ Lab metrics error:', error)

    if (error instanceof BloodworkDataError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lab metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
})

/**
 * GET /api/labs/dates - Get available test dates
 */
router.get('/dates', async (_req: Request, res: Response) => {
  try {
    const dates = useMockData ? mockData.availableDates : await bloodworkDao.getAvailableDates()

    res.json({
      success: true,
      data: dates,
      count: dates.length,
      data_source: useMockData ? 'mock' : 'database'
    })
  } catch (error) {
    console.error('❌ Available dates error:', error)

    if (error instanceof BloodworkDataError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available dates',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
})

export default router
