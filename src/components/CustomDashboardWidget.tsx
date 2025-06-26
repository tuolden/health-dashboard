/**
 * Custom Dashboard Widget Wrapper - Issue #15
 * 
 * Wrapper component that renders actual widgets with time range integration
 */

import React from 'react'
import { getEnabledWidgets } from '../widgets/widgets.config'

// Import widget components
import { HealthScoreSummaryWidget } from './widgets/bloodwork/HealthScoreSummaryWidget'
import { CBCSummaryWidget } from './widgets/bloodwork/CBCSummaryWidget'
import { LipidPanelWidget } from './widgets/bloodwork/LipidPanelWidget'
import { GlucoseWidget } from './widgets/bloodwork/GlucoseWidget'
import { HemoglobinWidget } from './widgets/bloodwork/HemoglobinWidget'
import { ThyroidPanelWidget } from './widgets/bloodwork/ThyroidPanelWidget'
import { CpapSpo2TrendWidget } from './widgets/CpapSpo2TrendWidget'
import { CpapSpo2PulseWidget } from './widgets/CpapSpo2PulseWidget'
import { WorkoutHeartRateWidget } from './widgets/WorkoutHeartRateWidget'

interface CustomDashboardWidgetProps {
  widgetType: string
  size: 'small' | 'medium' | 'large'
  timeRange: string
  widgetConfig: Record<string, any>
  darkMode?: boolean
}

/**
 * Custom Dashboard Widget Wrapper
 * Renders the appropriate widget component based on widget type
 */
const CustomDashboardWidget: React.FC<CustomDashboardWidgetProps> = ({
  widgetType,
  size,
  timeRange,
  widgetConfig,
  darkMode = false
}) => {
  console.log('🧩 [CustomDashboardWidget] Rendering:', widgetType, size, timeRange)

  // Get widget configuration
  const enabledWidgets = getEnabledWidgets()
  const widgetConfig_meta = enabledWidgets.find(w => w.id === widgetType)

  if (!widgetConfig_meta) {
    console.warn('⚠️ [CustomDashboardWidget] Unknown widget type:', widgetType)
    return (
      <div className={`
        p-4 rounded-lg border-2 border-dashed
        ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-50 text-gray-600'}
      `}>
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="font-medium">Unknown Widget</div>
          <div className="text-sm mt-1">{widgetType}</div>
        </div>
      </div>
    )
  }

  // Convert time range to widget-compatible format
  const getTimeRangeParams = (timeRange: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (timeRange) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }
      case 'yesterday': {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return {
          startDate: yesterday.toISOString().split('T')[0],
          endDate: yesterday.toISOString().split('T')[0]
        }
      }
      case 'this_week': {
        const weekStart = new Date(today)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        return {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }
      }
      case 'last_2_weeks': {
        const twoWeeksAgo = new Date(today)
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
        return {
          startDate: twoWeeksAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }
      }
      case 'last_month': {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return {
          startDate: monthAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }
      }
      case 'mom': {
        const lastMonth = new Date(today)
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
        const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
        return {
          startDate: lastMonthStart.toISOString().split('T')[0],
          endDate: lastMonthEnd.toISOString().split('T')[0]
        }
      }
      case 'last_year': {
        const yearAgo = new Date(today)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        return {
          startDate: yearAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }
      }
      default:
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }
    }
  }

  const timeParams = getTimeRangeParams(timeRange)

  // Common widget props
  const commonProps = {
    ...timeParams,
    ...widgetConfig,
    className: `custom-dashboard-widget size-${size}`,
    style: {
      height: '100%',
      minHeight: size === 'small' ? '120px' : size === 'medium' ? '140px' : '160px'
    }
  }

  // Render the appropriate widget component
  const renderWidget = () => {
    switch (widgetType) {
      // Bloodwork Widgets
      case 'lab-health-score-summary':
      case 'health-score-summary':
        return <HealthScoreSummaryWidget {...commonProps} />
      case 'lab-cbc-summary':
      case 'cbc-summary':
        return <CBCSummaryWidget {...commonProps} />
      case 'lab-lipid-panel':
      case 'lipid-panel':
        return <LipidPanelWidget {...commonProps} />
      case 'lab-glucose':
      case 'glucose-monitoring':
        return <GlucoseWidget {...commonProps} />
      case 'lab-hemoglobin':
      case 'hemoglobin-levels':
        return <HemoglobinWidget {...commonProps} />
      case 'lab-thyroid-panel':
      case 'thyroid-panel':
        return <ThyroidPanelWidget {...commonProps} />
      
      // CPAP Widgets
      case 'cpap-spo2-trend':
        return <CpapSpo2TrendWidget {...commonProps} />
      case 'cpap-spo2-pulse':
        return <CpapSpo2PulseWidget {...commonProps} />

      // Workout Widgets
      case 'workout-heart-rate':
        return <WorkoutHeartRateWidget {...commonProps} />
      
      // Fallback for other widgets
      default:
        return (
          <div className={`
            p-4 rounded-lg border
            ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white text-gray-900'}
          `}>
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">{widgetConfig_meta.title}</div>
              <div className="text-sm mt-1 opacity-75">
                {size.toUpperCase()} • {timeRange.replace('_', ' ')}
              </div>
              <div className="text-xs mt-2 opacity-50">
                Widget implementation pending
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className={`
      custom-dashboard-widget-wrapper
      ${darkMode ? 'dark' : ''}
    `}>
      {renderWidget()}
    </div>
  )
}

export default CustomDashboardWidget
