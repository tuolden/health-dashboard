/**
 * Workout Weekly Zone Distribution Widget - Issue #9
 * 
 * Stacked bar chart showing weekly heart rate zone distribution and training balance
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarWeek, faChartColumn, faBalanceScale } from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
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

interface WeeklyZoneData {
  week: string
  weekStart: string
  Z1: number
  Z2: number
  Z3: number
  Z4: number
  Z5: number
  total: number
  displayWeek: string
}

interface WorkoutWeeklyZonesWidgetProps {
  className?: string
}

export const WorkoutWeeklyZonesWidget: React.FC<WorkoutWeeklyZonesWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<WorkoutSessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [weeksToShow, setWeeksToShow] = useState<number>(4)

  // Zone colors configuration
  const ZONE_COLORS = {
    Z1: '#10b981', // Green - Recovery
    Z2: '#3b82f6', // Blue - Aerobic
    Z3: '#f59e0b', // Yellow - Anaerobic
    Z4: '#ef4444', // Red - VO2 Max
    Z5: '#dc2626'  // Dark Red - Neuromuscular
  }

  // Fetch workout weekly zones data
  const fetchWeeklyZonesData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get data for the specified number of weeks
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - weeksToShow * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('📅 [Weekly Zones Widget] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch weekly zones data')
      }

      console.log('✅ [Weekly Zones Widget] Data fetched:', result.data.length, 'sessions')
      setData(result.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [Weekly Zones Widget] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [weeksToShow])

  // Register with WebSocket refresh system
  const { isRefreshing } = useWidgetRefresh('workout-weekly-zones', fetchWeeklyZonesData)

  // Initial data fetch
  useEffect(() => {
    fetchWeeklyZonesData()
  }, [fetchWeeklyZonesData])

  // Process data into weekly aggregations
  const getWeeklyZoneData = (): WeeklyZoneData[] => {
    if (data.length === 0) return []

    // Group sessions by week
    const weeklyData: Record<string, ZoneBreakdown> = {}
    
    data.forEach(session => {
      const sessionDate = new Date(session.session_start)
      
      // Get Monday of the week (ISO week start)
      const monday = new Date(sessionDate)
      const day = monday.getDay()
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
      monday.setDate(diff)
      
      const weekKey = monday.toISOString().split('T')[0]!
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 }
      }
      
      // Add session zones to weekly total
      Object.keys(session.zones).forEach(zone => {
        weeklyData[weekKey]![zone as keyof ZoneBreakdown] += session.zones[zone as keyof ZoneBreakdown]
      })
    })

    // Convert to chart format and sort by date
    return Object.entries(weeklyData)
      .map(([weekStart, zones]) => {
        const total = Object.values(zones).reduce((sum, minutes) => sum + minutes, 0)
        const startDate = new Date(weekStart)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6)
        
        return {
          week: weekStart,
          weekStart,
          ...zones,
          total,
          displayWeek: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }
      })
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .slice(-weeksToShow) // Show only the requested number of weeks
  }

  const weeklyData = getWeeklyZoneData()

  // Calculate training balance for current week
  const getCurrentWeekBalance = () => {
    if (weeklyData.length === 0) return null
    
    const currentWeek = weeklyData[weeklyData.length - 1]!
    const total = currentWeek.total
    
    if (total === 0) return null
    
    const aerobic = (currentWeek.Z1 + currentWeek.Z2) / total * 100
    const anaerobic = (currentWeek.Z3 + currentWeek.Z4 + currentWeek.Z5) / total * 100
    
    return { aerobic: Math.round(aerobic), anaerobic: Math.round(anaerobic) }
  }

  const currentBalance = getCurrentWeekBalance()

  // Get training balance assessment
  const getBalanceAssessment = (balance: { aerobic: number; anaerobic: number }) => {
    if (balance.aerobic >= 70) {
      return { level: 'Aerobic Focus', color: '#10b981', description: 'Great for building endurance base' }
    } else if (balance.anaerobic >= 60) {
      return { level: 'High Intensity', color: '#ef4444', description: 'Focus on recovery and base building' }
    } else {
      return { level: 'Balanced', color: '#3b82f6', description: 'Good mix of aerobic and anaerobic training' }
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0)
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          {payload.reverse().map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-block w-3 h-3 rounded mr-2" style={{ backgroundColor: entry.color }}></span>
              Zone {entry.dataKey}: <span className="font-semibold">{entry.value}m</span>
              <span className="text-xs ml-1">({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)</span>
            </p>
          ))}
          <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Total: {total} minutes
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
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <FontAwesomeIcon icon={faCalendarWeek} className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Weekly Zone Distribution
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Training balance analysis
            </p>
          </div>
        </div>
        
        {/* Weeks Filter */}
        <div className="flex items-center gap-2">
          <select
            value={weeksToShow}
            onChange={(e) => setWeeksToShow(parseInt(e.target.value))}
            className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
          >
            <option value={4}>4 Weeks</option>
            <option value={6}>6 Weeks</option>
            <option value={8}>8 Weeks</option>
          </select>
          
          {/* Refresh indicator */}
          {(loading || isRefreshing) && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && !data.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-indigo-500 mb-2">
              <FontAwesomeIcon icon={faCalendarWeek} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-indigo-600 dark:text-indigo-400">{error}</p>
          </div>
        ) : weeklyData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faChartColumn} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No weekly zone data</p>
          </div>
        ) : (
          <>
            {/* Stacked Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="displayWeek" 
                    stroke="#6b7280"
                    fontSize={10}
                    tick={{ fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  <Bar dataKey="Z1" stackId="zones" fill={ZONE_COLORS.Z1} name="Zone 1 (Recovery)" />
                  <Bar dataKey="Z2" stackId="zones" fill={ZONE_COLORS.Z2} name="Zone 2 (Aerobic)" />
                  <Bar dataKey="Z3" stackId="zones" fill={ZONE_COLORS.Z3} name="Zone 3 (Anaerobic)" />
                  <Bar dataKey="Z4" stackId="zones" fill={ZONE_COLORS.Z4} name="Zone 4 (VO2 Max)" />
                  <Bar dataKey="Z5" stackId="zones" fill={ZONE_COLORS.Z5} name="Zone 5 (Neuromuscular)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Current Week Balance */}
            {currentBalance && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FontAwesomeIcon icon={faBalanceScale} className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    This Week's Balance
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Aerobic (Z1-Z2)</p>
                    <p className="text-lg font-semibold text-green-600">{currentBalance.aerobic}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Anaerobic (Z3-Z5)</p>
                    <p className="text-lg font-semibold text-red-600">{currentBalance.anaerobic}%</p>
                  </div>
                </div>

                {/* Balance Assessment */}
                {(() => {
                  const assessment = getBalanceAssessment(currentBalance)
                  return (
                    <div 
                      className="rounded-lg p-2"
                      style={{ backgroundColor: `${assessment.color}20` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: assessment.color }}
                        ></div>
                        <span 
                          className="text-sm font-medium"
                          style={{ color: assessment.color }}
                        >
                          {assessment.level}
                        </span>
                      </div>
                      <p 
                        className="text-xs"
                        style={{ color: assessment.color }}
                      >
                        {assessment.description}
                      </p>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Weekly Summary */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Weeks Analyzed</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{weeklyData.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Sessions</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{data.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Avg/Week</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {weeklyData.length > 0 ? Math.round(data.length / weeklyData.length) : 0}
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
