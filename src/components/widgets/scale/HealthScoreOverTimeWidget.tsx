/**
 * Health Score Over Time Widget - Issue #11 Widget #23
 * 
 * Displays overall health score trend over time with performance zones
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface HealthScoreOverTimeWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number
}

/**
 * Widget #23: Health Score Over Time
 * Shows overall health score progression with performance zones
 */
const HealthScoreOverTimeWidget: React.FC<HealthScoreOverTimeWidgetProps> = ({
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

  // Health score zones
  const HEALTH_ZONES = {
    POOR: 60,
    FAIR: 70,
    GOOD: 80,
    EXCELLENT: 90,
    OUTSTANDING: 95
  }

  const generateMockData = (): ScaleTrendData => {
    const baseScore = 78 // Starting around good
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const trend = 0.1 * (timeRange - i) // Gradual improvement
      const noise = (Math.random() - 0.5) * 5 // ±2.5 points noise
      const score = Math.max(40, Math.min(100, baseScore + trend + noise))
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: score,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentScore = dataPoints[dataPoints.length - 1]?.value || baseScore
    const previousScore = dataPoints[dataPoints.length - 8]?.value || baseScore
    const change = currentScore - previousScore

    return {
      data: dataPoints,
      metric: 'health_score',
      unit: '',
      current_value: currentScore,
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
        throw new Error('No health score data available')
      }

      const chartData = result.data
        .filter((session: any) => session.health_score !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.health_score,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No health score measurements found')
      }

      const currentScore = chartData[chartData.length - 1]?.value
      const previousScore = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentScore - previousScore

      return {
        data: chartData,
        metric: 'health_score',
        unit: '',
        current_value: currentScore,
        change_amount: change,
        trend_direction: change > 1 ? 'increasing' : change < -1 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching health score data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const healthData = useMockData ? generateMockData() : await fetchRealData()
      setData(healthData)
      console.log('🏥📈 [Health Score Over Time Widget] Data loaded:', healthData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load health score data'
      setError(errorMessage)
      console.error('❌ [Health Score Over Time Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'health_score', unit: '' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="heart-pulse"
      color="#8b5cf6"
      referenceLines={[
        { value: HEALTH_ZONES.POOR, label: 'Poor', color: '#ef4444', strokeDasharray: '2 2' },
        { value: HEALTH_ZONES.FAIR, label: 'Fair', color: '#f59e0b', strokeDasharray: '3 3' },
        { value: HEALTH_ZONES.GOOD, label: 'Good', color: '#3b82f6', strokeDasharray: '5 5' },
        { value: HEALTH_ZONES.EXCELLENT, label: 'Excellent', color: '#10b981', strokeDasharray: '5 5' },
        { value: HEALTH_ZONES.OUTSTANDING, label: 'Outstanding', color: '#059669', strokeDasharray: '5 5' }
      ]}
      yAxisDomain={[40, 100]}
      showDots={true}
      precision={0}
      className={className}
    />
  )
}

export default HealthScoreOverTimeWidget
