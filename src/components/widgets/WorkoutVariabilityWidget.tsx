/**
 * Workout BPM Variability Widget - Issue #9
 * 
 * Displays heart rate variability analysis with fatigue detection indicators
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartArea, faHeartPulse, faExclamationCircle, faBatteryHalf } from '@fortawesome/free-solid-svg-icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
import { getWorkoutApiUrl } from '../../utils/apiConfig'

interface WorkoutSessionData {
  sport: string
  session_start: string
  bpm_std_dev: number | null
  avg_heart_rate: number | null
  duration_min: number
}

interface VariabilityData {
  date: string
  variability: number
  avg_hr: number
  displayDate: string
  fatigueLevel: 'low' | 'moderate' | 'high'
}

interface WorkoutVariabilityWidgetProps {
  className?: string
}

export const WorkoutVariabilityWidget: React.FC<WorkoutVariabilityWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<WorkoutSessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Variability thresholds for fatigue detection
  const VARIABILITY_THRESHOLDS = {
    LOW_FATIGUE: 15,    // High variability = good recovery
    MODERATE_FATIGUE: 10, // Moderate variability
    HIGH_FATIGUE: 5     // Low variability = potential fatigue
  }

  // Fetch workout variability data
  const fetchVariabilityData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get last 14 days of data
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('📊 [Variability Widget] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch variability data')
      }

      // Filter sessions with variability data
      const sessionsWithVariability = result.data.filter((session: WorkoutSessionData) => 
        session.bpm_std_dev !== null
      )
      
      console.log('✅ [Variability Widget] Data fetched:', sessionsWithVariability.length, 'sessions with variability')
      setData(sessionsWithVariability)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [Variability Widget] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Register with WebSocket refresh system
  const { isRefreshing } = useWidgetRefresh('workout-variability', fetchVariabilityData)

  // Initial data fetch
  useEffect(() => {
    fetchVariabilityData()
  }, [fetchVariabilityData])

  // Process data for chart visualization
  const getVariabilityData = (): VariabilityData[] => {
    if (data.length === 0) return []

    return data.slice(0, 10).reverse().map(session => {
      const variability = session.bpm_std_dev || 0
      
      // Determine fatigue level based on variability
      let fatigueLevel: 'low' | 'moderate' | 'high' = 'low'
      if (variability <= VARIABILITY_THRESHOLDS.HIGH_FATIGUE) {
        fatigueLevel = 'high'
      } else if (variability <= VARIABILITY_THRESHOLDS.MODERATE_FATIGUE) {
        fatigueLevel = 'moderate'
      }
      
      return {
        date: session.session_start.split('T')[0]!,
        variability,
        avg_hr: session.avg_heart_rate || 0,
        displayDate: new Date(session.session_start).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        fatigueLevel
      }
    })
  }

  const chartData = getVariabilityData()
  const latestVariability = data.length > 0 ? data[0]?.bpm_std_dev : null
  const averageVariability = data.length > 0 
    ? Math.round((data.reduce((sum, session) => sum + (session.bpm_std_dev || 0), 0) / data.length) * 10) / 10
    : null

  // Get variability level assessment
  const getVariabilityLevel = (variability: number): { level: string; color: string; description: string } => {
    if (variability >= VARIABILITY_THRESHOLDS.LOW_FATIGUE) {
      return { level: 'Good', color: '#10b981', description: 'Well recovered, ready for training' }
    } else if (variability >= VARIABILITY_THRESHOLDS.MODERATE_FATIGUE) {
      return { level: 'Moderate', color: '#f59e0b', description: 'Some fatigue, monitor closely' }
    } else {
      return { level: 'Low', color: '#ef4444', description: 'Potential fatigue, consider rest' }
    }
  }

  // Calculate fatigue trend
  const getFatigueTrend = (): { direction: 'improving' | 'stable' | 'declining'; change: number } => {
    if (data.length < 4) return { direction: 'stable', change: 0 }
    
    const recent = data.slice(0, 2).reduce((sum, s) => sum + (s.bpm_std_dev || 0), 0) / 2
    const previous = data.slice(2, 4).reduce((sum, s) => sum + (s.bpm_std_dev || 0), 0) / 2
    
    const change = recent - previous
    
    if (Math.abs(change) < 2) return { direction: 'stable', change: 0 }
    return { direction: change > 0 ? 'improving' : 'declining', change: Math.abs(change) }
  }

  const currentLevel = latestVariability ? getVariabilityLevel(latestVariability) : null
  const trend = getFatigueTrend()

  // Get fatigue color for chart dots
  const getFatigueColor = (level: 'low' | 'moderate' | 'high'): string => {
    switch (level) {
      case 'high': return '#ef4444'
      case 'moderate': return '#f59e0b'
      default: return '#10b981'
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const level = getVariabilityLevel(data.variability)
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.displayDate}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Variability: <span className="font-semibold">{data.variability.toFixed(1)} BPM</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Avg HR: <span className="font-semibold">{data.avg_hr} BPM</span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: level.color }}
            ></div>
            <span 
              className="text-sm font-medium"
              style={{ color: level.color }}
            >
              {level.level} Recovery
            </span>
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
          <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
            <FontAwesomeIcon icon={faChartArea} className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Heart Rate Variability
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Fatigue detection indicator
            </p>
          </div>
        </div>
        
        {/* Refresh indicator */}
        {(loading || isRefreshing) && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && !data.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-teal-500 mb-2">
              <FontAwesomeIcon icon={faChartArea} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-teal-600 dark:text-teal-400">{error}</p>
          </div>
        ) : !latestVariability ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faHeartPulse} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No variability data</p>
          </div>
        ) : (
          <>
            {/* Current Variability */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {latestVariability.toFixed(1)}
                </span>
                <span className="text-lg text-gray-600 dark:text-gray-400">BPM</span>
              </div>
              
              {/* Recovery Level */}
              {currentLevel && (
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentLevel.color }}
                  ></div>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: currentLevel.color }}
                  >
                    {currentLevel.level} Variability
                  </span>
                </div>
              )}
              
              {currentLevel && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {currentLevel.description}
                </p>
              )}
            </div>

            {/* Variability Trend Chart */}
            {chartData.length > 2 && (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#6b7280"
                      fontSize={10}
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      domain={[0, 25]}
                      stroke="#6b7280"
                      fontSize={10}
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Reference lines for fatigue levels */}
                    <ReferenceLine y={VARIABILITY_THRESHOLDS.LOW_FATIGUE} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.5} />
                    <ReferenceLine y={VARIABILITY_THRESHOLDS.MODERATE_FATIGUE} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.5} />
                    <ReferenceLine y={VARIABILITY_THRESHOLDS.HIGH_FATIGUE} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} />
                    
                    <Line 
                      type="monotone" 
                      dataKey="variability" 
                      stroke="#14b8a6"
                      strokeWidth={2}
                      dot={(props) => (
                        <circle 
                          {...props} 
                          fill={getFatigueColor(props.payload.fatigueLevel)} 
                          r={4} 
                        />
                      )}
                      activeDot={{ r: 6, stroke: '#14b8a6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Average Variability */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">14-Day Average</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {averageVariability} <span className="text-sm text-gray-600">BPM</span>
                </p>
              </div>

              {/* Trend */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recovery Trend</p>
                <div className="flex items-center justify-center gap-1">
                  {trend.direction === 'improving' && (
                    <>
                      <FontAwesomeIcon icon={faBatteryHalf} className="w-3 h-3 text-green-500 transform rotate-90" />
                      <span className="text-sm font-semibold text-green-500">Improving</span>
                    </>
                  )}
                  {trend.direction === 'declining' && (
                    <>
                      <FontAwesomeIcon icon={faExclamationCircle} className="w-3 h-3 text-red-500" />
                      <span className="text-sm font-semibold text-red-500">Declining</span>
                    </>
                  )}
                  {trend.direction === 'stable' && (
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Stable</span>
                  )}
                </div>
              </div>
            </div>

            {/* Fatigue Assessment */}
            <div 
              className="rounded-lg p-3"
              style={{ backgroundColor: currentLevel ? `${currentLevel.color}20` : '#f3f4f6' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FontAwesomeIcon 
                  icon={faHeartPulse} 
                  className="w-4 h-4"
                  style={{ color: currentLevel?.color || '#6b7280' }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: currentLevel?.color || '#6b7280' }}
                >
                  Recovery Assessment
                </span>
              </div>
              <p 
                className="text-xs"
                style={{ color: currentLevel?.color || '#6b7280' }}
              >
                {latestVariability && latestVariability >= VARIABILITY_THRESHOLDS.LOW_FATIGUE
                  ? 'High heart rate variability indicates good recovery. You\'re ready for intense training.'
                  : latestVariability && latestVariability >= VARIABILITY_THRESHOLDS.MODERATE_FATIGUE
                  ? 'Moderate variability suggests some fatigue. Consider lighter training or active recovery.'
                  : 'Low variability may indicate fatigue or stress. Prioritize rest and recovery activities.'
                }
              </p>
            </div>

            {/* Variability Legend */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Good (15+ BPM)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-yellow-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Moderate (10-15)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Low (<10 BPM)</span>
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
