/**
 * Resting Heart Rate Over Time Widget - Issue #11 Widget #11
 * 
 * Displays resting heart rate trend over time with fitness zones
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface RestingHeartRateOverTimeWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number // days
}

/**
 * Widget #11: Resting Heart Rate Over Time
 * Shows resting heart rate progression with fitness zones
 */
const RestingHeartRateOverTimeWidget: React.FC<RestingHeartRateOverTimeWidgetProps> = ({
  config,
  dataState,
  onRefresh,
  useMockData = true,
  timeRange = 30,
  className = ''
}) => {
  const [data, setData] = useState<ScaleTrendData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // RHR fitness zones (for adults)
  const RHR_ZONES = {
    ATHLETE: 40,
    EXCELLENT: 50,
    GOOD: 60,
    AVERAGE: 70,
    POOR: 80
  }

  const generateMockData = (): ScaleTrendData => {
    const baseRHR = 62 // Starting around good fitness
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate gradual RHR improvement
      const trend = -0.1 * (timeRange - i) // Slight downward trend (improvement)
      const noise = (Math.random() - 0.5) * 4 // ±2 bpm noise
      const rhr = Math.max(35, Math.min(100, baseRHR + trend + noise))
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: rhr,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentRHR = dataPoints[dataPoints.length - 1]?.value || baseRHR
    const previousRHR = dataPoints[dataPoints.length - 8]?.value || baseRHR
    const change = currentRHR - previousRHR

    return {
      data: dataPoints,
      metric: 'resting_heart_rate',
      unit: 'bpm',
      current_value: currentRHR,
      change_amount: change,
      trend_direction: change > 1 ? 'increasing' : change < -1 ? 'decreasing' : 'stable'
    }
  }

  const fetchRealData = async (): Promise<ScaleTrendData> => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/scale/weight-sessions?startDate=${startDate}&endDate=${endDate}&limit=${timeRange + 5}`)
      if (!response.ok) throw new Error('Failed to fetch weight sessions')
      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('No resting heart rate data available')
      }

      const chartData = result.data
        .filter((session: any) => session.resting_heart_rate_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.resting_heart_rate_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No resting heart rate measurements found')
      }

      const currentRHR = chartData[chartData.length - 1]?.value
      const previousRHR = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentRHR - previousRHR

      return {
        data: chartData,
        metric: 'resting_heart_rate',
        unit: 'bpm',
        current_value: currentRHR,
        change_amount: change,
        trend_direction: change > 1 ? 'increasing' : change < -1 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching resting heart rate data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const rhrData = useMockData ? generateMockData() : await fetchRealData()
      setData(rhrData)
      console.log('❤️ [RHR Over Time Widget] Data loaded:', rhrData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load resting heart rate data'
      setError(errorMessage)
      console.error('❌ [RHR Over Time Widget] Error:', errorMessage)
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

  const widgetDataState = {
    ...dataState,
    isLoading: isLoading || dataState.isLoading,
    isError: !!error || dataState.isError,
    errorMessage: error || dataState.errorMessage,
    lastUpdated: data ? new Date() : dataState.lastUpdated
  }

  return (
    <ScaleTrendWidget
      config={config}
      data={data || { data: [], metric: 'resting_heart_rate', unit: 'bpm' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="heart"
      color="#dc2626"
      referenceLines={[
        { value: RHR_ZONES.ATHLETE, label: 'Athlete', color: '#059669', strokeDasharray: '5 5' },
        { value: RHR_ZONES.EXCELLENT, label: 'Excellent', color: '#10b981', strokeDasharray: '5 5' },
        { value: RHR_ZONES.GOOD, label: 'Good', color: '#3b82f6', strokeDasharray: '5 5' },
        { value: RHR_ZONES.AVERAGE, label: 'Average', color: '#f59e0b', strokeDasharray: '3 3' },
        { value: RHR_ZONES.POOR, label: 'Poor', color: '#ef4444', strokeDasharray: '3 3' }
      ]}
      yAxisDomain={[35, 85]}
      showDots={true}
      precision={0}
      className={className}
    />
  )
}

export default RestingHeartRateOverTimeWidget
