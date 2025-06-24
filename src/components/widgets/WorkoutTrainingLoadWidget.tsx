/**
 * Workout Training Load (TRIMP Score) Widget - Issue #9
 * 
 * Displays TRIMP score calculations and cumulative load tracking over time
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWeightHanging, faTrendUp, faExclamationTriangle, faChartLine } from '@fortawesome/free-solid-svg-icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts'
import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
import { getWorkoutApiUrl } from '../../utils/apiConfig'

interface WorkoutSessionData {
  sport: string
  session_start: string
  trimp_score: number | null
  duration_min: number
  avg_heart_rate: number | null
}

interface TrainingLoadData {
  date: string
  daily_trimp: number
  cumulative_load: number
  displayDate: string
  rolling_7day: number
}

interface WorkoutTrainingLoadWidgetProps {
  className?: string
}

export const WorkoutTrainingLoadWidget: React.FC<WorkoutTrainingLoadWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<WorkoutSessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'daily' | 'cumulative'>('daily')

  // Fetch workout training load data
  const fetchTrainingLoadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get last 30 days of data for better trend analysis
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('🏋️ [Training Load Widget] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch training load data')
      }

      // Filter sessions with TRIMP scores
      const sessionsWithTrimp = result.data.filter((session: WorkoutSessionData) => 
        session.trimp_score !== null
      )
      
      console.log('✅ [Training Load Widget] Data fetched:', sessionsWithTrimp.length, 'sessions with TRIMP')
      setData(sessionsWithTrimp)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [Training Load Widget] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Register with WebSocket refresh system
  const { isRefreshing } = useWidgetRefresh('workout-training-load', fetchTrainingLoadData)

  // Initial data fetch
  useEffect(() => {
    fetchTrainingLoadData()
  }, [fetchTrainingLoadData])

  // Process data for chart visualization
  const getTrainingLoadData = (): TrainingLoadData[] => {
    if (data.length === 0) return []

    // Group sessions by date and calculate daily TRIMP
    const dailyTrimp: Record<string, number> = {}
    
    data.forEach(session => {
      const date = session.session_start.split('T')[0]!
      if (!dailyTrimp[date]) {
        dailyTrimp[date] = 0
      }
      dailyTrimp[date] += session.trimp_score || 0
    })

    // Generate date range for last 14 days
    const chartData: TrainingLoadData[] = []
    let cumulativeLoad = 0
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]!
      
      const dailyScore = dailyTrimp[dateStr] || 0
      cumulativeLoad += dailyScore
      
      // Calculate 7-day rolling average
      const rolling7DayStart = new Date(date)
      rolling7DayStart.setDate(rolling7DayStart.getDate() - 6)
      
      let rolling7DayTotal = 0
      for (let j = 0; j < 7; j++) {
        const rollingDate = new Date(rolling7DayStart)
        rollingDate.setDate(rollingDate.getDate() + j)
        const rollingDateStr = rollingDate.toISOString().split('T')[0]!
        rolling7DayTotal += dailyTrimp[rollingDateStr] || 0
      }
      
      chartData.push({
        date: dateStr,
        daily_trimp: dailyScore,
        cumulative_load: cumulativeLoad,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rolling_7day: Math.round(rolling7DayTotal / 7)
      })
    }

    return chartData
  }

  const chartData = getTrainingLoadData()
  const latestTrimp = data.length > 0 ? data[0]?.trimp_score : null
  const weeklyLoad = chartData.slice(-7).reduce((sum, day) => sum + day.daily_trimp, 0)
  const previousWeekLoad = chartData.slice(-14, -7).reduce((sum, day) => sum + day.daily_trimp, 0)

  // Calculate load trend
  const getLoadTrend = (): { direction: 'up' | 'down' | 'stable'; change: number; percentage: number } => {
    if (previousWeekLoad === 0) return { direction: 'stable', change: 0, percentage: 0 }
    
    const change = weeklyLoad - previousWeekLoad
    const percentage = Math.abs((change / previousWeekLoad) * 100)
    
    if (Math.abs(change) < 50) return { direction: 'stable', change: 0, percentage: 0 }
    return { 
      direction: change > 0 ? 'up' : 'down', 
      change: Math.abs(change), 
      percentage: Math.round(percentage) 
    }
  }

  // Get load level assessment
  const getLoadLevel = (weeklyLoad: number): { level: string; color: string; description: string } => {
    if (weeklyLoad < 500) return { level: 'Light', color: '#10b981', description: 'Low training stress' }
    if (weeklyLoad < 1000) return { level: 'Moderate', color: '#3b82f6', description: 'Balanced training load' }
    if (weeklyLoad < 1500) return { level: 'High', color: '#f59e0b', description: 'Challenging training week' }
    return { level: 'Very High', color: '#ef4444', description: 'Risk of overtraining' }
  }

  const trend = getLoadTrend()
  const loadLevel = getLoadLevel(weeklyLoad)

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.displayDate}</p>
          {viewMode === 'daily' ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Daily TRIMP: <span className="font-semibold text-blue-600">{data.daily_trimp}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                7-Day Avg: <span className="font-semibold text-green-600">{data.rolling_7day}</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cumulative: <span className="font-semibold text-purple-600">{data.cumulative_load}</span>
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`bg-widget-2 dark:bg-widget-2-dark rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <FontAwesomeIcon icon={faWeightHanging} className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Training Load
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              TRIMP score analysis
            </p>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'daily' | 'cumulative')}
            className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
          >
            <option value="daily">Daily Load</option>
            <option value="cumulative">Cumulative</option>
          </select>
          
          {/* Refresh indicator */}
          {(loading || isRefreshing) && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && !data.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-purple-500 mb-2">
              <FontAwesomeIcon icon={faWeightHanging} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">{error}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faWeightHanging} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No training load data</p>
          </div>
        ) : (
          <>
            {/* Current Week Load */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {weeklyLoad}
                </span>
                <span className="text-lg text-gray-600 dark:text-gray-400">TRIMP</span>
              </div>
              
              {/* Load Level */}
              <div className="flex items-center justify-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: loadLevel.color }}
                ></div>
                <span 
                  className="text-sm font-medium"
                  style={{ color: loadLevel.color }}
                >
                  {loadLevel.level} Load
                </span>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {loadLevel.description}
              </p>
            </div>

            {/* Training Load Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'daily' ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#6b7280"
                      fontSize={10}
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={10}
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Reference line for moderate load */}
                    <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.5} />
                    
                    <Line 
                      type="monotone" 
                      dataKey="daily_trimp" 
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                      name="Daily TRIMP"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rolling_7day" 
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="7-Day Average"
                    />
                  </LineChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#6b7280"
                      fontSize={10}
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={10}
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Area 
                      type="monotone" 
                      dataKey="cumulative_load" 
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Weekly Trend */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weekly Trend</p>
                <div className="flex items-center justify-center gap-1">
                  {trend.direction === 'up' && (
                    <>
                      <FontAwesomeIcon icon={faTrendUp} className="w-3 h-3 text-red-500" />
                      <span className="text-sm font-semibold text-red-500">+{trend.percentage}%</span>
                    </>
                  )}
                  {trend.direction === 'down' && (
                    <>
                      <FontAwesomeIcon icon={faTrendUp} className="w-3 h-3 text-green-500 transform rotate-180" />
                      <span className="text-sm font-semibold text-green-500">-{trend.percentage}%</span>
                    </>
                  )}
                  {trend.direction === 'stable' && (
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Stable</span>
                  )}
                </div>
              </div>

              {/* Latest Session */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Latest Session</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {latestTrimp || 0}
                </p>
              </div>
            </div>

            {/* Load Assessment */}
            <div 
              className="rounded-lg p-3"
              style={{ backgroundColor: `${loadLevel.color}20` }}
            >
              <div className="flex items-center gap-2 mb-1">
                {weeklyLoad > 1500 && (
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-red-600" />
                )}
                <FontAwesomeIcon 
                  icon={faChartLine} 
                  className="w-4 h-4"
                  style={{ color: loadLevel.color }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: loadLevel.color }}
                >
                  Load Assessment
                </span>
              </div>
              <p 
                className="text-xs"
                style={{ color: loadLevel.color }}
              >
                {weeklyLoad > 1500
                  ? 'Very high training load detected. Consider reducing intensity or adding rest days.'
                  : weeklyLoad > 1000
                  ? 'High training load. Monitor recovery and ensure adequate rest.'
                  : weeklyLoad > 500
                  ? 'Good training load. Maintain consistency for optimal adaptation.'
                  : 'Light training week. Consider gradually increasing load if feeling recovered.'
                }
              </p>
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
