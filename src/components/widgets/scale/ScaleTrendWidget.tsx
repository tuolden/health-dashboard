/**
 * ScaleTrendWidget - Line chart component for scale metric trends
 * Issue #11 - Displays time-series data for scale metrics
 */

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import ScaleBaseWidget from './ScaleBaseWidget'
import { WidgetProps } from '../../../types/widget'

interface ScaleTrendDataPoint {
  date: string
  value?: number
  displayDate?: string
  [key: string]: any
}

interface ScaleTrendData {
  data: ScaleTrendDataPoint[]
  metric: string
  unit?: string
  current_value?: number
  change_amount?: number
  trend_direction?: 'increasing' | 'decreasing' | 'stable'
}

interface ScaleTrendWidgetProps extends WidgetProps {
  data: ScaleTrendData
  icon?: string
  color?: string
  referenceLines?: {
    value: number
    label: string
    color: string
    strokeDasharray?: string
  }[]
  yAxisDomain?: [number, number] | ['auto', 'auto']
  showDots?: boolean
  precision?: number
}

/**
 * Displays a line chart for scale metric trends over time
 */
const ScaleTrendWidget: React.FC<ScaleTrendWidgetProps> = ({
  config,
  data,
  dataState,
  onRefresh,
  icon = 'trending-up',
  color = '#2563eb',
  referenceLines = [],
  yAxisDomain = ['auto', 'auto'],
  showDots = true,
  precision = 1,
  className = ''
}) => {
  const {
    data: chartData = [],
    metric,
    unit = '',
    current_value,
    change_amount,
    trend_direction = 'stable'
  } = data || {}

  // Format chart data with display dates
  const formattedData = chartData.map(point => ({
    ...point,
    displayDate: point.displayDate || new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {data.displayDate}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {metric}: <span className="font-semibold" style={{ color }}>
              {data.value !== undefined ? `${data.value.toFixed(precision)}${unit}` : 'No data'}
            </span>
          </p>
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

  // Get latest value for summary
  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1]?.value : undefined

  return (
    <ScaleBaseWidget
      config={config}
      data={data}
      dataState={dataState}
      onRefresh={onRefresh}
      icon={icon}
      unit={unit}
      showTrend={change_amount !== undefined}
      trendDirection={trend_direction}
      trendValue={change_amount}
      className={className}
    >
      <div className="space-y-4">
        {/* Current Value Summary */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatValue(current_value || latestValue)}
            {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {metric.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Chart */}
        <div className="h-48">
          {formattedData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-2">📊</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">No trend data available</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  domain={yAxisDomain}
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                  label={{ 
                    value: unit ? `${metric.replace(/_/g, ' ')} (${unit})` : metric.replace(/_/g, ' '), 
                    angle: -90, 
                    position: 'insideLeft' 
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference lines */}
                {referenceLines.map((line, index) => (
                  <ReferenceLine 
                    key={index}
                    y={line.value} 
                    stroke={line.color} 
                    strokeDasharray={line.strokeDasharray || "5 5"}
                    label={{ value: line.label, position: 'topRight' }}
                  />
                ))}
                
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color}
                  strokeWidth={2}
                  dot={showDots ? { fill: color, strokeWidth: 2, r: 3 } : false}
                  activeDot={{ r: 5, stroke: color, strokeWidth: 2 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Data Summary */}
        {formattedData.length > 0 && (
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>
              {formattedData.length} data point{formattedData.length !== 1 ? 's' : ''}
            </span>
            <span>
              {formattedData[0]?.displayDate} - {formattedData[formattedData.length - 1]?.displayDate}
            </span>
          </div>
        )}
      </div>
    </ScaleBaseWidget>
  )
}

export default ScaleTrendWidget
