/**
 * Lab Base Widget Component - Issue #13
 * 
 * Base component for all bloodwork lab widgets with common functionality
 */

import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, Activity } from 'lucide-react'
import { LabWidgetProps } from './types'

interface LabBaseWidgetProps extends LabWidgetProps {
  title: string
  children: React.ReactNode
  isLoading?: boolean
  error?: string | null
  lastUpdated?: string
  onRefresh?: () => void
  icon?: React.ReactNode
  headerActions?: React.ReactNode
}

export const LabBaseWidget: React.FC<LabBaseWidgetProps> = ({
  title,
  children,
  className = '',
  isLoading = false,
  error = null,
  lastUpdated,
  onRefresh,
  refreshInterval,
  showRefreshButton = true,
  icon,
  headerActions,
  onError,
  onDataUpdate
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(!!refreshInterval)

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefreshEnabled || !refreshInterval || !onRefresh) return

    const interval = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        handleRefresh()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, refreshInterval, onRefresh, isLoading, isRefreshing])

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (err) {
      console.error('Widget refresh error:', err)
      if (onError) {
        onError(err instanceof Error ? err : new Error('Refresh failed'))
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, isRefreshing, onError])

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled)
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          {icon || <Activity className="h-5 w-5 text-blue-600" />}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {headerActions}
          
          {/* Auto-refresh toggle */}
          {refreshInterval && (
            <button
              onClick={toggleAutoRefresh}
              className={`p-1 rounded-md transition-colors ${
                autoRefreshEnabled
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
              title={`Auto-refresh ${autoRefreshEnabled ? 'enabled' : 'disabled'}`}
            >
              <Activity className="h-4 w-4" />
            </button>
          )}
          
          {/* Manual refresh button */}
          {showRefreshButton && onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error ? (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error loading data</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2 text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading lab data...</span>
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      {lastUpdated && !error && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  )
}

export default LabBaseWidget
