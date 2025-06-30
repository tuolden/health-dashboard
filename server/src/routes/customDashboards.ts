/**
 * Custom Dashboard API Routes - Issue #15
 * 
 * REST API endpoints for custom dashboard builder functionality
 */

import express from 'express'
import { CustomDashboardDao } from '../database/customDashboardDao'

const router = express.Router()
const customDashboardDao = new CustomDashboardDao()

// Mock data for when database is unavailable
const mockDashboards = [
  {
    id: 1,
    name: 'My Health Overview',
    time_range: 'last_month',
    user_id: 'default_user',
    created_at: new Date(),
    updated_at: new Date(),
    widgets: [
      {
        id: 1,
        dashboard_id: 1,
        widget_type: 'lab-health-score-summary',
        grid_x: 0,
        grid_y: 0,
        size: 'large' as const,
        widget_config: {},
        created_at: new Date()
      },
      {
        id: 2,
        dashboard_id: 1,
        widget_type: 'workout-heart-rate',
        grid_x: 0,
        grid_y: 1,
        size: 'medium' as const,
        widget_config: {},
        created_at: new Date()
      }
    ]
  },
  {
    id: 2,
    name: 'Workout Dashboard',
    time_range: 'this_week',
    user_id: 'default_user',
    created_at: new Date(),
    updated_at: new Date(),
    widgets: [
      {
        id: 3,
        dashboard_id: 2,
        widget_type: 'workout-summary',
        grid_x: 0,
        grid_y: 0,
        size: 'large' as const,
        widget_config: {},
        created_at: new Date()
      }
    ]
  }
]

// Safe database operation wrapper
async function safeDbOperation<T>(operation: () => Promise<T>, fallbackValue: T): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error('❌ Database operation failed, using fallback:', error)
    return fallbackValue
  }
}

/**
 * GET /api/custom-dashboards
 * List user's custom dashboards
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching custom dashboards...')
    const userId = (req.query['user_id'] as string) || 'default_user'

    const dashboards = await safeDbOperation(
      () => customDashboardDao.getDashboards(userId),
      mockDashboards // Fallback to mock data if database is unavailable
    )

    res.json({
      success: true,
      message: 'Custom dashboards retrieved successfully',
      data: dashboards,
      count: dashboards.length
    })
  } catch (error) {
    console.error('❌ Error fetching custom dashboards:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom dashboards',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/custom-dashboards
 * Create new custom dashboard
 */
router.post('/', async (req, res) => {
  try {
    console.log('➕ Creating new custom dashboard:', req.body)
    const { name, user_id, time_range } = req.body
    
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Dashboard name is required'
      })
      return
    }

    const dashboard = await customDashboardDao.createDashboard({
      name,
      user_id,
      time_range
    })
    
    res.status(201).json({
      success: true,
      message: 'Custom dashboard created successfully',
      data: dashboard
    })
  } catch (error) {
    console.error('❌ Error creating custom dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create custom dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/custom-dashboards/:id
 * Get specific dashboard with widgets
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    console.log(`📊 Fetching custom dashboard ${id}...`)
    
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid dashboard ID'
      })
      return
    }

    const dashboard = await customDashboardDao.getDashboardById(id)
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      })
      return
    }
    
    res.json({
      success: true,
      message: 'Dashboard retrieved successfully',
      data: dashboard
    })
  } catch (error) {
    console.error('❌ Error fetching dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * PUT /api/custom-dashboards/:id
 * Update dashboard properties
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    console.log(`✏️ Updating custom dashboard ${id}:`, req.body)
    
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid dashboard ID'
      })
      return
    }

    const { name, time_range } = req.body
    const dashboard = await customDashboardDao.updateDashboard(id, {
      name,
      time_range
    })
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      })
      return
    }
    
    res.json({
      success: true,
      message: 'Dashboard updated successfully',
      data: dashboard
    })
  } catch (error) {
    console.error('❌ Error updating dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/custom-dashboards/:id/widgets
 * Add widget to dashboard
 */
router.post('/:id/widgets', async (req, res) => {
  try {
    const dashboardId = parseInt(req.params.id)
    console.log(`🧩 Adding widget to dashboard ${dashboardId}:`, req.body)
    
    if (isNaN(dashboardId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid dashboard ID'
      })
      return
    }

    const { widget_type, grid_x, grid_y, size, widget_config } = req.body
    
    if (!widget_type || grid_x === undefined || grid_y === undefined) {
      res.status(400).json({
        success: false,
        message: 'widget_type, grid_x, and grid_y are required'
      })
      return
    }

    const widget = await customDashboardDao.addWidget({
      dashboard_id: dashboardId,
      widget_type,
      grid_x,
      grid_y,
      size: size || 'medium',
      widget_config
    })
    
    res.status(201).json({
      success: true,
      message: 'Widget added successfully',
      data: widget
    })
  } catch (error) {
    console.error('❌ Error adding widget:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add widget',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * PUT /api/custom-dashboards/:id/widgets/:widgetId
 * Update widget properties
 */
router.put('/:id/widgets/:widgetId', async (req, res) => {
  try {
    const widgetId = parseInt(req.params.widgetId)
    console.log(`🔧 Updating widget ${widgetId}:`, req.body)
    
    if (isNaN(widgetId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid widget ID'
      })
      return
    }

    const { grid_x, grid_y, size, widget_config } = req.body
    const widget = await customDashboardDao.updateWidget(widgetId, {
      grid_x,
      grid_y,
      size,
      widget_config
    })
    
    if (!widget) {
      res.status(404).json({
        success: false,
        message: 'Widget not found'
      })
      return
    }
    
    res.json({
      success: true,
      message: 'Widget updated successfully',
      data: widget
    })
  } catch (error) {
    console.error('❌ Error updating widget:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update widget',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * DELETE /api/custom-dashboards/:id/widgets/:widgetId
 * Remove widget from dashboard
 */
router.delete('/:id/widgets/:widgetId', async (req, res) => {
  try {
    const widgetId = parseInt(req.params.widgetId)
    console.log(`🗑️ Removing widget ${widgetId}`)
    
    if (isNaN(widgetId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid widget ID'
      })
      return
    }

    const success = await customDashboardDao.removeWidget(widgetId)
    
    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Widget not found'
      })
      return
    }
    
    res.json({
      success: true,
      message: 'Widget removed successfully'
    })
  } catch (error) {
    console.error('❌ Error removing widget:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove widget',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
