/**
 * Lean Mass Over Time Widget - Issue #11 Widget #5
 * 
 * Displays lean mass (muscle + bone + organs) trend over time
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface LeanMassWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number // days
}

/**
 * Widget #5: Lean Mass Over Time
 * Shows lean body mass (everything except fat) over time
 */
const LeanMassWidget: React.FC<LeanMassWidgetProps> = ({
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
    const baseBodyFatPercentage = 18
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate gradual changes - lean mass should increase slightly as fat decreases
      const weightTrend = -0.1 * (timeRange - i) // Slight weight loss
      const bodyFatTrend = -0.05 * (timeRange - i) // Body fat reduction
      const leanMassGain = 0.05 * (timeRange - i) // Slight lean mass gain
      
      const weightNoise = (Math.random() - 0.5) * 2
      const bodyFatNoise = (Math.random() - 0.5) * 1
      const leanNoise = (Math.random() - 0.5) * 1
      
      const weight = baseWeight + weightTrend + weightNoise
      const bodyFatPercentage = Math.max(5, baseBodyFatPercentage + bodyFatTrend + bodyFatNoise)
      const bodyFatMass = (weight * bodyFatPercentage) / 100
      const leanMass = weight - bodyFatMass + leanMassGain + leanNoise
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: leanMass,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentLeanMass = dataPoints[dataPoints.length - 1]?.value || 145
    const previousLeanMass = dataPoints[dataPoints.length - 8]?.value || 145 // 7 days ago
    const change = currentLeanMass - previousLeanMass

    return {
      data: dataPoints,
      metric: 'lean_mass',
      unit: 'lbs',
      current_value: currentLeanMass,
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
        throw new Error('No lean mass data available')
      }

      // Transform data for chart
      const chartData = result.data
        .filter((session: any) => session.lean_mass_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.lean_mass_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No lean mass measurements found')
      }

      // Calculate trend
      const currentLeanMass = chartData[chartData.length - 1]?.value
      const previousLeanMass = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentLeanMass - previousLeanMass

      return {
        data: chartData,
        metric: 'lean_mass',
        unit: 'lbs',
        current_value: currentLeanMass,
        change_amount: change,
        trend_direction: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching lean mass data:', error)
      throw error
    }
  }

  // Load data
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const leanMassData = useMockData ? generateMockData() : await fetchRealData()
      setData(leanMassData)
      console.log('💪 [Lean Mass Widget] Data loaded:', leanMassData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load lean mass data'
      setError(errorMessage)
      console.error('❌ [Lean Mass Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'lean_mass', unit: 'lbs' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="muscle"
      color="#10b981"
      referenceLines={[
        { value: 130, label: 'Minimum', color: '#ef4444', strokeDasharray: '3 3' },
        { value: 150, label: 'Good', color: '#10b981', strokeDasharray: '5 5' },
        { value: 170, label: 'Excellent', color: '#3b82f6', strokeDasharray: '5 5' }
      ]}
      yAxisDomain={['auto', 'auto']}
      showDots={true}
      precision={1}
      className={className}
    />
  )
}

export default LeanMassWidget
