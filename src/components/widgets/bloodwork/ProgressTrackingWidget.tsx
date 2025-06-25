/**
 * Progress Tracking Widget - Issue #13 Widget #25
 * 
 * Tracks progress toward health goals with visual progress indicators
 */

import React, { useState, useEffect } from 'react'
import { Target, TrendingUp, TrendingDown, CheckCircle, Clock } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue } from './types'

interface ProgressTrackingWidgetProps extends LabWidgetProps {
  timeframe?: number // Days to look back
  targetTests?: string[] // Specific tests to track
}

interface ProgressGoal {
  testName: string
  currentValue: number
  targetValue: number
  targetRange: { min: number, max: number }
  progress: number // 0-100%
  status: 'achieved' | 'improving' | 'declining' | 'stable'
  trend: 'up' | 'down' | 'stable'
  daysTracked: number
  improvementRate: number // Change per day
  estimatedDaysToGoal?: number
  units?: string
  description: string
}

export const ProgressTrackingWidget: React.FC<ProgressTrackingWidgetProps> = ({
  timeframe = 180, // 6 months default
  targetTests = ['LDL Cholesterol', 'HDL Cholesterol', 'Glucose', 'Hemoglobin', 'Creatinine'],
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [goals, setGoals] = useState<ProgressGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchProgress = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Get trends for target tests
      const progressPromises = targetTests.map(async (testName) => {
        try {
          const response = await fetch(`/api/labs/trends/${encodeURIComponent(testName)}?days=${timeframe}`)
          if (!response.ok) return null
          
          const result = await response.json()
          if (!result.success) return null
          
          return { testName, trend: result.data }
        } catch {
          return null
        }
      })

      const progressResults = await Promise.all(progressPromises)
      const validResults = progressResults.filter(r => r !== null)

      // Calculate progress goals
      const calculatedGoals = validResults
        .map(result => calculateProgress(result!.testName, result!.trend))
        .filter(goal => goal !== null) as ProgressGoal[]

      setGoals(calculatedGoals)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(calculatedGoals)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching progress data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateProgress = (testName: string, trendData: any): ProgressGoal | null => {
    if (!trendData?.values || trendData.values.length < 2) return null

    const values = trendData.values
    const currentValue = trendData.latest_value
    const oldestValue = values[0].value
    const daysTracked = values.length

    // Define target ranges for common tests
    const targetRanges: { [key: string]: { min: number, max: number, optimal: number, description: string } } = {
      'LDL Cholesterol': { min: 0, max: 100, optimal: 70, description: 'Lower LDL reduces heart disease risk' },
      'HDL Cholesterol': { min: 60, max: 100, optimal: 70, description: 'Higher HDL protects against heart disease' },
      'Glucose': { min: 70, max: 99, optimal: 85, description: 'Stable glucose prevents diabetes' },
      'Hemoglobin': { min: 12, max: 16, optimal: 14, description: 'Optimal hemoglobin prevents anemia' },
      'Creatinine': { min: 0.6, max: 1.2, optimal: 0.9, description: 'Lower creatinine indicates good kidney function' },
      'Total Cholesterol': { min: 0, max: 200, optimal: 180, description: 'Lower total cholesterol reduces cardiovascular risk' },
      'Triglycerides': { min: 0, max: 150, optimal: 100, description: 'Lower triglycerides improve heart health' },
      'TSH': { min: 0.5, max: 4.5, optimal: 2.0, description: 'Balanced TSH indicates healthy thyroid function' }
    }

    const target = targetRanges[testName]
    if (!target) return null

    // Calculate progress toward optimal value
    const targetValue = target.optimal
    const targetRange = { min: target.min, max: target.max }
    
    // Calculate how close we are to the target (0-100%)
    let progress: number
    if (testName === 'HDL Cholesterol') {
      // For HDL, higher is better
      progress = Math.min(100, Math.max(0, (currentValue / targetValue) * 100))
    } else {
      // For most tests, closer to optimal is better
      const distanceFromTarget = Math.abs(currentValue - targetValue)
      const maxDistance = Math.max(Math.abs(target.min - targetValue), Math.abs(target.max - targetValue))
      progress = Math.max(0, 100 - (distanceFromTarget / maxDistance) * 100)
    }

    // Determine trend
    const changeFromStart = currentValue - oldestValue
    const improvementRate = changeFromStart / daysTracked
    
    let trend: 'up' | 'down' | 'stable'
    if (Math.abs(changeFromStart) < (targetValue * 0.05)) { // Less than 5% change
      trend = 'stable'
    } else {
      trend = changeFromStart > 0 ? 'up' : 'down'
    }

    // Determine status based on trend and target
    let status: 'achieved' | 'improving' | 'declining' | 'stable'
    const isInTargetRange = currentValue >= targetRange.min && currentValue <= targetRange.max
    
    if (isInTargetRange && progress >= 90) {
      status = 'achieved'
    } else if (testName === 'HDL Cholesterol') {
      // For HDL, increasing is improving
      status = trend === 'up' ? 'improving' : trend === 'down' ? 'declining' : 'stable'
    } else {
      // For most tests, moving toward target is improving
      const movingTowardTarget = (currentValue > targetValue && trend === 'down') || 
                                (currentValue < targetValue && trend === 'up')
      status = movingTowardTarget ? 'improving' : 
               trend === 'stable' ? 'stable' : 'declining'
    }

    // Estimate days to goal
    let estimatedDaysToGoal: number | undefined
    if (status === 'improving' && improvementRate !== 0) {
      const remainingDistance = Math.abs(currentValue - targetValue)
      estimatedDaysToGoal = Math.round(remainingDistance / Math.abs(improvementRate))
      // Cap at reasonable timeframe
      if (estimatedDaysToGoal > 365) estimatedDaysToGoal = undefined
    }

    return {
      testName,
      currentValue,
      targetValue,
      targetRange,
      progress: Math.round(progress),
      status,
      trend,
      daysTracked,
      improvementRate,
      estimatedDaysToGoal,
      units: trendData.values[0]?.units,
      description: target.description
    }
  }

  useEffect(() => {
    fetchProgress()
  }, [timeframe, targetTests])

  const renderProgressGoal = (goal: ProgressGoal) => {
    const statusColors = {
      achieved: { color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
      improving: { color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
      declining: { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
      stable: { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' }
    }

    const colors = statusColors[goal.status]
    
    const statusIcons = {
      achieved: <CheckCircle className="h-5 w-5" style={{ color: colors.color }} />,
      improving: <TrendingUp className="h-5 w-5" style={{ color: colors.color }} />,
      declining: <TrendingDown className="h-5 w-5" style={{ color: colors.color }} />,
      stable: <Clock className="h-5 w-5" style={{ color: colors.color }} />
    }

    return (
      <div 
        key={goal.testName}
        className="p-4 rounded-lg border"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {statusIcons[goal.status]}
            <h4 className="font-medium text-gray-900">{goal.testName}</h4>
          </div>
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium capitalize"
            style={{ color: colors.color, backgroundColor: 'white' }}
          >
            {goal.status}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Progress to Goal</span>
            <span className="text-sm font-medium" style={{ color: colors.color }}>
              {goal.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${goal.progress}%`, 
                backgroundColor: colors.color 
              }}
            />
          </div>
        </div>

        {/* Current vs Target */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-500">Current</div>
            <div className="font-semibold">
              {formatLabValue(goal.currentValue, goal.units, 1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Target</div>
            <div className="font-semibold">
              {formatLabValue(goal.targetValue, goal.units, 1)}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-2">{goal.description}</p>

        {/* Timeline */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{goal.daysTracked} days tracked</span>
          {goal.estimatedDaysToGoal && (
            <span>~{goal.estimatedDaysToGoal} days to goal</span>
          )}
        </div>
      </div>
    )
  }

  const achievedGoals = goals.filter(g => g.status === 'achieved').length
  const improvingGoals = goals.filter(g => g.status === 'improving').length

  return (
    <LabBaseWidget
      title="Progress Tracking"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchProgress}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Target className="h-5 w-5 text-blue-600" />}
      headerActions={
        goals.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            {achievedGoals > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {achievedGoals} achieved
              </span>
            )}
            {improvingGoals > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {improvingGoals} improving
              </span>
            )}
          </div>
        )
      }
    >
      <div className="space-y-4">
        {goals.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <strong>Tracking {goals.length} health goals</strong> over the past {Math.round(timeframe / 30)} months
              </div>
            </div>

            {/* Goals List */}
            <div className="space-y-3">
              {goals.map(renderProgressGoal)}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Progress Data</h3>
            <p className="text-gray-500">
              Need at least 2 lab results over time to track progress
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default ProgressTrackingWidget
