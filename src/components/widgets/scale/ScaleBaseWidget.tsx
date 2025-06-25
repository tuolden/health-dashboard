/**
 * ScaleBaseWidget - Base component for HUME Scale widgets
 * Issue #11 - Provides common functionality for all scale-related widgets
 */

import React, { ReactNode } from 'react'
import BaseWidget from '../../BaseWidget'
import { WidgetProps } from '../../../types/widget'
import Icon from '../../Icon'

interface ScaleBaseWidgetProps extends WidgetProps {
  children: ReactNode
  icon?: string
  unit?: string
  showTrend?: boolean
  trendDirection?: 'increasing' | 'decreasing' | 'stable'
  trendValue?: number
  customActions?: ReactNode
}

/**
 * Base widget wrapper for all HUME scale widgets
 * Provides consistent styling and behavior for scale metrics
 */
const ScaleBaseWidget: React.FC<ScaleBaseWidgetProps> = ({
  config,
  data,
  dataState,
  onRefresh,
  children,
  className = '',
  icon = 'weight-scale',
  unit,
  showTrend = false,
  trendDirection = 'stable',
  trendValue,
  customActions
}) => {
  // Get trend icon and color
  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'increasing':
        return 'trending-up'
      case 'decreasing':
        return 'trending-down'
      default:
        return 'minus'
    }
  }

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'increasing':
        return 'text-green-500'
      case 'decreasing':
        return 'text-red-500'
      default:
        return 'text-gray-400'
    }
  }

  const formatTrendValue = (value?: number) => {
    if (value === undefined || value === null) return ''
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}${unit ? ` ${unit}` : ''}`
  }

  // Custom actions with trend indicator
  const scaleActions = (
    <div className="flex items-center space-x-2">
      {showTrend && trendValue !== undefined && (
        <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
          <Icon name={getTrendIcon()} className="w-3 h-3" />
          <span className="text-xs font-medium">
            {formatTrendValue(trendValue)}
          </span>
        </div>
      )}
      {customActions}
    </div>
  )

  return (
    <BaseWidget
      config={config}
      data={data}
      dataState={dataState}
      onRefresh={onRefresh}
      className={`scale-widget ${className}`}
      customActions={scaleActions}
    >
      <div className="scale-widget-content">
        {children}
      </div>
    </BaseWidget>
  )
}

export default ScaleBaseWidget
