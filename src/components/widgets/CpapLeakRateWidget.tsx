/**
 * CPAP Leak Rate Trend Widget - Issue #7
 * 
 * Line chart with 24 L/min threshold line to track mask fit
 * and therapy delivery issues
 */

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWind, faRefresh, faExclamationTriangle, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'

// Types for CPAP Leak Rate data
interface LeakRateData {
  date: string
  leak_rate_avg: number | null
  isWithinThreshold: boolean
  severity: 'excellent' | 'good' | 'concerning' | 'critical'
}

interface CpapLeakRateWidgetProps {
  className?: string
}

// Leak rate thresholds (from Issue #7)
const LEAK_THRESHOLDS = {
  EXCELLENT: 10,  // <= 10 L/min
  GOOD: 20,       // <= 20 L/min
  CONCERNING: 24, // <= 24 L/min (main threshold from issue)
  CRITICAL: 30    // > 24 L/min
}

// Severity colors
const SEVERITY_COLORS = {
  excellent: '#10b981', // emerald-500
  good: '#3b82f6',      // blue-500
  concerning: '#f59e0b', // amber-500
  critical: '#ef4444'    // red-500
}

export const CpapLeakRateWidget: React.FC<CpapLeakRateWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<LeakRateData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch leak rate data
  const fetchLeakRateData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Show all data from beginning of time
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = '2020-01-01' // Start from beginning of time to capture all data

      const response = await fetch(`http://localhost:4000/api/cpap/leak-rate?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch leak rate data')
      }

      // Transform data for chart
      const chartData = result.data.map((item: any) => ({
        date: item.date,
        leak_rate_avg: item.leak_rate_avg,
        isWithinThreshold: item.isWithinThreshold,
        severity: item.severity,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))

      setData(chartData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ Error fetching leak rate data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchLeakRateData()
  }, [])

  // Calculate current stats
  const currentLeakRate = data.length > 0 ? data[data.length - 1]?.leak_rate_avg : null
  const currentSeverity = data.length > 0 ? data[data.length - 1]?.severity : 'excellent'
  
  const averageLeakRate = data.length > 0 
    ? data.filter(d => d.leak_rate_avg !== null).reduce((sum, d) => sum + (d.leak_rate_avg || 0), 0) / data.filter(d => d.leak_rate_avg !== null).length
    : null

  const goodDays = data.filter(d => d.isWithinThreshold).length
  const totalDays = data.filter(d => d.leak_rate_avg !== null).length

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'excellent':
      case 'good':
        return faCheckCircle
      case 'concerning':
        return faExclamationCircle
      case 'critical':
        return faExclamationTriangle
      default:
        return faWind
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.displayDate}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Leak Rate: <span className="font-semibold" style={{ color: SEVERITY_COLORS[data.severity] }}>
              {data.leak_rate_avg ? `${data.leak_rate_avg.toFixed(1)} L/min` : 'No data'}
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">
            Severity: {data.severity}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {data.isWithinThreshold ? '✓ Within threshold' : '⚠ Above threshold'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`bg-widget-3 dark:bg-widget-3-dark rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <FontAwesomeIcon icon={faWind} className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Leak Rate Trend
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Mask fit monitoring
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchLeakRateData}
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
              icon={getSeverityIcon(currentSeverity)}
              className={`w-4 h-4 ${currentSeverity === 'excellent' || currentSeverity === 'good' ? 'text-green-500' : currentSeverity === 'concerning' ? 'text-amber-500' : 'text-red-500'}`}
            />
            <span className="text-metric font-bold" style={{ color: SEVERITY_COLORS[currentSeverity] }}>
              {currentLeakRate ? `${currentLeakRate.toFixed(1)}` : '--'}
            </span>
          </div>
          <p className="text-label text-gray-600 dark:text-gray-400">Current L/min</p>
        </div>
        
        <div className="text-center">
          <p className="text-metric font-bold text-gray-900 dark:text-gray-100">
            {averageLeakRate ? `${averageLeakRate.toFixed(1)}` : '--'}
          </p>
          <p className="text-label text-gray-600 dark:text-gray-400">All-time Avg</p>
        </div>
        
        <div className="text-center">
          <p className="text-metric font-bold text-gray-900 dark:text-gray-100">
            {totalDays > 0 ? `${goodDays}/${totalDays}` : '--'}
          </p>
          <p className="text-label text-gray-600 dark:text-gray-400">Good Days</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
              <button 
                onClick={fetchLeakRateData}
                className="mt-2 text-sm text-amber-600 dark:text-amber-400 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <FontAwesomeIcon icon={faWind} className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No leak rate data available</p>
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
                domain={[0, 'dataMax + 5']}
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                label={{ value: 'Leak Rate (L/min)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Threshold reference lines */}
              <ReferenceLine y={LEAK_THRESHOLDS.EXCELLENT} stroke="#10b981" strokeDasharray="5 5" label="Excellent" />
              <ReferenceLine y={LEAK_THRESHOLDS.GOOD} stroke="#3b82f6" strokeDasharray="5 5" label="Good" />
              <ReferenceLine y={LEAK_THRESHOLDS.CONCERNING} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={2} label="Threshold (24 L/min)" />
              
              {/* Area fill for threshold zones */}
              <defs>
                <linearGradient id="leakGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="80%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              
              <Line 
                type="monotone" 
                dataKey="leak_rate_avg" 
                stroke="#d97706"
                strokeWidth={2}
                dot={{ fill: '#d97706', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#d97706', strokeWidth: 2 }}
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
          <div className="flex items-center gap-4">
            <span>Threshold: ≤24 L/min</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
              Leak Rate
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
