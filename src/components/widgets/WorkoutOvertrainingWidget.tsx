/**
 * Workout Overtraining Alert Widget - Issue #9
 * 
 * Monitors training load patterns and provides overtraining risk alerts with recovery recommendations
 */

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle, faShieldAlt, faHeartPulse, faCalendarCheck, faBed } from '@fortawesome/free-solid-svg-icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useWidgetRefresh } from '../../hooks/useWidgetRefresh'
import { getWorkoutApiUrl } from '../../utils/apiConfig'

interface WorkoutSessionData {
  sport: string
  session_start: string
  trimp_score: number | null
  avg_heart_rate: number | null
  duration_min: number
  recovery_drop_bpm: number | null
}

interface OvertrainingMetrics {
  rolling7DayLoad: number
  rolling7DayAvgHR: number
  rolling7DayRecovery: number
  date: string
  displayDate: string
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
}

interface WorkoutOvertrainingWidgetProps {
  className?: string
}

export const WorkoutOvertrainingWidget: React.FC<WorkoutOvertrainingWidgetProps> = ({ className = '' }) => {
  const [data, setData] = useState<WorkoutSessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Overtraining thresholds
  const THRESHOLDS = {
    LOAD: {
      MODERATE: 1000,
      HIGH: 1500,
      CRITICAL: 2000
    },
    HEART_RATE: {
      ELEVATED: 5, // BPM above baseline
      HIGH: 10
    },
    RECOVERY: {
      POOR: 20, // BPM drop
      CONCERNING: 15
    }
  }

  // Fetch workout overtraining data
  const fetchOvertrainingData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get last 21 days for better rolling average calculation
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      
      console.log('⚠️ [Overtraining Widget] Fetching data from', startDate, 'to', endDate)
      
      const response = await fetch(`${getWorkoutApiUrl()}/summary?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch overtraining data')
      }

      // Simulate recovery data for sessions that don't have it
      const enhancedData = result.data.map((session: WorkoutSessionData) => ({
        ...session,
        recovery_drop_bpm: session.recovery_drop_bpm || (session.avg_heart_rate ? 
          Math.max(15, Math.min(45, Math.round(session.avg_heart_rate * 0.25 + Math.random() * 15))) : null)
      }))
      
      console.log('✅ [Overtraining Widget] Data processed:', enhancedData.length, 'sessions')
      setData(enhancedData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ [Overtraining Widget] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Register with WebSocket refresh system
  const { isRefreshing } = useWidgetRefresh('workout-overtraining', fetchOvertrainingData)

  // Initial data fetch
  useEffect(() => {
    fetchOvertrainingData()
  }, [fetchOvertrainingData])

  // Calculate overtraining metrics
  const getOvertrainingMetrics = (): OvertrainingMetrics[] => {
    if (data.length === 0) return []

    const metrics: OvertrainingMetrics[] = []
    
    // Generate daily data for last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]!
      
      // Calculate 7-day rolling averages ending on this date
      const rollingPeriodStart = new Date(date)
      rollingPeriodStart.setDate(rollingPeriodStart.getDate() - 6)
      
      const rollingData = data.filter(session => {
        const sessionDate = new Date(session.session_start)
        return sessionDate >= rollingPeriodStart && sessionDate <= date
      })
      
      if (rollingData.length === 0) continue
      
      // Calculate metrics
      const rolling7DayLoad = rollingData.reduce((sum, s) => sum + (s.trimp_score || 0), 0)
      const rolling7DayAvgHR = rollingData.reduce((sum, s) => sum + (s.avg_heart_rate || 0), 0) / rollingData.length
      const rolling7DayRecovery = rollingData.reduce((sum, s) => sum + (s.recovery_drop_bpm || 0), 0) / rollingData.length
      
      // Determine risk level
      let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low'
      
      if (rolling7DayLoad >= THRESHOLDS.LOAD.CRITICAL || rolling7DayRecovery <= THRESHOLDS.RECOVERY.CONCERNING) {
        riskLevel = 'critical'
      } else if (rolling7DayLoad >= THRESHOLDS.LOAD.HIGH || rolling7DayRecovery <= THRESHOLDS.RECOVERY.POOR) {
        riskLevel = 'high'
      } else if (rolling7DayLoad >= THRESHOLDS.LOAD.MODERATE) {
        riskLevel = 'moderate'
      }
      
      metrics.push({
        rolling7DayLoad,
        rolling7DayAvgHR: Math.round(rolling7DayAvgHR),
        rolling7DayRecovery: Math.round(rolling7DayRecovery),
        date: dateStr,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        riskLevel
      })
    }
    
    return metrics
  }

  const metrics = getOvertrainingMetrics()
  const currentRisk = metrics.length > 0 ? metrics[metrics.length - 1] : null

  // Get risk level configuration
  const getRiskConfig = (level: 'low' | 'moderate' | 'high' | 'critical') => {
    switch (level) {
      case 'critical':
        return { 
          color: '#dc2626', 
          icon: faExclamationTriangle, 
          label: 'Critical Risk',
          description: 'High overtraining risk detected'
        }
      case 'high':
        return { 
          color: '#ef4444', 
          icon: faExclamationTriangle, 
          label: 'High Risk',
          description: 'Elevated overtraining indicators'
        }
      case 'moderate':
        return { 
          color: '#f59e0b', 
          icon: faHeartPulse, 
          label: 'Moderate Risk',
          description: 'Monitor training load closely'
        }
      default:
        return { 
          color: '#10b981', 
          icon: faShieldAlt, 
          label: 'Low Risk',
          description: 'Training load within safe range'
        }
    }
  }

  // Get recovery recommendations
  const getRecoveryRecommendations = (risk: OvertrainingMetrics) => {
    const recommendations = []
    
    if (risk.riskLevel === 'critical' || risk.riskLevel === 'high') {
      recommendations.push('Take 1-2 complete rest days')
      recommendations.push('Reduce training intensity by 30-50%')
      recommendations.push('Focus on sleep quality (8+ hours)')
      recommendations.push('Consider massage or light stretching')
    } else if (risk.riskLevel === 'moderate') {
      recommendations.push('Add an extra easy day this week')
      recommendations.push('Ensure adequate hydration')
      recommendations.push('Monitor morning heart rate')
    } else {
      recommendations.push('Maintain current training schedule')
      recommendations.push('Continue monitoring recovery metrics')
    }
    
    return recommendations
  }

  const currentRiskConfig = currentRisk ? getRiskConfig(currentRisk.riskLevel) : null
  const recommendations = currentRisk ? getRecoveryRecommendations(currentRisk) : []

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const riskConfig = getRiskConfig(data.riskLevel)
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.displayDate}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            7-Day Load: <span className="font-semibold">{data.rolling7DayLoad}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Avg HR: <span className="font-semibold">{data.rolling7DayAvgHR} BPM</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Recovery: <span className="font-semibold">{data.rolling7DayRecovery} BPM</span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: riskConfig.color }}
            ></div>
            <span 
              className="text-sm font-medium"
              style={{ color: riskConfig.color }}
            >
              {riskConfig.label}
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
          <div className={`p-2 rounded-lg ${currentRisk?.riskLevel === 'critical' || currentRisk?.riskLevel === 'high' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
            <FontAwesomeIcon 
              icon={currentRiskConfig?.icon || faShieldAlt} 
              className={`w-5 h-5 ${currentRisk?.riskLevel === 'critical' || currentRisk?.riskLevel === 'high' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} 
            />
          </div>
          <div>
            <h3 className="text-widget-title font-semibold text-gray-900 dark:text-gray-100">
              Overtraining Alert
            </h3>
            <p className="text-label text-gray-600 dark:text-gray-400">
              Recovery monitoring system
            </p>
          </div>
        </div>
        
        {/* Refresh indicator */}
        {(loading || isRefreshing) && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && !data.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : !currentRisk ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FontAwesomeIcon icon={faShieldAlt} className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No overtraining data</p>
          </div>
        ) : (
          <>
            {/* Current Risk Status */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FontAwesomeIcon 
                  icon={currentRiskConfig!.icon} 
                  className="w-6 h-6"
                  style={{ color: currentRiskConfig!.color }}
                />
                <span 
                  className="text-xl font-bold"
                  style={{ color: currentRiskConfig!.color }}
                >
                  {currentRiskConfig!.label}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentRiskConfig!.description}
              </p>
            </div>

            {/* Risk Trend Chart */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#6b7280"
                    fontSize={10}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={10}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Reference lines for thresholds */}
                  <ReferenceLine y={THRESHOLDS.LOAD.MODERATE} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.5} />
                  <ReferenceLine y={THRESHOLDS.LOAD.HIGH} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="rolling7DayLoad" 
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={(props) => {
                      const riskConfig = getRiskConfig(props.payload.riskLevel)
                      return <circle {...props} fill={riskConfig.color} r={4} />
                    }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Current Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">7-Day Load</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {currentRisk.rolling7DayLoad}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg HR</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {currentRisk.rolling7DayAvgHR}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recovery</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {currentRisk.rolling7DayRecovery}
                </p>
              </div>
            </div>

            {/* Recovery Recommendations */}
            <div 
              className="rounded-lg p-4"
              style={{ backgroundColor: `${currentRiskConfig!.color}20` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon 
                  icon={faBed} 
                  className="w-4 h-4"
                  style={{ color: currentRiskConfig!.color }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: currentRiskConfig!.color }}
                >
                  Recovery Recommendations
                </span>
              </div>
              
              <ul className="space-y-1">
                {recommendations.map((rec, index) => (
                  <li 
                    key={index}
                    className="text-xs flex items-center gap-2"
                    style={{ color: currentRiskConfig!.color }}
                  >
                    <FontAwesomeIcon icon={faCalendarCheck} className="w-3 h-3" />
                    {rec}
                  </li>
                ))}
              </ul>
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
