/**
 * CPAP SpO2 + Pulse Rate Dual-Axis Widget - Issue #7
 * 
 * Dual-axis line chart showing both SpO2 and pulse rate trends
 * for health correlation analysis
 */

import React, { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeartPulse, faRefresh, faExclamationTriangle, faLungs } from '@fortawesome/free-solid-svg-icons'
import { getCpapApiUrl } from '../../utils/apiConfig'
import { useWidgetRefresh } from '../../hooks/useWidgetManager'

// Types for CPAP SpO2 + Pulse data
interface Spo2PulseData {
  date: string
  spo2_avg: number | null
  pulse_rate_avg: number | null
  correlation: 'normal' | 'concerning' | 'critical'
}

interface CpapSpo2PulseWidgetProps {
  className?: string
}

// Health thresholds
const THRESHOLDS = {
  SPO2: {
    NORMAL: 90,
    CONCERNING: 88
  },
  PULSE: {
    MIN_NORMAL: 50,
    MAX_NORMAL: 100,
    CONCERNING_HIGH: 110
  }
}

// Correlation colors
const CORRELATION_COLORS = {
  normal: '#10b981',     // emerald-500
  concerning: '#f59e0b', // amber-500
  critical: '#ef4444'    // red-500
}

export const CpapSpo2PulseWidget: React.FC<CpapSpo2PulseWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<Spo2PulseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch SpO2 + Pulse data
  const fetchSpo2PulseData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Show all data from beginning of time
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = '2020-01-01' // Start from beginning of time to capture all data

      const response = await fetch(`${getCpapApiUrl('spo2-pulse')}?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch SpO2/Pulse data')
      }

      // Transform data for chart
      const chartData = result.data.map((item: any) => ({
        date: item.date,
        spo2_avg: item.spo2_avg,
        pulse_rate_avg: item.pulse_rate_avg,
        correlation: item.correlation,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))

      setData(chartData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ Error fetching SpO2/Pulse data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Register with WebSocket refresh system
  const { isRefreshing } = useWidgetRefresh('spo2-pulse', fetchSpo2PulseData)

  // Initial data fetch
  useEffect(() => {
    fetchSpo2PulseData()
  }, [fetchSpo2PulseData])

  // Calculate current stats
  const latestData = data.length > 0 ? data[data.length - 1] : null
  const currentSpo2 = latestData?.spo2_avg
  const currentPulse = latestData?.pulse_rate_avg
  const currentCorrelation = latestData?.correlation || 'normal'

  // Calculate averages
  const avgSpo2 = data.length > 0 
    ? data.filter(d => d.spo2_avg !== null).reduce((sum, d) => sum + (d.spo2_avg || 0), 0) / data.filter(d => d.spo2_avg !== null).length
    : null

  const avgPulse = data.length > 0 
    ? data.filter(d => d.pulse_rate_avg !== null).reduce((sum, d) => sum + (d.pulse_rate_avg || 0), 0) / data.filter(d => d.pulse_rate_avg !== null).length
    : null

  // Count correlation status
  const normalDays = data.filter(d => d.correlation === 'normal').length
  const totalDays = data.filter(d => d.spo2_avg !== null || d.pulse_rate_avg !== null).length

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.displayDate}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SpO2: <span className="font-semibold text-blue-600">
                {data.spo2_avg ? `${data.spo2_avg.toFixed(1)}%` : 'No data'}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pulse: <span className="font-semibold text-red-600">
                {data.pulse_rate_avg ? `${data.pulse_rate_avg} bpm` : 'No data'}
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">
              Status: <span style={{ color: CORRELATION_COLORS[data.correlation] }}>
                {data.correlation}
              </span>
            </p>
          </div>
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
            <FontAwesomeIcon icon={faHeartPulse} className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              SpO2 & Pulse Rate
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              All historical data
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchSpo2PulseData}
          disabled={loading || isRefreshing}
          className={`p-2 transition-colors ${
            isRefreshing
              ? 'text-purple-500 dark:text-purple-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          title={isRefreshing ? "Auto-refreshing from WebSocket..." : "Refresh data"}
        >
          <FontAwesomeIcon
            icon={faRefresh}
            className={`w-4 h-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FontAwesomeIcon icon={faLungs} className="w-3 h-3 text-blue-500" />
            <span className="text-metric font-bold text-blue-600">
              {currentSpo2 ? `${currentSpo2.toFixed(1)}%` : '--'}
            </span>
          </div>
          <p className="text-label text-gray-600 dark:text-gray-400">SpO2</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FontAwesomeIcon icon={faHeartPulse} className="w-3 h-3 text-red-500" />
            <span className="text-metric font-bold text-red-600">
              {currentPulse ? `${currentPulse}` : '--'}
            </span>
          </div>
          <p className="text-label text-gray-600 dark:text-gray-400">BPM</p>
        </div>
        
        <div className="text-center">
          <p className="text-metric font-bold" style={{ color: CORRELATION_COLORS[currentCorrelation] }}>
            {currentCorrelation.charAt(0).toUpperCase() + currentCorrelation.slice(1)}
          </p>
          <p className="text-label text-gray-600 dark:text-gray-400">Status</p>
        </div>
        
        <div className="text-center">
          <p className="text-metric font-bold text-gray-900 dark:text-gray-100">
            {totalDays > 0 ? `${normalDays}/${totalDays}` : '--'}
          </p>
          <p className="text-label text-gray-600 dark:text-gray-400">Normal</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
              <button 
                onClick={fetchSpo2PulseData}
                className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <FontAwesomeIcon icon={faHeartPulse} className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No SpO2/Pulse data available</p>
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
              {/* Left Y-axis for SpO2 */}
              <YAxis 
                yAxisId="spo2"
                domain={[85, 100]}
                stroke="#2563eb"
                fontSize={12}
                tick={{ fill: '#2563eb' }}
                label={{ value: 'SpO2 (%)', angle: -90, position: 'insideLeft' }}
              />
              {/* Right Y-axis for Pulse */}
              <YAxis 
                yAxisId="pulse"
                orientation="right"
                domain={[40, 120]}
                stroke="#dc2626"
                fontSize={12}
                tick={{ fill: '#dc2626' }}
                label={{ value: 'Pulse (BPM)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference lines */}
              <ReferenceLine yAxisId="spo2" y={THRESHOLDS.SPO2.NORMAL} stroke="#3b82f6" strokeDasharray="5 5" />
              <ReferenceLine yAxisId="pulse" y={THRESHOLDS.PULSE.MIN_NORMAL} stroke="#dc2626" strokeDasharray="5 5" />
              <ReferenceLine yAxisId="pulse" y={THRESHOLDS.PULSE.MAX_NORMAL} stroke="#dc2626" strokeDasharray="5 5" />
              
              {/* SpO2 Line */}
              <Line 
                yAxisId="spo2"
                type="monotone" 
                dataKey="spo2_avg" 
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#2563eb', strokeWidth: 2 }}
                connectNulls={false}
                name="SpO2"
              />
              
              {/* Pulse Rate Line */}
              <Line 
                yAxisId="pulse"
                type="monotone" 
                dataKey="pulse_rate_avg" 
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#dc2626', strokeWidth: 2 }}
                connectNulls={false}
                name="Pulse"
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
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              SpO2 (≥90%)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              Pulse (50-100 bpm)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
