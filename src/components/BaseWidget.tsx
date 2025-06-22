import React, { ReactNode } from 'react'
import { WidgetProps, WidgetDataState } from '../types/widget'
import { Card, Button } from '../DesignSystem'
import Icon from './Icon'

interface BaseWidgetProps extends WidgetProps {
  children: ReactNode
  showRefreshButton?: boolean
  customActions?: ReactNode
}

/**
 * BaseWidget - Common wrapper for all dashboard widgets
 * Optimized for vertical screen layouts with consistent styling and behavior
 */
const BaseWidget: React.FC<BaseWidgetProps> = ({
  config,
  data,
  dataState,
  onRefresh,
  children,
  className = '',
  showRefreshButton = true,
  customActions
}) => {
  const { isLoading, isError, lastUpdated, errorMessage } = dataState
  
  // Format last updated time for display
  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString()
  }

  // Get widget size classes for grid positioning
  const getSizeClasses = (): string => {
    const [cols, rows] = config.size
    return `col-span-${cols} row-span-${rows}`
  }

  // Get animation class based on widget theme
  const getAnimationClass = (): string => {
    const animation = config.theme?.animation || 'fade-in'
    return `animate-widget-${animation}`
  }

  return (
    <Card
      variant="default"
      className={`
        ${getSizeClasses()}
        ${getAnimationClass()}
        ${className}
        ${isLoading ? 'opacity-75' : ''}
        ${isError ? 'border-danger border-2' : ''}
      `}
      style={{
        backgroundColor: config.theme?.backgroundColor,
        borderColor: config.theme?.borderColor,
        color: config.theme?.textColor,
      }}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-widget-title">
            {config.title}
          </h3>
          {isLoading && (
            <Icon name="refresh" className="w-3 h-3 text-mutedText" spin />
          )}
          {isError && (
            <Icon name="error" className="w-3 h-3 text-danger" />
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {customActions}
          {showRefreshButton && !isLoading && (
            <Button
              variant="ghost"
              size="xs"
              icon="refresh"
              onClick={onRefresh}
              className="p-1"
            />
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="widget-content">
        {isError ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Icon name="error" className="w-8 h-8 text-danger mb-2" />
            <p className="text-sm text-danger font-medium">Failed to load data</p>
            {errorMessage && (
              <p className="text-xs text-mutedText mt-1">{errorMessage}</p>
            )}
            <Button
              variant="danger"
              size="xs"
              onClick={onRefresh}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Widget Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-lightGray">
        <div className="flex items-center space-x-1 text-label text-mutedText">
          <Icon name="clock" className="w-3 h-3" />
          <span>{formatLastUpdated(lastUpdated)}</span>
        </div>
        
        {data?.source && (
          <span className="text-label text-mutedText capitalize">
            {data.source.replace('-', ' ')}
          </span>
        )}
      </div>
    </Card>
  )
}

export default BaseWidget
