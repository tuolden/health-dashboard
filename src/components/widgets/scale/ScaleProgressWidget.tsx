/**
 * ScaleProgressWidget - Progress tracking component for scale goals
 * Issue #11 - Displays progress toward weight/health goals
 */

import React from 'react'
import ScaleBaseWidget from './ScaleBaseWidget'
import { WidgetProps } from '../../../types/widget'
import Icon from '../../Icon'

interface ScaleProgressData {
  current_value?: number
  goal_value?: number
  start_value?: number
  progress_percentage?: number
  remaining_amount?: number
  estimated_completion_date?: string
  unit?: string
  metric: string
}

interface ScaleProgressWidgetProps extends WidgetProps {
  data: ScaleProgressData
  icon?: string
  progressColor?: string
  showEstimatedCompletion?: boolean
  precision?: number
}

/**
 * Displays progress toward scale-related goals
 */
const ScaleProgressWidget: React.FC<ScaleProgressWidgetProps> = ({
  config,
  data,
  dataState,
  onRefresh,
  icon = 'target',
  progressColor = '#2563eb',
  showEstimatedCompletion = true,
  precision = 1,
  className = ''
}) => {
  const {
    current_value,
    goal_value,
    start_value,
    progress_percentage,
    remaining_amount,
    estimated_completion_date,
    unit = '',
    metric
  } = data || {}

  // Calculate progress if not provided
  const calculateProgress = () => {
    if (progress_percentage !== undefined) return progress_percentage
    if (!current_value || !goal_value || !start_value) return 0
    
    const totalChange = goal_value - start_value
    const currentChange = current_value - start_value
    
    if (totalChange === 0) return 100
    return Math.max(0, Math.min(100, (currentChange / totalChange) * 100))
  }

  const progress = calculateProgress()

  // Calculate remaining if not provided
  const calculateRemaining = () => {
    if (remaining_amount !== undefined) return remaining_amount
    if (!current_value || !goal_value) return 0
    return goal_value - current_value
  }

  const remaining = calculateRemaining()

  // Format value for display
  const formatValue = (value?: number) => {
    if (value === undefined || value === null) return '--'
    return value.toFixed(precision)
  }

  // Get progress color based on percentage
  const getProgressColor = () => {
    if (progress >= 90) return '#10b981' // green
    if (progress >= 70) return '#3b82f6' // blue
    if (progress >= 50) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  // Get status message
  const getStatusMessage = () => {
    if (progress >= 100) return 'Goal achieved! 🎉'
    if (progress >= 90) return 'Almost there!'
    if (progress >= 70) return 'Great progress!'
    if (progress >= 50) return 'Halfway there!'
    if (progress >= 25) return 'Good start!'
    return 'Just getting started'
  }

  // Get trend direction based on remaining
  const getTrendDirection = (): 'increasing' | 'decreasing' | 'stable' => {
    if (!remaining || Math.abs(remaining) < 0.1) return 'stable'
    return remaining > 0 ? 'decreasing' : 'increasing'
  }

  return (
    <ScaleBaseWidget
      config={config}
      data={data}
      dataState={dataState}
      onRefresh={onRefresh}
      icon={icon}
      unit={unit}
      showTrend={remaining !== undefined}
      trendDirection={getTrendDirection()}
      trendValue={remaining}
      className={className}
    >
      <div className="space-y-4">
        {/* Goal Summary */}
        <div className="text-center space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            {metric.replace(/_/g, ' ')} Goal
          </h4>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-gray-600 dark:text-gray-400">
                {formatValue(start_value)}{unit}
              </div>
              <p className="text-gray-500">Start</p>
            </div>
            
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {formatValue(current_value)}{unit}
              </div>
              <p className="text-gray-500">Current</p>
            </div>
            
            <div className="text-center">
              <div className="font-bold text-gray-600 dark:text-gray-400">
                {formatValue(goal_value)}{unit}
              </div>
              <p className="text-gray-500">Goal</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {progress.toFixed(0)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: getProgressColor()
              }}
            />
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getStatusMessage()}
            </p>
          </div>
        </div>

        {/* Remaining Amount */}
        {remaining !== undefined && remaining !== 0 && (
          <div className="text-center">
            <div className={`text-lg font-bold ${
              remaining > 0 ? 'text-blue-600' : 'text-green-600'
            }`}>
              {remaining > 0 ? '' : '+'}{Math.abs(remaining).toFixed(precision)}{unit}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {remaining > 0 ? 'remaining' : 'exceeded goal'}
            </p>
          </div>
        )}

        {/* Estimated Completion */}
        {showEstimatedCompletion && estimated_completion_date && progress < 100 && (
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center space-x-1 text-gray-600 dark:text-gray-400">
              <Icon name="calendar" className="w-3 h-3" />
              <span className="text-xs">Estimated completion</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {new Date(estimated_completion_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        )}

        {/* Achievement Badge */}
        {progress >= 100 && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
              <Icon name="check-circle" className="w-4 h-4" />
              <span className="text-sm font-medium">Goal Achieved!</span>
            </div>
          </div>
        )}
      </div>
    </ScaleBaseWidget>
  )
}

export default ScaleProgressWidget
