/**
 * Workout Heart Rate Zones Widget - Issue #9
 * 
 * Bar chart visualization of time spent in different heart rate zones
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faHeartPulse } from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
// import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
import { getWorkoutApiUrl } from '../../utils/apiConfig'

interface ZoneBreakdown {
  Z1: number
  Z2: number
  Z3: number
  Z4: number
  Z5: number
}

interface WorkoutSessionData {
  sport: string
  session_start: string
  zones: ZoneBreakdown
  duration_min: number
}

interface ZoneChartData {
  zone: string
  minutes: number
  percentage: number
  color: string
  description: string
}

interface WorkoutZonesWidgetProps {
  className?: string
}

export const WorkoutZonesWidget: React.FC<WorkoutZonesWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<WorkoutSessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')

  // Zone colors and descriptions
  const ZONE_CONFIG = {
    Z1: { color: '#10b981', description: 'Recovery' },
    Z2: { color: '#3b82f6', description: 'Aerobic' },
    Z3: { color: '#f59e0b', description: 'Anaerobic' },
    Z4: { color: '#ef4444', description: 'VO2 Max' },
    Z5: { color: '#dc2626', description: 'Neuromuscular' }
  }

  // Fetch workout zones data
  const fetchZonesData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get data based on selected time range
      const days = timeRange === 'week' ? 7 : 30
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('📊 [Zones Widget] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch zones data')
      }

      console.log('✅ [Zones Widget] Data fetched:', result.data.length, 'sessions')
      setData(result.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [Zones Widget] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  // Register with WebSocket refresh system
  // const { isRefreshing } = useWidgetRefresh('workout-zones', fetchZonesData)
  const isRefreshing = false

  // Initial data fetch
  useEffect(() => {
    fetchZonesData()
  }, [fetchZonesData])

  // Calculate aggregated zone data
  const getAggregatedZones = (): ZoneChartData[] => {
    if (data.length === 0) return []

    // Sum up all zones across sessions
    const totalZones = data.reduce((acc, session) => {
      Object.keys(session.zones).forEach(zone => {
        acc[zone as keyof ZoneBreakdown] += session.zones[zone as keyof ZoneBreakdown]
      })
      return acc
    }, { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 })

    // Calculate total time
    const totalMinutes = Object.values(totalZones).reduce((sum, minutes) => sum + minutes, 0)

    // Convert to chart format
    return Object.entries(totalZones).map(([zone, minutes]) => ({
      zone,
      minutes,
      percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0,
      color: ZONE_CONFIG[zone as keyof typeof ZONE_CONFIG].color,
      description: ZONE_CONFIG[zone as keyof typeof ZONE_CONFIG].description
    }))
  }

  const chartData = getAggregatedZones()
  const totalTime = chartData.reduce((sum, zone) => sum + zone.minutes, 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Zone {data.zone} - {data.description}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Time: <span className="font-semibold">{data.minutes} minutes</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Percentage: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
          </p>
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
            <FontAwesomeIcon icon={faChartBar} className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Heart Rate Zones
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Training intensity distribution
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
              <FontAwesomeIcon icon={faChartBar} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">{error}</p>
          </div>
        ) : chartData.length === 0 || totalTime === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faHeartPulse} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No zone data available</p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="zone" 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Zone Breakdown */}
            <div className="space-y-2">
              {chartData.map((zone) => (
                <div key={zone.zone} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: zone.color }}
                    ></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Zone {zone.zone} - {zone.description}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {zone.minutes}m
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      ({zone.percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Time</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{totalTime}m</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Sessions</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{data.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Avg/Session</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {data.length > 0 ? Math.round(totalTime / data.length) : 0}m
                  </p>
                </div>
              </div>
            </div>

            {/* Training Balance Insight */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FontAwesomeIcon icon={faHeartPulse} className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Training Balance
                </span>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {chartData.find(z => z.zone === 'Z1' || z.zone === 'Z2')?.percentage || 0 > 60
                  ? 'Good aerobic base - focus on building endurance'
                  : chartData.find(z => z.zone === 'Z4' || z.zone === 'Z5')?.percentage || 0 > 30
                  ? 'High intensity focus - consider more recovery work'
                  : 'Balanced training across zones'
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
