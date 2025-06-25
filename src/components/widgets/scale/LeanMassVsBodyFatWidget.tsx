/**
 * Lean Mass vs Body Fat Mass Widget - Issue #11 Widget #20
 * 
 * Displays lean mass vs body fat mass comparison over time with dual trend lines
 */

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ScaleBaseWidget from './ScaleBaseWidget'
import { WidgetProps } from '../../../types/widget'

interface LeanVsFatDataPoint {
  date: string
  lean_mass?: number
  body_fat_mass?: number
  displayDate?: string
}

interface LeanMassVsBodyFatData {
  data: LeanVsFatDataPoint[]
  current_lean_mass?: number
  current_body_fat_mass?: number
  lean_trend?: 'increasing' | 'decreasing' | 'stable'
  fat_trend?: 'increasing' | 'decreasing' | 'stable'
}

interface LeanMassVsBodyFatWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number
}

/**
 * Widget #20: Lean Mass vs Body Fat Mass
 * Shows dual trend comparison between lean mass and body fat mass
 */
const LeanMassVsBodyFatWidget: React.FC<LeanMassVsBodyFatWidgetProps> = ({
  config,
  dataState,
  onRefresh,
  useMockData = true,
  timeRange = 30,
  className = ''
}) => {
  const [data, setData] = useState<LeanMassVsBodyFatData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateMockData = (): LeanMassVsBodyFatData => {
    const baseLeanMass = 145
    const baseBodyFatMass = 28
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate ideal body recomposition: lean mass up, fat mass down
      const leanTrend = 0.05 * (timeRange - i) // Slight lean mass gain
      const fatTrend = -0.03 * (timeRange - i) // Slight fat loss
      const leanNoise = (Math.random() - 0.5) * 1
      const fatNoise = (Math.random() - 0.5) * 0.5
      
      const leanMass = baseLeanMass + leanTrend + leanNoise
      const bodyFatMass = Math.max(15, baseBodyFatMass + fatTrend + fatNoise)
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        lean_mass: leanMass,
        body_fat_mass: bodyFatMass,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentLeanMass = dataPoints[dataPoints.length - 1]?.lean_mass
    const currentBodyFatMass = dataPoints[dataPoints.length - 1]?.body_fat_mass
    const previousLeanMass = dataPoints[dataPoints.length - 8]?.lean_mass
    const previousBodyFatMass = dataPoints[dataPoints.length - 8]?.body_fat_mass

    const leanChange = (currentLeanMass || 0) - (previousLeanMass || 0)
    const fatChange = (currentBodyFatMass || 0) - (previousBodyFatMass || 0)

    return {
      data: dataPoints,
      current_lean_mass: currentLeanMass,
      current_body_fat_mass: currentBodyFatMass,
      lean_trend: leanChange > 0.2 ? 'increasing' : leanChange < -0.2 ? 'decreasing' : 'stable',
      fat_trend: fatChange > 0.2 ? 'increasing' : fatChange < -0.2 ? 'decreasing' : 'stable'
    }
  }

  const fetchRealData = async (): Promise<LeanMassVsBodyFatData> => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/scale/weight-sessions?startDate=${startDate}&endDate=${endDate}&limit=${timeRange + 5}`)
      if (!response.ok) throw new Error('Failed to fetch weight sessions')
      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('No body composition data available')
      }

      const chartData = result.data
        .filter((session: any) => session.lean_mass_after !== null && session.body_fat_mass_after !== null)
        .map((session: any) => ({
          date: session.date,
          lean_mass: session.lean_mass_after,
          body_fat_mass: session.body_fat_mass_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No body composition measurements found')
      }

      const currentLeanMass = chartData[chartData.length - 1]?.lean_mass
      const currentBodyFatMass = chartData[chartData.length - 1]?.body_fat_mass
      const previousLeanMass = chartData.length > 7 ? chartData[chartData.length - 8]?.lean_mass : chartData[0]?.lean_mass
      const previousBodyFatMass = chartData.length > 7 ? chartData[chartData.length - 8]?.body_fat_mass : chartData[0]?.body_fat_mass

      const leanChange = (currentLeanMass || 0) - (previousLeanMass || 0)
      const fatChange = (currentBodyFatMass || 0) - (previousBodyFatMass || 0)

      return {
        data: chartData,
        current_lean_mass: currentLeanMass,
        current_body_fat_mass: currentBodyFatMass,
        lean_trend: leanChange > 0.2 ? 'increasing' : leanChange < -0.2 ? 'decreasing' : 'stable',
        fat_trend: fatChange > 0.2 ? 'increasing' : fatChange < -0.2 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching lean vs fat mass data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const compData = useMockData ? generateMockData() : await fetchRealData()
      setData(compData)
      console.log('💪🔥 [Lean vs Fat Mass Widget] Data loaded:', compData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load body composition data'
      setError(errorMessage)
      console.error('❌ [Lean vs Fat Mass Widget] Error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [useMockData, timeRange])

  const handleRefresh = () => {
    loadData()
    onRefresh()
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.displayDate}</p>
          <p className="text-sm text-green-600">
            Lean Mass: {data.lean_mass?.toFixed(1)} lbs
          </p>
          <p className="text-sm text-red-600">
            Body Fat: {data.body_fat_mass?.toFixed(1)} lbs
          </p>
        </div>
      )
    }
    return null
  }

  const widgetDataState = {
    ...dataState,
    isLoading: isLoading || dataState.isLoading,
    isError: !!error || dataState.isError,
    errorMessage: error || dataState.errorMessage,
    lastUpdated: data ? new Date() : dataState.lastUpdated
  }

  return (
    <ScaleBaseWidget
      config={config}
      data={data || {}}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="compare"
      className={className}
    >
      <div className="space-y-4">
        {/* Current Values */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              {data?.current_lean_mass?.toFixed(1) || '--'} lbs
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Lean Mass</p>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {data?.current_body_fat_mass?.toFixed(1) || '--'} lbs
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Body Fat</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48">
          {!data?.data || data.data.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-2">📊</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">No comparison data available</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  label={{ value: 'Mass (lbs)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Line 
                  type="monotone" 
                  dataKey="lean_mass" 
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  name="Lean Mass"
                />
                <Line 
                  type="monotone" 
                  dataKey="body_fat_mass" 
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                  name="Body Fat"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Trend Summary */}
        {data?.lean_trend && data?.fat_trend && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`text-center p-2 rounded ${
              data.lean_trend === 'increasing' ? 'bg-green-100 text-green-800' :
              data.lean_trend === 'decreasing' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              Lean: {data.lean_trend}
            </div>
            <div className={`text-center p-2 rounded ${
              data.fat_trend === 'decreasing' ? 'bg-green-100 text-green-800' :
              data.fat_trend === 'increasing' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              Fat: {data.fat_trend}
            </div>
          </div>
        )}
      </div>
    </ScaleBaseWidget>
  )
}

export default LeanMassVsBodyFatWidget
