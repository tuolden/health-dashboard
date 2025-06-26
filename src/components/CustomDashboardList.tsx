/**
 * Custom Dashboard List Component - Issue #15
 * 
 * Lists all custom dashboards and provides navigation to create/edit them
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faChartLine, faCalendar, faClock } from '@fortawesome/free-solid-svg-icons'
import StickyHeader from './StickyHeader'

interface CustomDashboard {
  id: number
  name: string
  user_id: string
  time_range: string
  created_at: string
  updated_at: string
}

interface ApiResponse {
  success: boolean
  message: string
  data: CustomDashboard[]
  count: number
}

/**
 * Custom Dashboard List Component
 * Shows all user's custom dashboards with create new functionality
 */
const CustomDashboardList: React.FC = () => {
  console.log('📋 [CustomDashboardList] Component rendering...')

  const [dashboards, setDashboards] = useState<CustomDashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newDashboardName, setNewDashboardName] = useState('')

  // Fetch custom dashboards
  const fetchDashboards = async () => {
    try {
      console.log('📋 [CustomDashboardList] Fetching custom dashboards...')
      setLoading(true)
      setError(null)

      const response = await fetch('/api/custom-dashboards')
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboards')
      }

      console.log('📋 [CustomDashboardList] Dashboards loaded:', data.data.length)
      setDashboards(data.data)
    } catch (err) {
      console.error('❌ [CustomDashboardList] Error fetching dashboards:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboards')
    } finally {
      setLoading(false)
    }
  }

  // Create new dashboard
  const createDashboard = async () => {
    if (!newDashboardName.trim()) {
      setError('Dashboard name is required')
      return
    }

    try {
      console.log('➕ [CustomDashboardList] Creating dashboard:', newDashboardName)
      setCreating(true)
      setError(null)

      const response = await fetch('/api/custom-dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newDashboardName.trim(),
          time_range: 'last_month'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create dashboard')
      }

      console.log('✅ [CustomDashboardList] Dashboard created:', data.data)
      setNewDashboardName('')
      await fetchDashboards() // Refresh list
    } catch (err) {
      console.error('❌ [CustomDashboardList] Error creating dashboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to create dashboard')
    } finally {
      setCreating(false)
    }
  }

  // Load dashboards on mount
  useEffect(() => {
    fetchDashboards()
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get time range display text
  const getTimeRangeText = (timeRange: string) => {
    const timeRangeMap: Record<string, string> = {
      'today': 'Today',
      'yesterday': 'Yesterday',
      'this_week': 'This Week',
      'last_2_weeks': 'Last 2 Weeks',
      'last_month': 'Last Month',
      'mom': 'Month over Month',
      'last_year': 'Last Year'
    }
    return timeRangeMap[timeRange] || timeRange
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Custom Dashboards
          </h1>
          <p className="text-gray-600">
            Create personalized widget layouts with your favorite health metrics
          </p>
        </div>

        {/* Create New Dashboard */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New Dashboard
          </h2>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              placeholder="Enter dashboard name (e.g., 'My Bloodwork', 'CPAP Stats')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={creating}
              onKeyPress={(e) => e.key === 'Enter' && createDashboard()}
            />
            <button
              onClick={createDashboard}
              disabled={creating || !newDashboardName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading dashboards...</p>
          </div>
        )}

        {/* Dashboard List */}
        {!loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboards.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FontAwesomeIcon icon={faChartLine} className="text-4xl text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Custom Dashboards Yet
                </h3>
                <p className="text-gray-600">
                  Create your first custom dashboard to get started
                </p>
              </div>
            ) : (
              dashboards.map((dashboard) => (
                <Link
                  key={dashboard.id}
                  to={`/custom-dashboards/${dashboard.id}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {dashboard.name}
                    </h3>
                    <FontAwesomeIcon icon={faChartLine} className="text-blue-600 text-xl" />
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                      <span>Time Range: {getTimeRangeText(dashboard.time_range)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                      <span>Created: {formatDate(dashboard.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-blue-600 text-sm font-medium">
                      Open Dashboard →
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Back to Main Dashboard */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            ← Back to Main Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CustomDashboardList
