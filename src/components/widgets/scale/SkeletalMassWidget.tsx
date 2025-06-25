/**
 * Skeletal Mass Over Time Widget - Issue #11 Widget #8
 * 
 * Displays skeletal mass (bone density) trend over time
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface SkeletalMassWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number // days
}

/**
 * Widget #8: Skeletal Mass Over Time
 * Shows bone mass/density progression over time
 */
const SkeletalMassWidget: React.FC<SkeletalMassWidgetProps> = ({
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

  // Skeletal mass benchmarks (for adult males - could be made configurable)
  const SKELETAL_BENCHMARKS = {
    LOW: 6.0,
    BELOW_AVERAGE: 6.5,
    AVERAGE: 7.0,
    ABOVE_AVERAGE: 7.5,
    HIGH: 8.0
  }

  // Mock data generator
  const generateMockData = (): ScaleTrendData => {
    const baseSkeletal = 7.2 // Starting around average
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate very gradual changes (bone mass changes slowly)
      const trend = 0.001 * (timeRange - i) // Very slight upward trend
      const noise = (Math.random() - 0.5) * 0.1 // ±0.05 lbs noise
      const skeletal = Math.max(5.0, baseSkeletal + trend + noise) // Don't go below minimum
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: skeletal,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentSkeletal = dataPoints[dataPoints.length - 1]?.value || baseSkeletal
    const previousSkeletal = dataPoints[dataPoints.length - 8]?.value || baseSkeletal // 7 days ago
    const change = currentSkeletal - previousSkeletal

    return {
      data: dataPoints,
      metric: 'skeletal_mass',
      unit: 'lbs',
      current_value: currentSkeletal,
      change_amount: change,
      trend_direction: change > 0.05 ? 'increasing' : change < -0.05 ? 'decreasing' : 'stable'
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
        throw new Error('No skeletal mass data available')
      }

      // Transform data for chart
      const chartData = result.data
        .filter((session: any) => session.skeletal_mass_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.skeletal_mass_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No skeletal mass measurements found')
      }

      // Calculate trend
      const currentSkeletal = chartData[chartData.length - 1]?.value
      const previousSkeletal = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentSkeletal - previousSkeletal

      return {
        data: chartData,
        metric: 'skeletal_mass',
        unit: 'lbs',
        current_value: currentSkeletal,
        change_amount: change,
        trend_direction: change > 0.05 ? 'increasing' : change < -0.05 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching skeletal mass data:', error)
      throw error
    }
  }

  // Load data
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const skeletalData = useMockData ? generateMockData() : await fetchRealData()
      setData(skeletalData)
      console.log('🦴 [Skeletal Mass Widget] Data loaded:', skeletalData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load skeletal mass data'
      setError(errorMessage)
      console.error('❌ [Skeletal Mass Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'skeletal_mass', unit: 'lbs' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="bone"
      color="#8b5cf6"
      referenceLines={[
        { value: SKELETAL_BENCHMARKS.LOW, label: 'Low', color: '#ef4444', strokeDasharray: '2 2' },
        { value: SKELETAL_BENCHMARKS.BELOW_AVERAGE, label: 'Below Avg', color: '#f59e0b', strokeDasharray: '3 3' },
        { value: SKELETAL_BENCHMARKS.AVERAGE, label: 'Average', color: '#3b82f6', strokeDasharray: '5 5' },
        { value: SKELETAL_BENCHMARKS.ABOVE_AVERAGE, label: 'Above Avg', color: '#10b981', strokeDasharray: '5 5' },
        { value: SKELETAL_BENCHMARKS.HIGH, label: 'High', color: '#059669', strokeDasharray: '5 5' }
      ]}
      yAxisDomain={[5.5, 8.5]}
      showDots={true}
      precision={2}
      className={className}
    />
  )
}

export default SkeletalMassWidget
