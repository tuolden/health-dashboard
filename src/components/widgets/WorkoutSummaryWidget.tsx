/**
 * Workout Summary Widget - Issue #9
 * 
 * Displays session metadata including sport, duration, and timing
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPersonRunning, faStopwatch, faCalendar, faDumbbell } from '@fortawesome/free-solid-svg-icons'
// import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
import { getWorkoutApiUrl } from '../../utils/apiConfig'

interface WorkoutSummaryData {
  sport: string
  session_start: string
  session_end: string
  duration_min: number
  avg_heart_rate: number | null
  calories_burned: number | null
}

interface WorkoutSummaryWidgetProps {
  className?: string
}

export const WorkoutSummaryWidget: React.FC<WorkoutSummaryWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<WorkoutSummaryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch workout summary data
  const fetchWorkoutSummary = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get last 7 days of data
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('🏃 [Workout Summary] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}&limit=5`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch workout data')
      }

      console.log('✅ [Workout Summary] Data fetched:', result.data.length, 'sessions')
      setData(result.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [Workout Summary] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Register with WebSocket refresh system
  // const { isRefreshing } = useWidgetRefresh('workout-summary', fetchWorkoutSummary)
  const isRefreshing = false

  // Initial data fetch
  useEffect(() => {
    fetchWorkoutSummary()
  }, [fetchWorkoutSummary])

  // Get the most recent session
  const latestSession = data.length > 0 ? data[0] : null

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Format date/time
  const formatDateTime = (isoString: string): { date: string; time: string } => {
    const date = new Date(isoString)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Get sport icon
  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'soccer':
      case 'football':
        return faPersonRunning
      case 'gym':
      case 'weight training':
        return faDumbbell
      default:
        return faPersonRunning
    }
  }

  // Get sport color
  const getSportColor = (sport: string): string => {
    switch (sport.toLowerCase()) {
      case 'soccer':
      case 'football':
        return '#10b981' // green
      case 'gym':
      case 'weight training':
        return '#6366f1' // indigo
      default:
        return '#3b82f6' // blue
    }
  }

  return (
    <div className={`bg-widget-2 dark:bg-widget-2-dark rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FontAwesomeIcon icon={faPersonRunning} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Latest Workout
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Last 7 days
            </p>
          </div>
        </div>
        
        {/* Refresh indicator */}
        {(loading || isRefreshing) && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && !data.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <FontAwesomeIcon icon={faPersonRunning} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : !latestSession ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faPersonRunning} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No recent workouts</p>
          </div>
        ) : (
          <>
            {/* Latest Session Card */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              {/* Sport Badge */}
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${getSportColor(latestSession.sport)}20` }}
                >
                  <FontAwesomeIcon 
                    icon={getSportIcon(latestSession.sport)} 
                    className="w-4 h-4"
                    style={{ color: getSportColor(latestSession.sport) }}
                  />
                </div>
                <span 
                  className="text-sm font-semibold"
                  style={{ color: getSportColor(latestSession.sport) }}
                >
                  {latestSession.sport}
                </span>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-2 gap-4">
                {/* Duration */}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faStopwatch} className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDuration(latestSession.duration_min)}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDateTime(latestSession.session_start).date}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Range */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Session Time</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {formatDateTime(latestSession.session_start).time} - {formatDateTime(latestSession.session_end).time}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            {data.length > 1 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">This Week</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {data.length} session{data.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {data.reduce((total, session) => total + session.duration_min, 0)} min total
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  )
}
