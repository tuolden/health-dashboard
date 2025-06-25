/**
 * Body Fat Percentage Over Time Widget - Issue #11 Widget #3
 * 
 * Displays body fat percentage trend over time with health zones
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface BodyFatPercentageWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number // days
}

/**
 * Widget #3: Body Fat % Over Time
 * Shows body fat percentage trend with health zone indicators
 */
const BodyFatPercentageWidget: React.FC<BodyFatPercentageWidgetProps> = ({
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

  // Body fat percentage health zones (for adult males - could be made configurable)
  const BODY_FAT_ZONES = {
    ESSENTIAL: 5,
    ATHLETE: 10,
    FITNESS: 15,
    AVERAGE: 20,
    OBESE: 25
  }

  // Mock data generator
  const generateMockData = (): ScaleTrendData => {
    const baseBodyFat = 18 // Starting around fitness level
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate gradual body fat reduction with some noise
      const trend = -0.05 * (timeRange - i) // Slight downward trend
      const noise = (Math.random() - 0.5) * 1 // ±0.5% noise
      const bodyFat = Math.max(5, baseBodyFat + trend + noise) // Don't go below essential fat
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: bodyFat,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentBodyFat = dataPoints[dataPoints.length - 1]?.value || baseBodyFat
    const previousBodyFat = dataPoints[dataPoints.length - 8]?.value || baseBodyFat // 7 days ago
    const change = currentBodyFat - previousBodyFat

    return {
      data: dataPoints,
      metric: 'body_fat_percentage',
      unit: '%',
      current_value: currentBodyFat,
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
        throw new Error('No body fat data available')
      }

      // Transform data for chart
      const chartData = result.data
        .filter((session: any) => session.body_fat_percentage_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.body_fat_percentage_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No body fat measurements found')
      }

      // Calculate trend
      const currentBodyFat = chartData[chartData.length - 1]?.value
      const previousBodyFat = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentBodyFat - previousBodyFat

      return {
        data: chartData,
        metric: 'body_fat_percentage',
        unit: '%',
        current_value: currentBodyFat,
        change_amount: change,
        trend_direction: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching body fat percentage data:', error)
      throw error
    }
  }

  // Load data
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const bodyFatData = useMockData ? generateMockData() : await fetchRealData()
      setData(bodyFatData)
      console.log('📊 [Body Fat % Widget] Data loaded:', bodyFatData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load body fat data'
      setError(errorMessage)
      console.error('❌ [Body Fat % Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'body_fat_percentage', unit: '%' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="percentage"
      color="#dc2626"
      referenceLines={[
        { value: BODY_FAT_ZONES.ESSENTIAL, label: 'Essential', color: '#ef4444', strokeDasharray: '2 2' },
        { value: BODY_FAT_ZONES.ATHLETE, label: 'Athlete', color: '#10b981', strokeDasharray: '5 5' },
        { value: BODY_FAT_ZONES.FITNESS, label: 'Fitness', color: '#3b82f6', strokeDasharray: '5 5' },
        { value: BODY_FAT_ZONES.AVERAGE, label: 'Average', color: '#f59e0b', strokeDasharray: '3 3' },
        { value: BODY_FAT_ZONES.OBESE, label: 'Obese', color: '#ef4444', strokeDasharray: '3 3' }
      ]}
      yAxisDomain={[0, 35]}
      showDots={true}
      precision={1}
      className={className}
    />
  )
}

export default BodyFatPercentageWidget
