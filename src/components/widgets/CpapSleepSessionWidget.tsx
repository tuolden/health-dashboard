/**
 * CPAP Sleep Session Start Time Widget - Issue #7
 * 
 * Timeline/bar chart showing when user went to sleep based on
 * CPAP session_start timestamps
 */

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBed, faRefresh, faExclamationTriangle, faMoon, faSun, faClock } from '@fortawesome/free-solid-svg-icons'
import { getCpapApiUrl } from '../../utils/apiConfig'

// Types for CPAP Sleep Session data
interface SleepSessionData {
  date: string
  session_start: string
  bedtime_hour: number
  sleep_pattern: 'early' | 'normal' | 'late' | 'irregular'
}

interface CpapSleepSessionWidgetProps {
  className?: string
}

// Sleep pattern thresholds
const BEDTIME_THRESHOLDS = {
  EARLY: 21,    // Before 9 PM
  NORMAL_START: 21,
  NORMAL_END: 23,
  LATE: 23      // After 11 PM
}

// Pattern colors
const PATTERN_COLORS = {
  early: '#10b981',     // emerald-500
  normal: '#3b82f6',    // blue-500
  late: '#f59e0b',      // amber-500
  irregular: '#ef4444'  // red-500
}

export const CpapSleepSessionWidget: React.FC<CpapSleepSessionWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<SleepSessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch sleep session data
  const fetchSleepSessionData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Show all data from beginning of time
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = '2020-01-01' // Start from beginning of time to capture all data

      const response = await fetch(`${getCpapApiUrl('sleep-sessions')}?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch sleep session data')
      }

      // Transform data for chart
      const chartData = result.data.map((item: any) => ({
        date: item.date,
        session_start: item.session_start,
        bedtime_hour: item.bedtime_hour,
        sleep_pattern: item.sleep_pattern,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        displayTime: new Date(item.session_start).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      }))

      setData(chartData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ Error fetching sleep session data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchSleepSessionData()
  }, [])

  // Calculate current stats
  const latestSession = data.length > 0 ? data[data.length - 1] : null
  const currentBedtime = latestSession?.bedtime_hour
  const currentPattern = latestSession?.sleep_pattern || 'normal'

  // Calculate average bedtime
  const averageBedtime = data.length > 0 
    ? data.reduce((sum, d) => sum + d.bedtime_hour, 0) / data.length
    : null

  // Count pattern distribution
  const patternCounts = data.reduce((acc, d) => {
    acc[d.sleep_pattern] = (acc[d.sleep_pattern] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const normalNights = patternCounts.normal || 0
  const totalNights = data.length

  // Format hour to display time
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12:00 AM'
    if (hour < 12) return `${hour}:00 AM`
    if (hour === 12) return '12:00 PM'
    return `${hour - 12}:00 PM`
  }

  // Get pattern icon
  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'early':
        return faSun
      case 'normal':
        return faMoon
      case 'late':
        return faClock
      case 'irregular':
        return faExclamationTriangle
      default:
        return faBed
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
            Bedtime: <span className="font-semibold" style={{ color: PATTERN_COLORS[data.sleep_pattern] }}>
              {data.displayTime}
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">
            Pattern: {data.sleep_pattern}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`bg-widget-4 dark:bg-widget-4-dark rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <FontAwesomeIcon icon={faBed} className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Sleep Start Times
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              CPAP session bedtimes
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchSleepSessionData}
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
              icon={getPatternIcon(currentPattern)}
              className={`w-4 h-4`}
              style={{ color: PATTERN_COLORS[currentPattern] }}
            />
            <span className="text-metric font-bold" style={{ color: PATTERN_COLORS[currentPattern] }}>
              {currentBedtime ? formatHour(currentBedtime) : '--'}
            </span>
          </div>
          <p className="text-label text-gray-600 dark:text-gray-400">Last Bedtime</p>
        </div>
        
        <div className="text-center">
          <p className="text-metric font-bold text-gray-900 dark:text-gray-100">
            {averageBedtime ? formatHour(Math.round(averageBedtime)) : '--'}
          </p>
          <p className="text-label text-gray-600 dark:text-gray-400">Average</p>
        </div>
        
        <div className="text-center">
          <p className="text-metric font-bold text-gray-900 dark:text-gray-100">
            {totalNights > 0 ? `${normalNights}/${totalNights}` : '--'}
          </p>
          <p className="text-label text-gray-600 dark:text-gray-400">Normal</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
              <button 
                onClick={fetchSleepSessionData}
                className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <FontAwesomeIcon icon={faBed} className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No sleep session data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="displayDate" 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                domain={[18, 26]}
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => formatHour(value)}
                label={{ value: 'Bedtime', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference lines for normal bedtime range */}
              <ReferenceLine y={BEDTIME_THRESHOLDS.NORMAL_START} stroke="#3b82f6" strokeDasharray="5 5" label="Normal Start (9 PM)" />
              <ReferenceLine y={BEDTIME_THRESHOLDS.NORMAL_END} stroke="#3b82f6" strokeDasharray="5 5" label="Normal End (11 PM)" />
              
              <Bar 
                dataKey="bedtime_hour" 
                fill={(entry: any) => PATTERN_COLORS[entry?.sleep_pattern] || '#6b7280'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <div className="flex items-center gap-4">
            <span>Normal: 9-11 PM</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Normal
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                Late
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
