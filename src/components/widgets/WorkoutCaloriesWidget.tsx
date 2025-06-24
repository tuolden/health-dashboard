/**
 * Workout Calories Widget - Issue #9
 * 
 * Displays calories burned with nutrition context and goals
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFire, faBullseye, faCalendar } from '@fortawesome/free-solid-svg-icons'
// import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
import { getWorkoutApiUrl } from '../../utils/apiConfig'

interface WorkoutCaloriesData {
  sport: string
  session_start: string
  calories_burned: number | null
  duration_min: number
}

interface WorkoutCaloriesWidgetProps {
  className?: string
}

export const WorkoutCaloriesWidget: React.FC<WorkoutCaloriesWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<WorkoutCaloriesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch workout calories data
  const fetchCaloriesData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get last 7 days of data
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('🔥 [Calories Widget] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch calories data')
      }

      // Filter sessions with calories data
      const sessionsWithCalories = result.data.filter((session: WorkoutCaloriesData) => session.calories_burned !== null)
      
      console.log('✅ [Calories Widget] Data fetched:', sessionsWithCalories.length, 'sessions with calories')
      setData(sessionsWithCalories)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [Calories Widget] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Register with WebSocket refresh system
  // const { isRefreshing } = useWidgetRefresh('workout-calories', fetchCaloriesData)
  const isRefreshing = false

  // Initial data fetch
  useEffect(() => {
    fetchCaloriesData()
  }, [fetchCaloriesData])

  // Calculate statistics
  const latestCalories = data.length > 0 ? data[0]?.calories_burned : null
  const totalWeeklyCalories = data.reduce((sum, session) => sum + (session.calories_burned || 0), 0)
  const averagePerSession = data.length > 0 ? Math.round(totalWeeklyCalories / data.length) : 0
  const dailyAverage = Math.round(totalWeeklyCalories / 7)

  // Weekly goal (example: 2000 calories per week)
  const weeklyGoal = 2000
  const goalProgress = Math.min((totalWeeklyCalories / weeklyGoal) * 100, 100)

  // Get calories level
  const getCaloriesLevel = (calories: number): { level: string; color: string } => {
    if (calories < 200) return { level: 'Light', color: '#10b981' }
    if (calories < 400) return { level: 'Moderate', color: '#f59e0b' }
    if (calories < 600) return { level: 'High', color: '#ef4444' }
    return { level: 'Intense', color: '#dc2626' }
  }

  const latestLevel = latestCalories ? getCaloriesLevel(latestCalories) : null

  return (
    <div className={`bg-widget-2 dark:bg-widget-2-dark rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <FontAwesomeIcon icon={faFire} className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Calories Burned
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Workout energy expenditure
            </p>
          </div>
        </div>
        
        {/* Refresh indicator */}
        {(loading || isRefreshing) && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && !data.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-orange-500 mb-2">
              <FontAwesomeIcon icon={faFire} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400">{error}</p>
          </div>
        ) : !latestCalories ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faFire} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No calories data</p>
          </div>
        ) : (
          <>
            {/* Latest Session Calories */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {latestCalories}
                </span>
                <span className="text-lg text-gray-600 dark:text-gray-400">cal</span>
              </div>
              
              {/* Intensity Level */}
              {latestLevel && (
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: latestLevel.color }}
                  ></div>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: latestLevel.color }}
                  >
                    {latestLevel.level} Session
                  </span>
                </div>
              )}
            </div>

            {/* Weekly Progress */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faBullseye} className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Weekly Goal
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {totalWeeklyCalories} / {weeklyGoal} cal
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goalProgress}%` }}
                ></div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {goalProgress.toFixed(0)}% of weekly goal
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Average per Session */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg/Session</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {averagePerSession} <span className="text-sm text-gray-600">cal</span>
                </p>
              </div>

              {/* Daily Average */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Avg</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {dailyAverage} <span className="text-sm text-gray-600">cal</span>
                </p>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  This Week
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Sessions:</span>
                  <span className="ml-1 font-semibold text-gray-900 dark:text-gray-100">
                    {data.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total:</span>
                  <span className="ml-1 font-semibold text-gray-900 dark:text-gray-100">
                    {totalWeeklyCalories} cal
                  </span>
                </div>
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
