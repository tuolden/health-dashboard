/**
 * CPAP SpO2 Daily Trend Widget - Issue #7
 * 
 * Single-line chart showing blood oxygen saturation over time
 * for therapy effectiveness monitoring
 */

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLungs, faRefresh, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons'

// Types for CPAP SpO2 data
interface Spo2TrendData {
  date: string
  spo2_avg: number | null
  isHealthy: boolean
  qualityRating: 'excellent' | 'good' | 'concerning' | 'critical'
}

interface CpapSpo2TrendWidgetProps {
  className?: string
}

// Health thresholds for SpO2
const SPO2_THRESHOLDS = {
  EXCELLENT: 95, // >= 95%
  GOOD: 92,      // >= 92%
  CONCERNING: 90, // >= 90%
  CRITICAL: 88   // < 88%
}

// Quality rating colors
const QUALITY_COLORS = {
  excellent: '#10b981', // emerald-500
  good: '#3b82f6',      // blue-500
  concerning: '#f59e0b', // amber-500
  critical: '#ef4444'    // red-500
}

export const CpapSpo2TrendWidget: React.FC<CpapSpo2TrendWidgetProps> = ({ className = '' }) => {
  console.log('🫁 [SpO2 Widget] Component rendering...')

  const [data, setData] = useState<Spo2TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  console.log('🫁 [SpO2 Widget] Current state:', { loading, error, dataLength: data.length })

  // Fetch SpO2 trend data
  const fetchSpo2Data = async () => {
    try {
      setLoading(true)
      setError(null)

      // Show all data from beginning of time
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = '2020-01-01' // Start from beginning of time to capture all data

      console.log('🫁 [SpO2 Widget] Using full date range to show all historical data')

      const url = `http://localhost:4000/api/cpap/spo2-trend?startDate=${startDate}&endDate=${endDate}`
      console.log('🫁 [SpO2 Widget] Fetching data from:', url)
      console.log('🫁 [SpO2 Widget] Date range:', { startDate, endDate })
      console.log('🫁 [SpO2 Widget] About to make fetch request...')

      // Test if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('Fetch API is not available')
      }

      const response = await fetch(url)
      console.log('🫁 [SpO2 Widget] Fetch completed successfully!')
      console.log('🫁 [SpO2 Widget] Response status:', response.status, response.statusText)
      console.log('🫁 [SpO2 Widget] Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🫁 [SpO2 Widget] Response error body:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log('🫁 [SpO2 Widget] API Response:', result)

      if (!result.success) {
        console.error('🫁 [SpO2 Widget] API returned error:', result.error)
        throw new Error(result.error?.message || 'Failed to fetch SpO2 data')
      }

      // Transform data for chart
      const chartData = result.data.map((item: any) => ({
        date: item.date,
        spo2_avg: item.spo2_avg,
        isHealthy: item.isHealthy,
        qualityRating: item.qualityRating,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))

      console.log('🫁 [SpO2 Widget] Transformed chart data:', chartData)
      setData(chartData)
      setLastUpdated(new Date())
      console.log('🫁 [SpO2 Widget] Data fetch successful!')
    } catch (err) {
      console.error('❌ [SpO2 Widget] Error fetching SpO2 data:', err)
      console.error('❌ [SpO2 Widget] Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      })
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    console.log('🫁 [SpO2 Widget] Component mounted, starting data fetch...')
    fetchSpo2Data()
  }, [])

  // Calculate current stats
  const currentSpo2 = data.length > 0 ? data[data.length - 1]?.spo2_avg : null
  const averageSpo2 = data.length > 0 
    ? data.filter(d => d.spo2_avg !== null).reduce((sum, d) => sum + (d.spo2_avg || 0), 0) / data.filter(d => d.spo2_avg !== null).length
    : null

  const healthyDays = data.filter(d => d.isHealthy).length
  const totalDays = data.filter(d => d.spo2_avg !== null).length

  // Get quality rating for current SpO2
  const getCurrentQuality = (spo2: number | null): 'excellent' | 'good' | 'concerning' | 'critical' => {
    if (!spo2 || spo2 <= 0) return 'critical'
    if (spo2 >= SPO2_THRESHOLDS.EXCELLENT) return 'excellent'
    if (spo2 >= SPO2_THRESHOLDS.GOOD) return 'good'
    if (spo2 >= SPO2_THRESHOLDS.CONCERNING) return 'concerning'
    return 'critical'
  }

  const currentQuality = getCurrentQuality(currentSpo2)

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.displayDate}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            SpO2: <span className="font-semibold" style={{ color: QUALITY_COLORS[data.qualityRating] }}>
              {data.spo2_avg ? `${data.spo2_avg.toFixed(1)}%` : 'No data'}
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">
            Quality: {data.qualityRating}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`bg-widget-1 dark:bg-widget-1-dark rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FontAwesomeIcon icon={faLungs} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              SpO2 Daily Trend
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Blood oxygen saturation
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchSpo2Data}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Refresh data"
        >
          <FontAwesomeIcon 
            icon={faRefresh} 
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FontAwesomeIcon 
              icon={currentQuality === 'excellent' || currentQuality === 'good' ? faCheckCircle : faExclamationTriangle}
              className={`w-4 h-4 ${currentQuality === 'excellent' || currentQuality === 'good' ? 'text-green-500' : 'text-amber-500'}`}
            />
            <span className="text-metric font-bold" style={{ color: QUALITY_COLORS[currentQuality] }}>
              {currentSpo2 ? `${currentSpo2.toFixed(1)}%` : '--'}
            </span>
          </div>
          <p className="text-label text-gray-600 dark:text-gray-400">Current</p>
        </div>
        
        <div className="text-center">
          <p className="text-metric font-bold text-gray-900 dark:text-gray-100">
            {averageSpo2 ? `${averageSpo2.toFixed(1)}%` : '--'}
          </p>
          <p className="text-label text-gray-600 dark:text-gray-400">All-time Avg</p>
        </div>
        
        <div className="text-center">
          <p className="text-metric font-bold text-gray-900 dark:text-gray-100">
            {totalDays > 0 ? `${healthyDays}/${totalDays}` : '--'}
          </p>
          <p className="text-label text-gray-600 dark:text-gray-400">Healthy Days</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
              <button 
                onClick={fetchSpo2Data}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <FontAwesomeIcon icon={faLungs} className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No SpO2 data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="displayDate" 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                domain={[85, 100]}
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                label={{ value: 'SpO2 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference lines for thresholds */}
              <ReferenceLine y={SPO2_THRESHOLDS.CONCERNING} stroke="#f59e0b" strokeDasharray="5 5" />
              <ReferenceLine y={SPO2_THRESHOLDS.GOOD} stroke="#3b82f6" strokeDasharray="5 5" />
              <ReferenceLine y={SPO2_THRESHOLDS.EXCELLENT} stroke="#10b981" strokeDasharray="5 5" />
              
              <Line 
                type="monotone" 
                dataKey="spo2_avg" 
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <span>Healthy: ≥90% SpO2</span>
        </div>
      </div>
    </div>
  )
}
