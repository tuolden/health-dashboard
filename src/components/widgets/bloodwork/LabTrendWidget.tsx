/**
 * Lab Trend Widget Component - Issue #13
 * 
 * Displays lab value trends over time with reference lines
 */

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { 
  LabTrendWidgetProps, 
  LabTrend, 
  getRiskLevelColor,
  formatLabValue 
} from './types'

export const LabTrendWidget: React.FC<LabTrendWidgetProps> = ({
  testName,
  title,
  days = 365,
  showReferenceLines = true,
  height = 300,
  className,
  refreshInterval = 300000, // 5 minutes
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [trendData, setTrendData] = useState<LabTrend | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchTrendData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/labs/trends/${encodeURIComponent(testName)}?days=${days}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trend data')
      }

      setTrendData(result.data)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching trend data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendData()
  }, [testName, days])

  const formatChartData = () => {
    if (!trendData?.values) return []

    return trendData.values.map(point => ({
      date: new Date(point.date).toLocaleDateString(),
      value: point.value,
      is_in_range: point.is_in_range,
      formatted_date: new Date(point.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }))
  }

  const getReferenceRange = () => {
    if (!trendData?.values || trendData.values.length === 0) return null

    // Get reference range from the latest lab metrics
    // This would need to be fetched separately or included in the trend data
    // For now, we'll estimate from the data
    const values = trendData.values.map(v => v.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min
    
    return {
      min: min - range * 0.1,
      max: max + range * 0.1
    }
  }

  const renderTrendSummary = () => {
    if (!trendData) return null

    const trendColor = getRiskLevelColor(
      trendData.trend_direction === 'increasing' ? 'elevated' :
      trendData.trend_direction === 'decreasing' ? 'low' : 'normal'
    )

    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Trend: <span style={{ color: trendColor }} className="font-medium capitalize">
              {trendData.trend_direction}
            </span>
          </span>
        </div>
        
        {trendData.change_percentage && (
          <div className="text-sm text-gray-600">
            {trendData.change_percentage > 0 ? '+' : ''}{trendData.change_percentage.toFixed(1)}%
          </div>
        )}
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Value: {formatLabValue(payload[0].value, '', 2)}
          </p>
          <p className={`text-sm ${data.is_in_range ? 'text-green-600' : 'text-red-600'}`}>
            {data.is_in_range ? 'In range' : 'Out of range'}
          </p>
        </div>
      )
    }
    return null
  }

  const chartData = formatChartData()
  const referenceRange = getReferenceRange()

  return (
    <LabBaseWidget
      title={title || `${testName} Trend`}
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchTrendData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Calendar className="h-5 w-5 text-blue-600" />}
      headerActions={
        <div className="text-sm text-gray-500">
          {days} days
        </div>
      }
    >
      {trendData && (
        <div className="space-y-4">
          {renderTrendSummary()}
          
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="formatted_date" 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  domain={referenceRange ? [referenceRange.min, referenceRange.max] : ['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference lines would go here if we had the data */}
                {showReferenceLines && referenceRange && (
                  <>
                    <ReferenceLine 
                      y={referenceRange.min} 
                      stroke="#10B981" 
                      strokeDasharray="5 5" 
                      label="Min"
                    />
                    <ReferenceLine 
                      y={referenceRange.max} 
                      stroke="#10B981" 
                      strokeDasharray="5 5" 
                      label="Max"
                    />
                  </>
                )}
                
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-sm text-gray-500">Latest Value</div>
              <div className="font-semibold">{formatLabValue(trendData.latest_value, '', 2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Data Points</div>
              <div className="font-semibold">{trendData.values.length}</div>
            </div>
          </div>
        </div>
      )}
    </LabBaseWidget>
  )
}

export default LabTrendWidget
