/**
 * Workout Heart Rate Widget - Issue #9
 * 
 * Displays average heart rate with intensity indicators
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeartPulse, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'
// import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
import { getWorkoutApiUrl } from '../../utils/apiConfig'

interface WorkoutHeartRateData {
  sport: string
  session_start: string
  avg_heart_rate: number | null
  duration_min: number
}

interface WorkoutHeartRateWidgetProps {
  className?: string
}

export const WorkoutHeartRateWidget: React.FC<WorkoutHeartRateWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<WorkoutHeartRateData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch workout heart rate data
  const fetchHeartRateData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get last 30 days of data
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('💓 [Heart Rate Widget] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch heart rate data')
      }

      // Filter sessions with heart rate data
      const sessionsWithHR = result.data.filter((session: WorkoutHeartRateData) => session.avg_heart_rate !== null)
      
      console.log('✅ [Heart Rate Widget] Data fetched:', sessionsWithHR.length, 'sessions with HR data')
      setData(sessionsWithHR)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [Heart Rate Widget] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Register with WebSocket refresh system
  // const { isRefreshing } = useWidgetRefresh('workout-heart-rate', fetchHeartRateData)
  const isRefreshing = false

  // Initial data fetch
  useEffect(() => {
    fetchHeartRateData()
  }, [fetchHeartRateData])

  // Calculate statistics
  const currentHeartRate = data.length > 0 ? data[0]?.avg_heart_rate : null
  const averageHeartRate = data.length > 0 
    ? Math.round(data.reduce((sum, session) => sum + (session.avg_heart_rate || 0), 0) / data.length)
    : null

  // Calculate trend (compare last 3 sessions vs previous 3)
  const getTrend = (): { direction: 'up' | 'down' | 'stable'; change: number } => {
    if (data.length < 6) return { direction: 'stable', change: 0 }
    
    const recent = data.slice(0, 3).reduce((sum, s) => sum + (s.avg_heart_rate || 0), 0) / 3
    const previous = data.slice(3, 6).reduce((sum, s) => sum + (s.avg_heart_rate || 0), 0) / 3
    
    const change = recent - previous
    
    if (Math.abs(change) < 2) return { direction: 'stable', change: 0 }
    return { direction: change > 0 ? 'up' : 'down', change: Math.abs(change) }
  }

  // Get heart rate intensity level
  const getIntensityLevel = (hr: number): { level: string; color: string; description: string } => {
    if (hr < 100) return { level: 'Low', color: '#10b981', description: 'Recovery/Light' }
    if (hr < 130) return { level: 'Moderate', color: '#f59e0b', description: 'Aerobic' }
    if (hr < 160) return { level: 'High', color: '#ef4444', description: 'Anaerobic' }
    return { level: 'Maximum', color: '#dc2626', description: 'VO2 Max' }
  }

  const trend = getTrend()
  const currentIntensity = currentHeartRate ? getIntensityLevel(currentHeartRate) : null

  return (
    <div className={`bg-widget-2 dark:bg-widget-2-dark rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <FontAwesomeIcon icon={faHeartPulse} className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Heart Rate
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Average workout intensity
            </p>
          </div>
        </div>
        
        {/* Refresh indicator */}
        {(loading || isRefreshing) && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && !data.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <FontAwesomeIcon icon={faHeartPulse} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : !currentHeartRate ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faHeartPulse} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No heart rate data</p>
          </div>
        ) : (
          <>
            {/* Current Heart Rate */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {currentHeartRate}
                </span>
                <span className="text-lg text-gray-600 dark:text-gray-400">BPM</span>
              </div>
              
              {/* Intensity Level */}
              {currentIntensity && (
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentIntensity.color }}
                  ></div>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: currentIntensity.color }}
                  >
                    {currentIntensity.level} Intensity
                  </span>
                </div>
              )}
              
              {currentIntensity && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {currentIntensity.description}
                </p>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Average */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">30-Day Average</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {averageHeartRate} <span className="text-sm text-gray-600">BPM</span>
                </p>
              </div>

              {/* Trend */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trend</p>
                <div className="flex items-center justify-center gap-1">
                  {trend.direction === 'up' && (
                    <>
                      <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3 text-red-500" />
                      <span className="text-sm font-semibold text-red-500">+{trend.change.toFixed(0)}</span>
                    </>
                  )}
                  {trend.direction === 'down' && (
                    <>
                      <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3 text-green-500" />
                      <span className="text-sm font-semibold text-green-500">-{trend.change.toFixed(0)}</span>
                    </>
                  )}
                  {trend.direction === 'stable' && (
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Stable</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sessions Count */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sessions analyzed</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {data.length}
                </span>
              </div>
            </div>
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
