/**
 * Workout Fat Burn vs Cardio Ratio Widget - Issue #9
 * 
 * Pie chart visualization of fat burn vs cardio training distribution
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartPie, faFire, faHeartPulse } from '@fortawesome/free-solid-svg-icons'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
// import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
import { getWorkoutApiUrl } from '../../utils/apiConfig'

interface WorkoutSessionData {
  sport: string
  session_start: string
  fat_burn_ratio: number | null
  cardio_ratio: number | null
  duration_min: number
  calories_burned: number | null
}

interface RatioChartData {
  name: string
  value: number
  color: string
  icon: any
}

interface WorkoutFatBurnRatioWidgetProps {
  className?: string
}

export const WorkoutFatBurnRatioWidget: React.FC<WorkoutFatBurnRatioWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<WorkoutSessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')

  // Fetch workout ratio data
  const fetchRatioData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get data based on selected time range
      const days = timeRange === 'week' ? 7 : 30
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('🥧 [Fat Burn Ratio Widget] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch ratio data')
      }

      // Filter sessions with ratio data
      const sessionsWithRatios = result.data.filter((session: WorkoutSessionData) => 
        session.fat_burn_ratio !== null && session.cardio_ratio !== null
      )
      
      console.log('✅ [Fat Burn Ratio Widget] Data fetched:', sessionsWithRatios.length, 'sessions with ratios')
      setData(sessionsWithRatios)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [Fat Burn Ratio Widget] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  // Register with WebSocket refresh system
  // const { isRefreshing } = useWidgetRefresh('workout-fat-burn-ratio', fetchRatioData)
  const isRefreshing = false

  // Initial data fetch
  useEffect(() => {
    fetchRatioData()
  }, [fetchRatioData])

  // Calculate weighted average ratios
  const getAverageRatios = (): { fatBurn: number; cardio: number } => {
    if (data.length === 0) return { fatBurn: 0, cardio: 0 }

    // Weight by duration for more accurate representation
    const totalDuration = data.reduce((sum, session) => sum + session.duration_min, 0)
    
    if (totalDuration === 0) return { fatBurn: 0, cardio: 0 }

    const weightedFatBurn = data.reduce((sum, session) => 
      sum + (session.fat_burn_ratio || 0) * session.duration_min, 0
    ) / totalDuration

    const weightedCardio = data.reduce((sum, session) => 
      sum + (session.cardio_ratio || 0) * session.duration_min, 0
    ) / totalDuration

    return { fatBurn: weightedFatBurn, cardio: weightedCardio }
  }

  const averageRatios = getAverageRatios()

  // Prepare chart data
  const chartData: RatioChartData[] = [
    {
      name: 'Fat Burn',
      value: Math.round(averageRatios.fatBurn * 100),
      color: '#10b981',
      icon: faFire
    },
    {
      name: 'Cardio',
      value: Math.round(averageRatios.cardio * 100),
      color: '#ef4444',
      icon: faHeartPulse
    }
  ]

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.name} Zone</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Percentage: <span className="font-semibold" style={{ color: data.color }}>{data.value}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Get training recommendation
  const getRecommendation = (): { text: string; color: string } => {
    const fatBurnPercent = averageRatios.fatBurn * 100
    const cardioPercent = averageRatios.cardio * 100

    if (fatBurnPercent > 70) {
      return { 
        text: 'Great for endurance and fat burning! Consider adding some high-intensity intervals.',
        color: '#10b981'
      }
    } else if (cardioPercent > 70) {
      return { 
        text: 'High cardio intensity! Balance with more aerobic base training.',
        color: '#ef4444'
      }
    } else if (Math.abs(fatBurnPercent - cardioPercent) < 20) {
      return { 
        text: 'Well-balanced training across fat burn and cardio zones.',
        color: '#3b82f6'
      }
    } else {
      return { 
        text: 'Consider balancing your training intensity distribution.',
        color: '#f59e0b'
      }
    }
  }

  const recommendation = getRecommendation()
  const totalCalories = data.reduce((sum, session) => sum + (session.calories_burned || 0), 0)

  return (
    <div className={`bg-widget-2 dark:bg-widget-2-dark rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <FontAwesomeIcon icon={faChartPie} className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Fat Burn vs Cardio
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Training zone distribution
            </p>
          </div>
        </div>
        
        {/* Time Range Filter */}
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month')}
            className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          {/* Refresh indicator */}
          {(loading || isRefreshing) && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && !data.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-green-500 mb-2">
              <FontAwesomeIcon icon={faChartPie} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faChartPie} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No ratio data available</p>
          </div>
        ) : (
          <>
            {/* Pie Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Ratio Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {chartData.map((item) => (
                <div key={item.name} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FontAwesomeIcon 
                      icon={item.icon} 
                      className="w-4 h-4"
                      style={{ color: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.value}%
                  </p>
                </div>
              ))}
            </div>

            {/* Training Recommendation */}
            <div 
              className="rounded-lg p-3"
              style={{ backgroundColor: `${recommendation.color}20` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FontAwesomeIcon
                  icon={faChartPie}
                  className="w-4 h-4"
                  style={{ color: recommendation.color }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: recommendation.color }}
                >
                  Training Insight
                </span>
              </div>
              <p 
                className="text-xs"
                style={{ color: recommendation.color }}
              >
                {recommendation.text}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Sessions</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{data.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Time</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {data.reduce((sum, s) => sum + s.duration_min, 0)}m
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Calories</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{totalCalories}</p>
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
