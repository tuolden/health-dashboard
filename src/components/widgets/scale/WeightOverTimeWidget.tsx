/**
 * Weight Over Time Widget - Issue #11 Widget #2
 * 
 * Displays weight trend over time with line chart
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface WeightOverTimeWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number // days
}

/**
 * Widget #2: Weight Over Time
 * Shows weight trend over specified time period
 */
const WeightOverTimeWidget: React.FC<WeightOverTimeWidgetProps> = ({
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

  // Mock data generator
  const generateMockData = (): ScaleTrendData => {
    const baseWeight = 175
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate gradual weight change with some noise
      const trend = -0.1 * (timeRange - i) // Slight downward trend
      const noise = (Math.random() - 0.5) * 2 // ±1 lb noise
      const weight = baseWeight + trend + noise
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: weight,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentWeight = dataPoints[dataPoints.length - 1]?.value || baseWeight
    const previousWeight = dataPoints[dataPoints.length - 8]?.value || baseWeight // 7 days ago
    const change = currentWeight - previousWeight

    return {
      data: dataPoints,
      metric: 'weight',
      unit: 'lbs',
      current_value: currentWeight,
      change_amount: change,
      trend_direction: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable'
    }
  }

  // Fetch real data from API
  const fetchRealData = async (): Promise<ScaleTrendData> => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Get weight sessions
      const response = await fetch(`/api/scale/weight-sessions?startDate=${startDate}&endDate=${endDate}&limit=${timeRange + 5}`)
      if (!response.ok) throw new Error('Failed to fetch weight sessions')
      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('No weight data available')
      }

      // Transform data for chart
      const chartData = result.data
        .filter((session: any) => session.weight_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.weight_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No weight measurements found')
      }

      // Calculate trend
      const currentWeight = chartData[chartData.length - 1]?.value
      const previousWeight = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentWeight - previousWeight

      return {
        data: chartData,
        metric: 'weight',
        unit: 'lbs',
        current_value: currentWeight,
        change_amount: change,
        trend_direction: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching weight over time data:', error)
      throw error
    }
  }

  // Load data
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const weightData = useMockData ? generateMockData() : await fetchRealData()
      setData(weightData)
      console.log('📈 [Weight Over Time Widget] Data loaded:', weightData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weight trend data'
      setError(errorMessage)
      console.error('❌ [Weight Over Time Widget] Error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount and when refresh is triggered
  useEffect(() => {
    loadData()
  }, [useMockData, timeRange])

  // Handle refresh
  const handleRefresh = () => {
    loadData()
    onRefresh()
  }

  // Prepare widget data state
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
      data={data || { data: [], metric: 'weight', unit: 'lbs' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="trending-up"
      color="#2563eb"
      referenceLines={[
        { value: 180, label: 'Target', color: '#10b981', strokeDasharray: '5 5' },
        { value: 200, label: 'Warning', color: '#f59e0b', strokeDasharray: '3 3' }
      ]}
      yAxisDomain={['auto', 'auto']}
      showDots={true}
      precision={1}
      className={className}
    />
  )
}

export default WeightOverTimeWidget
