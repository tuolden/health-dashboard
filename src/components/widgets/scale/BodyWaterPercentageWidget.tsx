/**
 * Body Water % Over Time Widget - Issue #11 Widget #13
 * 
 * Displays body water percentage trend over time with hydration zones
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface BodyWaterPercentageWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number
}

/**
 * Widget #13: Body Water % Over Time
 * Shows body water percentage with hydration health zones
 */
const BodyWaterPercentageWidget: React.FC<BodyWaterPercentageWidgetProps> = ({
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

  // Body water percentage zones (for adult males)
  const WATER_ZONES = {
    DEHYDRATED: 50,
    LOW: 55,
    NORMAL: 60,
    GOOD: 65,
    EXCELLENT: 70
  }

  const generateMockData = (): ScaleTrendData => {
    const baseWater = 62 // Starting around normal
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const trend = 0.02 * (timeRange - i) // Slight improvement
      const noise = (Math.random() - 0.5) * 2 // ±1% noise
      const water = Math.max(45, Math.min(75, baseWater + trend + noise))
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: water,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentWater = dataPoints[dataPoints.length - 1]?.value || baseWater
    const previousWater = dataPoints[dataPoints.length - 8]?.value || baseWater
    const change = currentWater - previousWater

    return {
      data: dataPoints,
      metric: 'body_water_percentage',
      unit: '%',
      current_value: currentWater,
      change_amount: change,
      trend_direction: change > 0.5 ? 'increasing' : change < -0.5 ? 'decreasing' : 'stable'
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
        throw new Error('No body water data available')
      }

      const chartData = result.data
        .filter((session: any) => session.body_water_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.body_water_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No body water measurements found')
      }

      const currentWater = chartData[chartData.length - 1]?.value
      const previousWater = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentWater - previousWater

      return {
        data: chartData,
        metric: 'body_water_percentage',
        unit: '%',
        current_value: currentWater,
        change_amount: change,
        trend_direction: change > 0.5 ? 'increasing' : change < -0.5 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching body water data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const waterData = useMockData ? generateMockData() : await fetchRealData()
      setData(waterData)
      console.log('💧 [Body Water % Widget] Data loaded:', waterData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load body water data'
      setError(errorMessage)
      console.error('❌ [Body Water % Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'body_water_percentage', unit: '%' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="droplet"
      color="#06b6d4"
      referenceLines={[
        { value: WATER_ZONES.DEHYDRATED, label: 'Dehydrated', color: '#ef4444', strokeDasharray: '2 2' },
        { value: WATER_ZONES.LOW, label: 'Low', color: '#f59e0b', strokeDasharray: '3 3' },
        { value: WATER_ZONES.NORMAL, label: 'Normal', color: '#3b82f6', strokeDasharray: '5 5' },
        { value: WATER_ZONES.GOOD, label: 'Good', color: '#10b981', strokeDasharray: '5 5' },
        { value: WATER_ZONES.EXCELLENT, label: 'Excellent', color: '#059669', strokeDasharray: '5 5' }
      ]}
      yAxisDomain={[45, 75]}
      showDots={true}
      precision={1}
      className={className}
    />
  )
}

export default BodyWaterPercentageWidget
