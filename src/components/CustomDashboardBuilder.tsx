/**
 * Custom Dashboard Builder Component - Issue #15
 * 
 * Main builder interface for creating and editing custom widget layouts
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faEye, faSun, faMoon, faClock, faArrowLeft, faQuestionCircle, faKeyboard } from '@fortawesome/free-solid-svg-icons'
import GridLayout from './GridLayout'
import WidgetPicker from './WidgetPicker'

interface CustomDashboard {
  id: number
  name: string
  user_id: string
  time_range: string
  created_at: string
  updated_at: string
  widgets?: CustomDashboardWidget[]
}

interface CustomDashboardWidget {
  id: number
  dashboard_id: number
  widget_type: string
  grid_x: number
  grid_y: number
  size: 'small' | 'medium' | 'large'
  widget_config: Record<string, any>
  created_at: string
}

/**
 * Custom Dashboard Builder Component
 * Provides grid-based widget layout editing with edit/view modes
 */
const CustomDashboardBuilder: React.FC = () => {
  console.log('🏗️ [CustomDashboardBuilder] Component rendering...')

  const { id } = useParams<{ id: string }>()
  const [dashboard, setDashboard] = useState<CustomDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showWidgetPicker, setShowWidgetPicker] = useState(false)
  const [selectedGridPosition, setSelectedGridPosition] = useState<{ x: number, y: number } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Time range options
  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_2_weeks', label: 'Last 2 Weeks' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'mom', label: 'Month over Month' },
    { value: 'last_year', label: 'Last Year' }
  ]

  // Fetch dashboard data
  const fetchDashboard = async () => {
    if (!id) return

    try {
      console.log('🏗️ [CustomDashboardBuilder] Fetching dashboard:', id)
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/custom-dashboards/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard')
      }

      console.log('🏗️ [CustomDashboardBuilder] Dashboard loaded:', data.data)
      setDashboard(data.data)
    } catch (err) {
      console.error('❌ [CustomDashboardBuilder] Error fetching dashboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Update dashboard time range (memoized for performance)
  const updateTimeRange = useCallback(async (newTimeRange: string) => {
    if (!dashboard || isUpdating) return

    // Optimistic update
    const originalTimeRange = dashboard.time_range
    setDashboard({ ...dashboard, time_range: newTimeRange })
    setIsUpdating(true)

    try {
      console.log('🕒 [CustomDashboardBuilder] Updating time range:', newTimeRange)

      const response = await fetch(`/api/custom-dashboards/${dashboard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          time_range: newTimeRange
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Revert optimistic update
        setDashboard({ ...dashboard, time_range: originalTimeRange })
        throw new Error(data.message || 'Failed to update time range')
      }

      console.log('✅ [CustomDashboardBuilder] Time range updated')
    } catch (err) {
      console.error('❌ [CustomDashboardBuilder] Error updating time range:', err)
      setError(err instanceof Error ? err.message : 'Failed to update time range')
    } finally {
      setIsUpdating(false)
    }
  }, [dashboard, isUpdating])

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark', !darkMode)
  }

  // Handle adding widget to grid (memoized for performance)
  const handleAddWidget = useCallback((gridX: number, gridY: number) => {
    console.log('🧩 [CustomDashboardBuilder] Adding widget at:', gridX, gridY)
    setSelectedGridPosition({ x: gridX, y: gridY })
    setShowWidgetPicker(true)
  }, [])

  // Handle widget selection from picker
  const handleSelectWidget = async (widgetType: string, size: 'small' | 'medium' | 'large') => {
    if (!dashboard || !selectedGridPosition) return

    try {
      console.log('🧩 [CustomDashboardBuilder] Creating widget:', widgetType, size, selectedGridPosition)

      const response = await fetch(`/api/custom-dashboards/${dashboard.id}/widgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          widget_type: widgetType,
          grid_x: selectedGridPosition.x,
          grid_y: selectedGridPosition.y,
          size: size,
          widget_config: {}
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add widget')
      }

      console.log('✅ [CustomDashboardBuilder] Widget added:', data.data)
      await fetchDashboard() // Refresh dashboard
      setSelectedGridPosition(null)
    } catch (err) {
      console.error('❌ [CustomDashboardBuilder] Error adding widget:', err)
      setError(err instanceof Error ? err.message : 'Failed to add widget')
    }
  }

  // Handle removing widget (memoized for performance)
  const handleRemoveWidget = useCallback(async (widgetId: number) => {
    if (!dashboard) return

    // Optimistic update - remove widget from UI immediately
    const originalWidgets = dashboard.widgets || []
    const updatedWidgets = originalWidgets.filter(w => w.id !== widgetId)
    setDashboard({ ...dashboard, widgets: updatedWidgets })

    try {
      console.log('🗑️ [CustomDashboardBuilder] Removing widget:', widgetId)

      const response = await fetch(`/api/custom-dashboards/${dashboard.id}/widgets/${widgetId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        // Revert optimistic update on error
        setDashboard({ ...dashboard, widgets: originalWidgets })
        throw new Error(data.message || 'Failed to remove widget')
      }

      console.log('✅ [CustomDashboardBuilder] Widget removed')
    } catch (err) {
      console.error('❌ [CustomDashboardBuilder] Error removing widget:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove widget')
      // Dashboard already reverted in the error case above
    }
  }, [dashboard])

  // Handle resizing widget
  const handleResizeWidget = async (widgetId: number, newSize: 'small' | 'medium' | 'large') => {
    if (!dashboard) return

    try {
      console.log('📏 [CustomDashboardBuilder] Resizing widget:', widgetId, newSize)

      const response = await fetch(`/api/custom-dashboards/${dashboard.id}/widgets/${widgetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          size: newSize
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resize widget')
      }

      console.log('✅ [CustomDashboardBuilder] Widget resized')
      await fetchDashboard() // Refresh dashboard
    } catch (err) {
      console.error('❌ [CustomDashboardBuilder] Error resizing widget:', err)
      setError(err instanceof Error ? err.message : 'Failed to resize widget')
    }
  }

  // Handle moving widget (placeholder for future drag & drop)
  const handleMoveWidget = async (widgetId: number, newX: number, newY: number) => {
    if (!dashboard) return

    try {
      console.log('📍 [CustomDashboardBuilder] Moving widget:', widgetId, newX, newY)

      const response = await fetch(`/api/custom-dashboards/${dashboard.id}/widgets/${widgetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grid_x: newX,
          grid_y: newY
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to move widget')
      }

      console.log('✅ [CustomDashboardBuilder] Widget moved')
      await fetchDashboard() // Refresh dashboard
    } catch (err) {
      console.error('❌ [CustomDashboardBuilder] Error moving widget:', err)
      setError(err instanceof Error ? err.message : 'Failed to move widget')
    }
  }

  // Load dashboard on mount
  useEffect(() => {
    fetchDashboard()
  }, [id])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
        return
      }

      switch (event.key) {
        case 'e':
        case 'E':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setEditMode(!editMode)
          }
          break
        case 'd':
        case 'D':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            toggleDarkMode()
          }
          break
        case 'Escape':
          if (showWidgetPicker) {
            setShowWidgetPicker(false)
            setSelectedGridPosition(null)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [editMode, showWidgetPicker, toggleDarkMode])

  // Memoize widget count for performance
  const widgetCount = useMemo(() => {
    return dashboard?.widgets?.length || 0
  }, [dashboard?.widgets])

  // Memoize time range display
  const timeRangeDisplay = useMemo(() => {
    const timeRangeMap: Record<string, string> = {
      'today': 'Today',
      'yesterday': 'Yesterday',
      'this_week': 'This Week',
      'last_2_weeks': 'Last 2 Weeks',
      'last_month': 'Last Month',
      'mom': 'Month over Month',
      'last_year': 'Last Year'
    }
    return timeRangeMap[dashboard?.time_range || 'last_month'] || dashboard?.time_range || 'Last Month'
  }, [dashboard?.time_range])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Dashboard not found'}
          </h2>
          <Link
            to="/custom-dashboards"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Custom Dashboards
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <Link
                to="/custom-dashboards"
                className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-600'}`}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {dashboard.name}
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Custom Dashboard Builder
                </p>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                <select
                  value={dashboard.time_range}
                  onChange={(e) => updateTimeRange(e.target.value)}
                  className={`px-3 py-1 rounded border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {timeRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dark/Light Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
              </button>

              {/* Help Button */}
              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`p-2 rounded-lg ${
                  showHelp
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Show keyboard shortcuts and help"
              >
                <FontAwesomeIcon icon={faQuestionCircle} />
              </button>

              {/* Edit/View Mode Toggle */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  editMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={`Switch to ${editMode ? 'view' : 'edit'} mode (Ctrl+E)`}
              >
                <FontAwesomeIcon icon={editMode ? faEye : faEdit} />
                {editMode ? 'View Mode' : 'Edit Mode'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className={`mb-6 rounded-lg p-4 border ${
            darkMode
              ? 'bg-red-900 border-red-700 text-red-200'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className={`mt-2 text-sm hover:underline ${
                darkMode ? 'text-red-300 hover:text-red-100' : 'text-red-600 hover:text-red-800'
              }`}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Statistics */}
        {!loading && dashboard && (
          <div className={`mb-6 rounded-lg p-4 border ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {widgetCount}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Widget{widgetCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {timeRangeDisplay}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Time Range
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {editMode ? 'Edit' : 'View'}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Mode
                  </div>
                </div>
              </div>

              {isUpdating && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Updating...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Panel */}
        {showHelp && (
          <div className={`mb-6 rounded-lg p-6 border ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-blue-50'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faKeyboard} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Keyboard Shortcuts & Help
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Keyboard Shortcuts
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Toggle Edit/View Mode:</span>
                    <code className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>
                      Ctrl+E
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Toggle Dark Mode:</span>
                    <code className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>
                      Ctrl+D
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Close Modal:</span>
                    <code className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>
                      Escape
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <h4 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  How to Use
                </h4>
                <div className="space-y-2 text-sm">
                  <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    • <strong>Edit Mode:</strong> Click + buttons to add widgets
                  </div>
                  <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    • <strong>Widget Sizes:</strong> Small (1×1), Medium (2×1), Large (4×1)
                  </div>
                  <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    • <strong>Time Range:</strong> Affects all widgets on the page
                  </div>
                  <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    • <strong>View Mode:</strong> Clean widget display
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                💡 <strong>Tip:</strong> Changes are saved automatically. Use the time range selector to view different data periods across all widgets.
              </p>
            </div>
          </div>
        )}

        {/* Grid Layout Area */}
        <div className={`rounded-lg border ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        } overflow-hidden`}>
          <GridLayout
            widgets={dashboard.widgets || []}
            editMode={editMode}
            timeRange={dashboard.time_range}
            onAddWidget={handleAddWidget}
            onRemoveWidget={handleRemoveWidget}
            onResizeWidget={handleResizeWidget}
            onMoveWidget={handleMoveWidget}
            darkMode={darkMode}
          />
        </div>

        {/* Widget Picker Modal */}
        <WidgetPicker
          isOpen={showWidgetPicker}
          onClose={() => {
            setShowWidgetPicker(false)
            setSelectedGridPosition(null)
          }}
          onSelectWidget={handleSelectWidget}
          darkMode={darkMode}
        />
      </div>
    </div>
  )
}

export default CustomDashboardBuilder
