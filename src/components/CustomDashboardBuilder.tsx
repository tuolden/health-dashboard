/**
 * Custom Dashboard Builder Component - Issue #15
 * 
 * Main builder interface for creating and editing custom widget layouts
 */

import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faEye, faSun, faMoon, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

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

  // Update dashboard time range
  const updateTimeRange = async (newTimeRange: string) => {
    if (!dashboard) return

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
        throw new Error(data.message || 'Failed to update time range')
      }

      setDashboard({ ...dashboard, time_range: newTimeRange })
      console.log('✅ [CustomDashboardBuilder] Time range updated')
    } catch (err) {
      console.error('❌ [CustomDashboardBuilder] Error updating time range:', err)
      setError(err instanceof Error ? err.message : 'Failed to update time range')
    }
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark', !darkMode)
  }

  // Load dashboard on mount
  useEffect(() => {
    fetchDashboard()
  }, [id])

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
        {/* Grid Layout Area */}
        <div className={`rounded-lg border ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        } p-6`}>
          {editMode ? (
            <div className="text-center py-12">
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Edit Mode Active
              </h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Grid layout and widget management will be implemented in Phase 2
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                View Mode
              </h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Widget display will be implemented in Phase 2
              </p>
              {dashboard.widgets && dashboard.widgets.length > 0 && (
                <div className="mt-4">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {dashboard.widgets.length} widget(s) configured
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomDashboardBuilder
