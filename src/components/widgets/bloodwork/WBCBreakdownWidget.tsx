/**
 * WBC Breakdown Widget - Issue #13 Widget #2
 * 
 * White Blood Cell differential breakdown with percentages
 */

import React, { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Shield } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue } from './types'

interface WBCBreakdownWidgetProps extends LabWidgetProps {
  collectedOn?: string
}

const WBC_TESTS = [
  'Neutrophils',
  'Lymphocytes', 
  'Monocytes',
  'Eosinophils',
  'Basophils'
]

const WBC_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6'  // purple
]

export const WBCBreakdownWidget: React.FC<WBCBreakdownWidgetProps> = ({
  collectedOn,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [wbcData, setWbcData] = useState<EnhancedLabResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchWBCData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        enhanced: 'true',
        testNames: WBC_TESTS.join(',')
      })

      if (collectedOn) {
        params.append('startDate', collectedOn)
        params.append('endDate', collectedOn)
      }

      const response = await fetch(`/api/labs/results?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch WBC data')
      }

      setWbcData(result.data)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching WBC data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWBCData()
  }, [collectedOn])

  const formatChartData = () => {
    return wbcData
      .filter(item => item.numeric_value && item.numeric_value > 0)
      .map((item, index) => ({
        name: item.test_name,
        value: item.numeric_value || 0,
        percentage: item.numeric_value || 0,
        color: WBC_COLORS[index % WBC_COLORS.length],
        units: item.metric?.units || '%',
        is_in_range: item.is_in_range
      }))
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p style={{ color: data.color }}>
            Value: {formatLabValue(data.value, data.units, 1)}
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
  const totalWBC = wbcData.find(item => item.test_name === 'WBC')

  return (
    <LabBaseWidget
      title="WBC Breakdown"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchWBCData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Shield className="h-5 w-5 text-blue-600" />}
    >
      <div className="space-y-4">
        {/* Total WBC Count */}
        {totalWBC && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total WBC Count</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatLabValue(totalWBC.value, totalWBC.metric?.units)}
            </div>
            {totalWBC.metric?.range_min && totalWBC.metric?.range_max && (
              <div className="text-sm text-blue-600">
                Normal: {formatLabValue(totalWBC.metric.range_min, totalWBC.metric.units)} - {formatLabValue(totalWBC.metric.range_max, totalWBC.metric.units)}
              </div>
            )}
          </div>
        )}

        {/* Pie Chart */}
        {chartData.length > 0 && (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed Breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Differential Count</h4>
          {wbcData.map((item, index) => {
            if (!WBC_TESTS.includes(item.test_name)) return null
            
            const color = WBC_COLORS[index % WBC_COLORS.length]
            return (
              <div key={item.test_name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium">{item.test_name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatLabValue(item.value, item.metric?.units)}
                  </div>
                  {item.metric?.range_min && item.metric?.range_max && (
                    <div className="text-xs text-gray-500">
                      {formatLabValue(item.metric.range_min, item.metric.units)} - {formatLabValue(item.metric.range_max, item.metric.units)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Collection Date */}
        {wbcData.length > 0 && wbcData[0].collected_on && (
          <div className="text-sm text-gray-500 pt-2 border-t border-gray-100">
            Collected: {new Date(wbcData[0].collected_on).toLocaleDateString()}
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default WBCBreakdownWidget
