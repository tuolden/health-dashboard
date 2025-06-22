/**
 * GraphQL Steps Widget - Issue #5
 * 
 * Steps widget powered by GraphQL API with real-time updates
 */

import React from 'react'
import { useWidgetData } from '../hooks/useWidgetData'

interface StepsWidgetProps {
  className?: string
}

export const GraphQLStepsWidget: React.FC<StepsWidgetProps> = ({ className = '' }) => {
  const { data, loading, error, refresh, lastUpdated } = useWidgetData({
    widgetType: 'steps',
    enableRealtime: true
  })

  if (loading) {
    return (
      <div className={`bg-widget-default dark:bg-dark-card p-6 rounded-widget shadow-widget transition-colors duration-300 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-widget-default dark:bg-dark-card p-6 rounded-widget shadow-widget transition-colors duration-300 ${className}`}>
        <h3 className="text-widget-title mb-3 text-gray-900 dark:text-dark-text-primary transition-colors duration-300">
          Steps
        </h3>
        <div className="text-red-500 dark:text-red-400">
          <p className="text-sm">Failed to load data</p>
          <button 
            onClick={refresh}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const steps = data?.current?.steps || 0
  const goal = data?.current?.goal || 10000
  const percentage = Math.min((steps / goal) * 100, 100)
  const distance = data?.current?.distance || 0
  const calories = data?.current?.calories || 0

  return (
    <div className={`bg-widget-default dark:bg-dark-card p-6 rounded-widget shadow-widget transition-colors duration-300 ${className}`}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-widget-title text-gray-900 dark:text-dark-text-primary transition-colors duration-300">
          Steps
        </h3>
        <button
          onClick={refresh}
          className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          title="Refresh data"
        >
          <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Main metric */}
      <div className="mb-4">
        <p className="text-metric text-blue-600 dark:text-dark-accent-blue transition-colors duration-300">
          {steps.toLocaleString()}
        </p>
        <p className="text-label text-gray-500 dark:text-dark-text-muted transition-colors duration-300">
          of {goal.toLocaleString()} goal
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 dark:bg-dark-accent-blue h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
          {percentage.toFixed(0)}% complete
        </p>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-label text-gray-500 dark:text-dark-text-muted">Distance</p>
          <p className="text-body font-medium text-gray-900 dark:text-dark-text-primary">
            {distance.toFixed(1)} km
          </p>
        </div>
        <div>
          <p className="text-label text-gray-500 dark:text-dark-text-muted">Calories</p>
          <p className="text-body font-medium text-gray-900 dark:text-dark-text-primary">
            {calories}
          </p>
        </div>
      </div>

      {/* Last updated indicator */}
      {lastUpdated && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-dark-text-muted">
            Updated {Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000)} min ago
          </p>
        </div>
      )}

      {/* Real-time indicator */}
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Real-time updates enabled"></div>
      </div>
    </div>
  )
}

export default GraphQLStepsWidget
