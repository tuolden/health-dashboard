/**
 * Lab Trend Analysis Widget - Issue #13 Widget #36
 * 
 * Advanced trend analysis with multiple timeframes and statistical insights
 */

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabTrendAnalysisWidgetProps extends LabWidgetProps {
  testName: string
  timeframes?: number[]
}

interface TrendAnalysis {
  testName: string
  timeframe: number
  slope: number
  rSquared: number
  direction: 'increasing' | 'decreasing' | 'stable'
  significance: 'high' | 'medium' | 'low'
  dataPoints: number
  averageValue: number
  volatility: number
  chartData: Array<{
    date: string
    value: number
    trendLine: number
  }>
  units?: string
}

export const LabTrendAnalysisWidget: React.FC<LabTrendAnalysisWidgetProps> = ({
  testName,
  timeframes = [30, 90, 180, 365],
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [trends, setTrends] = useState<TrendAnalysis[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(timeframes[0])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchTrendAnalysis = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const trendPromises = timeframes.map(async (days) => {
        try {
          const response = await fetch(`/api/labs/trends/${encodeURIComponent(testName)}?days=${days}`)
          if (!response.ok) return null

          const result = await response.json()
          if (!result.success || !result.data?.values) return null

          return calculateTrendAnalysis(result.data, days)
        } catch {
          return null
        }
      })

      const trendResults = await Promise.all(trendPromises)
      const validTrends = trendResults.filter(t => t !== null) as TrendAnalysis[]

      setTrends(validTrends)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(validTrends)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching trend analysis:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTrendAnalysis = (trendData: any, timeframe: number): TrendAnalysis | null => {
    const values = trendData.values
      .filter((v: any) => v.value !== null && v.value !== undefined)
      .map((v: any, index: number) => ({
        date: v.date,
        value: v.value,
        index
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (values.length < 3) return null

    // Linear regression
    const n = values.length
    const sumX = values.reduce((sum, _, i) => sum + i, 0)
    const sumY = values.reduce((sum, v) => sum + v.value, 0)
    const sumXY = values.reduce((sum, v, i) => sum + i * v.value, 0)
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const meanY = sumY / n
    const ssRes = values.reduce((sum, v, i) => {
      const predicted = slope * i + intercept
      return sum + Math.pow(v.value - predicted, 2)
    }, 0)
    const ssTot = values.reduce((sum, v) => sum + Math.pow(v.value - meanY, 2), 0)
    const rSquared = Math.max(0, 1 - (ssRes / ssTot))

    // Determine direction and significance
    const direction = Math.abs(slope) < 0.01 ? 'stable' : slope > 0 ? 'increasing' : 'decreasing'
    const significance = rSquared >= 0.7 ? 'high' : rSquared >= 0.4 ? 'medium' : 'low'

    // Calculate volatility (coefficient of variation)
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v.value - meanY, 2), 0) / n)
    const volatility = (stdDev / meanY) * 100

    // Generate chart data with trend line
    const chartData = values.map((v, i) => ({
      date: v.date,
      value: v.value,
      trendLine: slope * i + intercept
    }))

    return {
      testName,
      timeframe,
      slope,
      rSquared,
      direction,
      significance,
      dataPoints: n,
      averageValue: meanY,
      volatility,
      chartData,
      units: values[0]?.units
    }
  }

  useEffect(() => {
    fetchTrendAnalysis()
  }, [testName, timeframes])

  const selectedTrend = trends.find(t => t.timeframe === selectedTimeframe)

  const renderTrendSummary = (trend: TrendAnalysis) => {
    const directionColors = {
      increasing: '#EF4444',
      decreasing: '#10B981',
      stable: '#6B7280'
    }

    const significanceColors = {
      high: '#DC2626',
      medium: '#F59E0B',
      low: '#6B7280'
    }

    const directionColor = directionColors[trend.direction]
    const significanceColor = significanceColors[trend.significance]

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold" style={{ color: directionColor }}>
            {trend.direction.toUpperCase()}
          </div>
          <div className="text-xs text-gray-500">Direction</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold" style={{ color: significanceColor }}>
            {(trend.rSquared * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">R² Confidence</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {formatLabValue(trend.averageValue, trend.units, 1)}
          </div>
          <div className="text-xs text-gray-500">Average</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {trend.volatility.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Volatility</div>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-blue-600">
            Actual: {formatLabValue(payload[0]?.value || 0, selectedTrend?.units, 1)}
          </p>
          <p className="text-red-600">
            Trend: {formatLabValue(payload[1]?.value || 0, selectedTrend?.units, 1)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <LabBaseWidget
      title={`Trend Analysis: ${testName}`}
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchTrendAnalysis}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            {timeframes.map(days => (
              <option key={days} value={days}>
                {days} days
              </option>
            ))}
          </select>
          {selectedTrend && (
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ 
                color: selectedTrend.direction === 'increasing' ? '#EF4444' : 
                       selectedTrend.direction === 'decreasing' ? '#10B981' : '#6B7280',
                backgroundColor: selectedTrend.direction === 'increasing' ? '#FEF2F2' : 
                                selectedTrend.direction === 'decreasing' ? '#ECFDF5' : '#F9FAFB'
              }}
            >
              {selectedTrend.direction}
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {selectedTrend ? (
          <>
            {/* Summary Stats */}
            {renderTrendSummary(selectedTrend)}

            {/* Chart */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Trend Visualization ({selectedTimeframe} days)
              </h4>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedTrend.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="trendLine"
                      stroke="#EF4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Trend"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Statistical Analysis</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Trend Direction:</strong> {selectedTrend.direction} over {selectedTimeframe} days</p>
                <p>• <strong>Statistical Confidence:</strong> {selectedTrend.significance} (R² = {(selectedTrend.rSquared * 100).toFixed(1)}%)</p>
                <p>• <strong>Data Points:</strong> {selectedTrend.dataPoints} measurements</p>
                <p>• <strong>Volatility:</strong> {selectedTrend.volatility.toFixed(1)}% coefficient of variation</p>
                <p>• <strong>Slope:</strong> {selectedTrend.slope.toFixed(4)} units per measurement</p>
              </div>
            </div>

            {/* Comparison Across Timeframes */}
            {trends.length > 1 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Timeframe Comparison</h4>
                <div className="space-y-2">
                  {trends.map(trend => (
                    <div key={trend.timeframe} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{trend.timeframe} days</span>
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium capitalize"
                          style={{ 
                            color: trend.direction === 'increasing' ? '#EF4444' : 
                                   trend.direction === 'decreasing' ? '#10B981' : '#6B7280',
                            backgroundColor: trend.direction === 'increasing' ? '#FEF2F2' : 
                                            trend.direction === 'decreasing' ? '#ECFDF5' : '#F9FAFB'
                          }}
                        >
                          {trend.direction}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        R² {(trend.rSquared * 100).toFixed(0)}% • {trend.dataPoints} points
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Trend Data</h3>
            <p className="text-gray-500">
              Insufficient data for trend analysis. Need at least 3 data points.
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabTrendAnalysisWidget
