/**
 * ScaleNumberWidget - Number display component for scale metrics
 * Issue #11 - Displays single numeric values with optional comparison
 */

import React from 'react'
import ScaleBaseWidget from './ScaleBaseWidget'
import { WidgetProps } from '../../../types/widget'
import Icon from '../../Icon'

interface ScaleNumberData {
  current_value?: number
  previous_value?: number
  change_amount?: number
  change_percentage?: number
  trend_direction?: 'increasing' | 'decreasing' | 'stable'
  unit?: string
  label?: string
  date?: string
}

interface ScaleNumberWidgetProps extends WidgetProps {
  data: ScaleNumberData
  icon?: string
  precision?: number
  showComparison?: boolean
  goalValue?: number
  thresholds?: {
    good?: number
    warning?: number
    danger?: number
  }
}

/**
 * Displays a single numeric scale metric with optional trend and comparison
 */
const ScaleNumberWidget: React.FC<ScaleNumberWidgetProps> = ({
  config,
  data,
  dataState,
  onRefresh,
  icon = 'weight-scale',
  precision = 1,
  showComparison = true,
  goalValue,
  thresholds,
  className = ''
}) => {
  const {
    current_value,
    previous_value,
    change_amount,
    change_percentage,
    trend_direction = 'stable',
    unit = '',
    label,
    date
  } = data || {}

  // Format the main value
  const formatValue = (value?: number) => {
    if (value === undefined || value === null) return '--'
    return value.toFixed(precision)
  }

  // Format change values
  const formatChange = (value?: number, isPercentage = false) => {
    if (value === undefined || value === null) return ''
    const sign = value > 0 ? '+' : ''
    const suffix = isPercentage ? '%' : unit
    return `${sign}${value.toFixed(precision)}${suffix}`
  }

  // Get value color based on thresholds
  const getValueColor = () => {
    if (!current_value || !thresholds) return 'text-gray-900 dark:text-gray-100'
    
    if (thresholds.danger && current_value >= thresholds.danger) {
      return 'text-red-600 dark:text-red-400'
    }
    if (thresholds.warning && current_value >= thresholds.warning) {
      return 'text-yellow-600 dark:text-yellow-400'
    }
    if (thresholds.good && current_value >= thresholds.good) {
      return 'text-green-600 dark:text-green-400'
    }
    
    return 'text-gray-900 dark:text-gray-100'
  }

  // Get progress toward goal
  const getGoalProgress = () => {
    if (!current_value || !goalValue) return null
    const progress = (current_value / goalValue) * 100
    return Math.min(progress, 100)
  }

  return (
    <ScaleBaseWidget
      config={config}
      data={data}
      dataState={dataState}
      onRefresh={onRefresh}
      icon={icon}
      unit={unit}
      showTrend={showComparison && change_amount !== undefined}
      trendDirection={trend_direction}
      trendValue={change_amount}
      className={className}
    >
      <div className="text-center space-y-3">
        {/* Main Value */}
        <div className="space-y-1">
          <div className={`text-4xl font-bold ${getValueColor()}`}>
            {formatValue(current_value)}
            {unit && <span className="text-2xl text-gray-500 ml-1">{unit}</span>}
          </div>
          
          {label && (
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {label}
            </p>
          )}
          
          {date && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Comparison with previous value */}
        {showComparison && previous_value !== undefined && change_amount !== undefined && (
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              <span className="text-xs">Previous: </span>
              <span className="font-medium">{formatValue(previous_value)}{unit}</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${
              trend_direction === 'increasing' ? 'text-green-600' :
              trend_direction === 'decreasing' ? 'text-red-600' :
              'text-gray-500'
            }`}>
              <Icon 
                name={
                  trend_direction === 'increasing' ? 'trending-up' :
                  trend_direction === 'decreasing' ? 'trending-down' :
                  'minus'
                } 
                className="w-3 h-3" 
              />
              <span className="font-medium">
                {formatChange(change_amount)}
              </span>
              {change_percentage !== undefined && (
                <span className="text-xs">
                  ({formatChange(change_percentage, true)})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Goal Progress */}
        {goalValue && current_value && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Goal: {formatValue(goalValue)}{unit}</span>
              <span>{getGoalProgress()?.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getGoalProgress() || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Threshold indicators */}
        {thresholds && current_value && (
          <div className="flex justify-center space-x-4 text-xs">
            {thresholds.good && (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Good: {thresholds.good}+</span>
              </div>
            )}
            {thresholds.warning && (
              <div className="flex items-center space-x-1 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>Warning: {thresholds.warning}+</span>
              </div>
            )}
            {thresholds.danger && (
              <div className="flex items-center space-x-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Danger: {thresholds.danger}+</span>
              </div>
            )}
          </div>
        )}
      </div>
    </ScaleBaseWidget>
  )
}

export default ScaleNumberWidget
