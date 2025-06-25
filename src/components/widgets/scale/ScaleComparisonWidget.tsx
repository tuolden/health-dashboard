/**
 * ScaleComparisonWidget - Before/After comparison component
 * Issue #11 - Displays before and after values for scale sessions
 */

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import ScaleBaseWidget from './ScaleBaseWidget'
import { WidgetProps } from '../../../types/widget'
import Icon from '../../Icon'

interface ScaleComparisonDataPoint {
  date: string
  before?: number
  after?: number
  change?: number
  displayDate?: string
}

interface ScaleComparisonData {
  data: ScaleComparisonDataPoint[]
  metric: string
  unit?: string
  latest_before?: number
  latest_after?: number
  latest_change?: number
}

interface ScaleComparisonWidgetProps extends WidgetProps {
  data: ScaleComparisonData
  icon?: string
  beforeColor?: string
  afterColor?: string
  showChart?: boolean
  precision?: number
}

/**
 * Displays before/after comparison for scale sessions
 */
const ScaleComparisonWidget: React.FC<ScaleComparisonWidgetProps> = ({
  config,
  data,
  dataState,
  onRefresh,
  icon = 'compare',
  beforeColor = '#94a3b8',
  afterColor = '#2563eb',
  showChart = true,
  precision = 1,
  className = ''
}) => {
  const {
    data: chartData = [],
    metric,
    unit = '',
    latest_before,
    latest_after,
    latest_change
  } = data || {}

  // Format chart data for comparison
  const formattedData = chartData.slice(-5).map(point => ({
    ...point,
    displayDate: point.displayDate || new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {data.displayDate}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Before: <span className="font-semibold" style={{ color: beforeColor }}>
                {data.before !== undefined ? `${data.before.toFixed(precision)}${unit}` : 'No data'}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              After: <span className="font-semibold" style={{ color: afterColor }}>
                {data.after !== undefined ? `${data.after.toFixed(precision)}${unit}` : 'No data'}
              </span>
            </p>
            {data.change !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Change: <span className={`font-semibold ${
                  data.change > 0 ? 'text-green-600' : 
                  data.change < 0 ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {data.change > 0 ? '+' : ''}{data.change.toFixed(precision)}{unit}
                </span>
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Format value for display
  const formatValue = (value?: number) => {
    if (value === undefined || value === null) return '--'
    return value.toFixed(precision)
  }

  // Get change direction and color
  const getChangeColor = (change?: number) => {
    if (change === undefined || change === null) return 'text-gray-500'
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const getChangeIcon = (change?: number) => {
    if (change === undefined || change === null) return 'minus'
    if (change > 0) return 'trending-up'
    if (change < 0) return 'trending-down'
    return 'minus'
  }

  return (
    <ScaleBaseWidget
      config={config}
      data={data}
      dataState={dataState}
      onRefresh={onRefresh}
      icon={icon}
      unit={unit}
      className={className}
    >
      <div className="space-y-4">
        {/* Latest Session Summary */}
        <div className="text-center space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            Latest {metric.replace(/_/g, ' ')} Session
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Before */}
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: beforeColor }}>
                {formatValue(latest_before)}
                {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Before</p>
            </div>
            
            {/* After */}
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: afterColor }}>
                {formatValue(latest_after)}
                {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">After</p>
            </div>
          </div>

          {/* Change */}
          {latest_change !== undefined && (
            <div className={`flex items-center justify-center space-x-2 ${getChangeColor(latest_change)}`}>
              <Icon name={getChangeIcon(latest_change)} className="w-4 h-4" />
              <span className="font-medium">
                {latest_change > 0 ? '+' : ''}{formatValue(latest_change)}{unit}
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        {showChart && formattedData.length > 0 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                
                <Bar dataKey="before" fill={beforeColor} name="Before" />
                <Bar dataKey="after" fill={afterColor} name="After" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Sessions Summary */}
        {formattedData.length > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Last {formattedData.length} session{formattedData.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </ScaleBaseWidget>
  )
}

export default ScaleComparisonWidget
