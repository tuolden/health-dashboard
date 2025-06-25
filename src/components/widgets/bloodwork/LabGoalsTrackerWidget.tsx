/**
 * Lab Goals Tracker Widget - Issue #13 Widget #37
 * 
 * Track progress toward specific lab value goals with visual progress indicators
 */

import React, { useState, useEffect } from 'react'
import { Target, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabGoalsTrackerWidgetProps extends LabWidgetProps {
  goals?: LabGoal[]
}

interface LabGoal {
  testName: string
  targetValue: number
  targetOperator: 'less_than' | 'greater_than' | 'between'
  targetRange?: { min: number, max: number }
  priority: 'high' | 'medium' | 'low'
  deadline?: string
  description: string
  units?: string
}

interface GoalProgress {
  goal: LabGoal
  currentValue?: number
  progress: number // 0-100%
  status: 'achieved' | 'on_track' | 'behind' | 'no_data'
  daysToDeadline?: number
  trend: 'improving' | 'stable' | 'declining'
  lastMeasurement?: string
}

export const LabGoalsTrackerWidget: React.FC<LabGoalsTrackerWidgetProps> = ({
  goals = [
    { testName: 'LDL Cholesterol', targetValue: 100, targetOperator: 'less_than', priority: 'high', description: 'Reduce cardiovascular risk', units: 'mg/dL' },
    { testName: 'HDL Cholesterol', targetValue: 60, targetOperator: 'greater_than', priority: 'medium', description: 'Improve heart protection', units: 'mg/dL' },
    { testName: 'Glucose', targetValue: 100, targetOperator: 'less_than', priority: 'high', description: 'Prevent diabetes', units: 'mg/dL' },
    { testName: 'Hemoglobin', targetRange: { min: 12, max: 16 }, targetOperator: 'between', priority: 'medium', description: 'Maintain healthy blood oxygen', units: 'g/dL' }
  ],
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchGoalProgress = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const progressPromises = goals.map(async (goal) => {
        try {
          // Get latest value for this test
          const response = await fetch(`/api/labs/results?enhanced=true&testNames=${encodeURIComponent(goal.testName)}&limit=5`)
          if (!response.ok) return createNoDataProgress(goal)

          const result = await response.json()
          if (!result.success || !result.data || result.data.length === 0) {
            return createNoDataProgress(goal)
          }

          const latestResult = result.data[0]
          return calculateGoalProgress(goal, result.data)
        } catch {
          return createNoDataProgress(goal)
        }
      })

      const progressResults = await Promise.all(progressPromises)
      setGoalProgress(progressResults)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(progressResults)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching goal progress:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const createNoDataProgress = (goal: LabGoal): GoalProgress => ({
    goal,
    progress: 0,
    status: 'no_data',
    trend: 'stable'
  })

  const calculateGoalProgress = (goal: LabGoal, results: any[]): GoalProgress => {
    const latestResult = results[0]
    const currentValue = latestResult.numeric_value

    if (!currentValue) return createNoDataProgress(goal)

    // Calculate progress based on goal type
    let progress = 0
    let status: 'achieved' | 'on_track' | 'behind' | 'no_data' = 'behind'

    switch (goal.targetOperator) {
      case 'less_than':
        if (currentValue <= goal.targetValue) {
          progress = 100
          status = 'achieved'
        } else {
          // Assume starting point is 2x target for progress calculation
          const startingPoint = goal.targetValue * 2
          progress = Math.max(0, ((startingPoint - currentValue) / (startingPoint - goal.targetValue)) * 100)
          status = progress >= 70 ? 'on_track' : 'behind'
        }
        break

      case 'greater_than':
        if (currentValue >= goal.targetValue) {
          progress = 100
          status = 'achieved'
        } else {
          // Assume starting point is 50% of target for progress calculation
          const startingPoint = goal.targetValue * 0.5
          progress = Math.max(0, ((currentValue - startingPoint) / (goal.targetValue - startingPoint)) * 100)
          status = progress >= 70 ? 'on_track' : 'behind'
        }
        break

      case 'between':
        if (goal.targetRange && currentValue >= goal.targetRange.min && currentValue <= goal.targetRange.max) {
          progress = 100
          status = 'achieved'
        } else if (goal.targetRange) {
          const target = (goal.targetRange.min + goal.targetRange.max) / 2
          const range = goal.targetRange.max - goal.targetRange.min
          const distance = Math.abs(currentValue - target)
          progress = Math.max(0, 100 - (distance / range) * 100)
          status = progress >= 70 ? 'on_track' : 'behind'
        }
        break
    }

    // Calculate trend if we have multiple results
    let trend: 'improving' | 'stable' | 'declining' = 'stable'
    if (results.length >= 2) {
      const previousValue = results[1].numeric_value
      if (previousValue) {
        const change = currentValue - previousValue
        const isImproving = (goal.targetOperator === 'less_than' && change < 0) ||
                           (goal.targetOperator === 'greater_than' && change > 0) ||
                           (goal.targetOperator === 'between' && goal.targetRange && 
                            Math.abs(currentValue - (goal.targetRange.min + goal.targetRange.max) / 2) < 
                            Math.abs(previousValue - (goal.targetRange.min + goal.targetRange.max) / 2))
        
        trend = Math.abs(change) < currentValue * 0.05 ? 'stable' : 
                isImproving ? 'improving' : 'declining'
      }
    }

    // Calculate days to deadline
    let daysToDeadline: number | undefined
    if (goal.deadline) {
      const deadlineDate = new Date(goal.deadline)
      const today = new Date()
      daysToDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    return {
      goal,
      currentValue,
      progress: Math.round(progress),
      status,
      daysToDeadline,
      trend,
      lastMeasurement: latestResult.collected_on
    }
  }

  useEffect(() => {
    fetchGoalProgress()
  }, [goals])

  const renderGoalProgress = (goalProg: GoalProgress) => {
    const statusColors = {
      achieved: '#10B981',
      on_track: '#3B82F6',
      behind: '#F59E0B',
      no_data: '#6B7280'
    }

    const trendIcons = {
      improving: <TrendingUp className="h-4 w-4 text-green-500" />,
      stable: <Clock className="h-4 w-4 text-gray-500" />,
      declining: <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />
    }

    const color = statusColors[goalProg.status]

    return (
      <div key={goalProg.goal.testName} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-900">{goalProg.goal.testName}</h4>
            <p className="text-sm text-gray-600">{goalProg.goal.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            {trendIcons[goalProg.trend]}
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ color, backgroundColor: `${color}20` }}
            >
              {goalProg.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium" style={{ color }}>
              {goalProg.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${goalProg.progress}%`, 
                backgroundColor: color 
              }}
            />
          </div>
        </div>

        {/* Current vs Target */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-500">Current</div>
            <div className="font-semibold">
              {goalProg.currentValue ? 
                formatLabValue(goalProg.currentValue, goalProg.goal.units, 1) : 
                'No data'
              }
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Target</div>
            <div className="font-semibold">
              {goalProg.goal.targetOperator === 'between' && goalProg.goal.targetRange ? 
                `${formatLabValue(goalProg.goal.targetRange.min, goalProg.goal.units, 1)} - ${formatLabValue(goalProg.goal.targetRange.max, goalProg.goal.units, 1)}` :
                `${goalProg.goal.targetOperator === 'less_than' ? '<' : '>'} ${formatLabValue(goalProg.goal.targetValue, goalProg.goal.units, 1)}`
              }
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="capitalize">{goalProg.goal.priority} priority</span>
          {goalProg.daysToDeadline && (
            <span>{goalProg.daysToDeadline} days to deadline</span>
          )}
          {goalProg.lastMeasurement && (
            <span>Last: {new Date(goalProg.lastMeasurement).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    )
  }

  const achievedCount = goalProgress.filter(g => g.status === 'achieved').length
  const onTrackCount = goalProgress.filter(g => g.status === 'on_track').length
  const behindCount = goalProgress.filter(g => g.status === 'behind').length

  return (
    <LabBaseWidget
      title="Lab Goals Tracker"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchGoalProgress}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Target className="h-5 w-5 text-blue-600" />}
      headerActions={
        goalProgress.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            {achievedCount > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {achievedCount} achieved
              </span>
            )}
            {onTrackCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {onTrackCount} on track
              </span>
            )}
            {behindCount > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                {behindCount} behind
              </span>
            )}
          </div>
        )
      }
    >
      <div className="space-y-4">
        {goalProgress.length > 0 ? (
          <>
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{achievedCount}</div>
                <div className="text-xs text-gray-500">Achieved</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{onTrackCount}</div>
                <div className="text-xs text-gray-500">On Track</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{behindCount}</div>
                <div className="text-xs text-gray-500">Behind</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-600">{goals.length}</div>
                <div className="text-xs text-gray-500">Total Goals</div>
              </div>
            </div>

            {/* Goals List */}
            <div className="space-y-3">
              {goalProgress
                .sort((a, b) => {
                  // Sort by status priority, then by progress
                  const statusOrder = { achieved: 4, on_track: 3, behind: 2, no_data: 1 }
                  const aOrder = statusOrder[a.status]
                  const bOrder = statusOrder[b.status]
                  
                  if (aOrder !== bOrder) return bOrder - aOrder
                  return b.progress - a.progress
                })
                .map(renderGoalProgress)
              }
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Goals Set</h3>
            <p className="text-gray-500">
              Set lab value goals to track your health progress
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabGoalsTrackerWidget
