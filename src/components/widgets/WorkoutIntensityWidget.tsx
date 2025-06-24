/**
 * Workout Session Intensity Score Widget - Issue #9
 * 
 * Displays session intensity scoring with gauge visualization and difficulty rating
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGauge, faFire, faBolt, faLeaf } from '@fortawesome/free-solid-svg-icons'
import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
import { getWorkoutApiUrl } from '../../utils/apiConfig'

interface WorkoutSessionData {
  sport: string
  session_start: string
  intensity_score: number | null
  avg_heart_rate: number | null
  duration_min: number
  zones: {
    Z1: number
    Z2: number
    Z3: number
    Z4: number
    Z5: number
  }
}

interface IntensityLevel {
  level: string
  color: string
  icon: any
  description: string
  range: { min: number; max: number }
}

interface WorkoutIntensityWidgetProps {
  className?: string
}

export const WorkoutIntensityWidget: React.FC<WorkoutIntensityWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<WorkoutSessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Intensity levels configuration
  const INTENSITY_LEVELS: IntensityLevel[] = [
    { level: 'Recovery', color: '#10b981', icon: faLeaf, description: 'Light activity', range: { min: 0, max: 30 } },
    { level: 'Moderate', color: '#3b82f6', icon: faGauge, description: 'Steady effort', range: { min: 31, max: 60 } },
    { level: 'Hard', color: '#f59e0b', icon: faFire, description: 'Challenging workout', range: { min: 61, max: 85 } },
    { level: 'Maximum', color: '#ef4444', icon: faBolt, description: 'All-out effort', range: { min: 86, max: 100 } }
  ]

  // Fetch workout intensity data
  const fetchIntensityData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get last 14 days of data
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('⚡ [Intensity Widget] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch intensity data')
      }

      // Filter sessions with intensity scores
      const sessionsWithIntensity = result.data.filter((session: WorkoutSessionData) => 
        session.intensity_score !== null
      )
      
      console.log('✅ [Intensity Widget] Data fetched:', sessionsWithIntensity.length, 'sessions with intensity')
      setData(sessionsWithIntensity)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [Intensity Widget] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Register with WebSocket refresh system
  const { isRefreshing } = useWidgetRefresh('workout-intensity', fetchIntensityData)

  // Initial data fetch
  useEffect(() => {
    fetchIntensityData()
  }, [fetchIntensityData])

  // Calculate statistics
  const latestIntensity = data.length > 0 ? data[0]?.intensity_score : null
  const averageIntensity = data.length > 0 
    ? Math.round(data.reduce((sum, session) => sum + (session.intensity_score || 0), 0) / data.length)
    : null

  // Get intensity level for a score
  const getIntensityLevel = (score: number): IntensityLevel => {
    return INTENSITY_LEVELS.find(level => 
      score >= level.range.min && score <= level.range.max
    ) || INTENSITY_LEVELS[0]!
  }

  // Calculate intensity distribution
  const getIntensityDistribution = () => {
    if (data.length === 0) return []
    
    const distribution = INTENSITY_LEVELS.map(level => ({
      ...level,
      count: data.filter(session => {
        const score = session.intensity_score || 0
        return score >= level.range.min && score <= level.range.max
      }).length
    }))
    
    return distribution.map(item => ({
      ...item,
      percentage: Math.round((item.count / data.length) * 100)
    }))
  }

  const currentLevel = latestIntensity ? getIntensityLevel(latestIntensity) : null
  const distribution = getIntensityDistribution()

  // Gauge component for intensity visualization
  const IntensityGauge: React.FC<{ score: number; size?: number }> = ({ score, size = 120 }) => {
    const radius = size / 2 - 10
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (score / 100) * circumference
    
    const level = getIntensityLevel(score)
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={level.color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{score}</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">Intensity</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-widget-2 dark:bg-widget-2-dark rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <FontAwesomeIcon icon={faGauge} className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Session Intensity
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Workout difficulty rating
            </p>
          </div>
        </div>
        
        {/* Refresh indicator */}
        {(loading || isRefreshing) && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && !data.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-orange-500 mb-2">
              <FontAwesomeIcon icon={faGauge} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400">{error}</p>
          </div>
        ) : !latestIntensity ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faGauge} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No intensity data</p>
          </div>
        ) : (
          <>
            {/* Intensity Gauge */}
            <div className="flex justify-center">
              <IntensityGauge score={latestIntensity} />
            </div>

            {/* Current Level */}
            {currentLevel && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FontAwesomeIcon 
                    icon={currentLevel.icon} 
                    className="w-4 h-4"
                    style={{ color: currentLevel.color }}
                  />
                  <span 
                    className="text-lg font-semibold"
                    style={{ color: currentLevel.color }}
                  >
                    {currentLevel.level}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentLevel.description}
                </p>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Average Intensity */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">14-Day Average</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {averageIntensity}
                </p>
              </div>

              {/* Sessions Analyzed */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sessions</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {data.length}
                </p>
              </div>
            </div>

            {/* Intensity Distribution */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Intensity Distribution
              </h4>
              {distribution.map((level) => (
                <div key={level.level} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={level.icon} 
                      className="w-3 h-3"
                      style={{ color: level.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {level.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${level.percentage}%`,
                          backgroundColor: level.color 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
                      {level.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Training Recommendation */}
            <div 
              className="rounded-lg p-3"
              style={{ backgroundColor: currentLevel ? `${currentLevel.color}20` : '#f3f4f6' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FontAwesomeIcon 
                  icon={faGauge} 
                  className="w-4 h-4"
                  style={{ color: currentLevel?.color || '#6b7280' }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: currentLevel?.color || '#6b7280' }}
                >
                  Training Tip
                </span>
              </div>
              <p 
                className="text-xs"
                style={{ color: currentLevel?.color || '#6b7280' }}
              >
                {latestIntensity && latestIntensity >= 85
                  ? 'High intensity session! Ensure adequate recovery before next hard workout.'
                  : latestIntensity && latestIntensity >= 60
                  ? 'Good challenging workout. Balance with easier recovery sessions.'
                  : latestIntensity && latestIntensity >= 30
                  ? 'Moderate effort. Consider adding some higher intensity intervals.'
                  : 'Light session. Perfect for recovery or building aerobic base.'
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
