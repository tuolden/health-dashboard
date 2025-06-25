/**
 * Skeletal Muscle Mass Trend Widget - Issue #11 Widget #7
 * 
 * Displays skeletal muscle mass trend over time with fitness benchmarks
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface SkeletalMuscleMassTrendWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number // days
}

/**
 * Widget #7: Skeletal Muscle Mass Trend
 * Shows skeletal muscle mass progression with fitness benchmarks
 */
const SkeletalMuscleMassTrendWidget: React.FC<SkeletalMuscleMassTrendWidgetProps> = ({
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

  // Skeletal muscle mass benchmarks (for adult males - could be made configurable)
  const MUSCLE_BENCHMARKS = {
    POOR: 60,
    BELOW_AVERAGE: 65,
    AVERAGE: 70,
    ABOVE_AVERAGE: 75,
    EXCELLENT: 80
  }

  // Mock data generator
  const generateMockData = (): ScaleTrendData => {
    const baseMuscle = 75 // Starting around above average
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate gradual muscle gain with some noise
      const trend = 0.02 * (timeRange - i) // Slight upward trend
      const noise = (Math.random() - 0.5) * 1 // ±0.5 lbs noise
      const muscle = Math.max(50, baseMuscle + trend + noise) // Don't go below minimum
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: muscle,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentMuscle = dataPoints[dataPoints.length - 1]?.value || baseMuscle
    const previousMuscle = dataPoints[dataPoints.length - 8]?.value || baseMuscle // 7 days ago
    const change = currentMuscle - previousMuscle

    return {
      data: dataPoints,
      metric: 'skeletal_muscle_mass',
      unit: 'lbs',
      current_value: currentMuscle,
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
        throw new Error('No skeletal muscle mass data available')
      }

      // Transform data for chart
      const chartData = result.data
        .filter((session: any) => session.skeletal_muscle_mass_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.skeletal_muscle_mass_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No skeletal muscle mass measurements found')
      }

      // Calculate trend
      const currentMuscle = chartData[chartData.length - 1]?.value
      const previousMuscle = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentMuscle - previousMuscle

      return {
        data: chartData,
        metric: 'skeletal_muscle_mass',
        unit: 'lbs',
        current_value: currentMuscle,
        change_amount: change,
        trend_direction: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching skeletal muscle mass trend data:', error)
      throw error
    }
  }

  // Load data
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const muscleData = useMockData ? generateMockData() : await fetchRealData()
      setData(muscleData)
      console.log('📈 [Skeletal Muscle Mass Trend Widget] Data loaded:', muscleData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load skeletal muscle mass trend data'
      setError(errorMessage)
      console.error('❌ [Skeletal Muscle Mass Trend Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'skeletal_muscle_mass', unit: 'lbs' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="muscle"
      color="#10b981"
      referenceLines={[
        { value: MUSCLE_BENCHMARKS.POOR, label: 'Poor', color: '#ef4444', strokeDasharray: '2 2' },
        { value: MUSCLE_BENCHMARKS.BELOW_AVERAGE, label: 'Below Avg', color: '#f59e0b', strokeDasharray: '3 3' },
        { value: MUSCLE_BENCHMARKS.AVERAGE, label: 'Average', color: '#3b82f6', strokeDasharray: '5 5' },
        { value: MUSCLE_BENCHMARKS.ABOVE_AVERAGE, label: 'Above Avg', color: '#10b981', strokeDasharray: '5 5' },
        { value: MUSCLE_BENCHMARKS.EXCELLENT, label: 'Excellent', color: '#059669', strokeDasharray: '5 5' }
      ]}
      yAxisDomain={[50, 90]}
      showDots={true}
      precision={1}
      className={className}
    />
  )
}

export default SkeletalMuscleMassTrendWidget
