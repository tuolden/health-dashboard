/**
 * Workout Heart Rate Over Time Widget - Issue #9
 * 
 * Line chart visualization of heart rate during workout sessions
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartLine, faHeartPulse } from '@fortawesome/free-solid-svg-icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
// import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
import { getWorkoutApiUrl } from '../../utils/apiConfig'

interface WorkoutSessionData {
  sport: string
  session_start: string
  session_end: string
  avg_heart_rate: number | null
  duration_min: number
}

interface ChartDataPoint {
  time: string
  heart_rate: number
  sport: string
  displayTime: string
}

interface WorkoutHeartRateTimeWidgetProps {
  className?: string
}

export const WorkoutHeartRateTimeWidget: React.FC<WorkoutHeartRateTimeWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedSport, setSelectedSport] = useState<string>('all')

  // Fetch workout sessions data
  const fetchHeartRateTimeData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get last 14 days of data
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('📈 [HR Time Widget] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch heart rate time data')
      }

      // Transform sessions into chart data points
      const chartData: ChartDataPoint[] = result.data
        .filter((session: WorkoutSessionData) => session.avg_heart_rate !== null)
        .map((session: WorkoutSessionData) => {
          const startTime = new Date(session.session_start)
          return {
            time: session.session_start,
            heart_rate: session.avg_heart_rate!,
            sport: session.sport,
            displayTime: startTime.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        })
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      
      console.log('✅ [HR Time Widget] Data processed:', chartData.length, 'data points')
      setData(chartData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [HR Time Widget] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Register with WebSocket refresh system
  // const { isRefreshing } = useWidgetRefresh('workout-heart-rate-over-time', fetchHeartRateTimeData)
  const isRefreshing = false

  // Initial data fetch
  useEffect(() => {
    fetchHeartRateTimeData()
  }, [fetchHeartRateTimeData])

  // Filter data by selected sport
  const filteredData = selectedSport === 'all' 
    ? data 
    : data.filter(point => point.sport.toLowerCase() === selectedSport.toLowerCase())

  // Get unique sports for filter
  const availableSports = ['all', ...Array.from(new Set(data.map(point => point.sport)))]

  // Heart rate zone thresholds (based on typical zones)
  const HR_ZONES = {
    Z1_MAX: 114, // 60% of 190 max HR
    Z2_MAX: 133, // 70% of 190 max HR
    Z3_MAX: 152, // 80% of 190 max HR
    Z4_MAX: 171, // 90% of 190 max HR
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.displayTime}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Heart Rate: <span className="font-semibold text-red-600">{data.heart_rate} BPM</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Sport: {data.sport}
          </p>
        </div>
      )
    }
    return null
  }

  // Get sport color
  const getSportColor = (sport: string): string => {
    switch (sport.toLowerCase()) {
      case 'soccer':
        return '#10b981'
      case 'gym':
        return '#6366f1'
      default:
        return '#3b82f6'
    }
  }

  return (
    <div className={`bg-widget-2 dark:bg-widget-2-dark rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Heart Rate Trend
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Workout intensity over time
            </p>
          </div>
        </div>
        
        {/* Sport Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
          >
            {availableSports.map(sport => (
              <option key={sport} value={sport}>
                {sport === 'all' ? 'All Sports' : sport}
              </option>
            ))}
          </select>
          
          {/* Refresh indicator */}
          {(loading || isRefreshing) && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && !data.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-blue-500 mb-2">
              <FontAwesomeIcon icon={faChartLine} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400">{error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faHeartPulse} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedSport === 'all' ? 'No heart rate data' : `No ${selectedSport} sessions`}
            </p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="displayTime" 
                    stroke="#6b7280"
                    fontSize={10}
                    tick={{ fill: '#6b7280' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={[60, 200]}
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    label={{ value: 'Heart Rate (BPM)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Heart Rate Zone Reference Lines */}
                  <ReferenceLine y={HR_ZONES.Z1_MAX} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.5} />
                  <ReferenceLine y={HR_ZONES.Z2_MAX} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.5} />
                  <ReferenceLine y={HR_ZONES.Z3_MAX} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} />
                  <ReferenceLine y={HR_ZONES.Z4_MAX} stroke="#dc2626" strokeDasharray="2 2" strokeOpacity={0.5} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="heart_rate" 
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Zone Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Zone 1-2 (Recovery/Aerobic)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-yellow-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Zone 3 (Anaerobic)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Zone 4 (VO2 Max)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-700"></div>
                <span className="text-gray-600 dark:text-gray-400">Zone 5 (Neuromuscular)</span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Sessions</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{filteredData.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Avg HR</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {filteredData.length > 0 
                      ? Math.round(filteredData.reduce((sum, d) => sum + d.heart_rate, 0) / filteredData.length)
                      : 0} BPM
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Peak HR</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {filteredData.length > 0 ? Math.max(...filteredData.map(d => d.heart_rate)) : 0} BPM
                  </p>
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
