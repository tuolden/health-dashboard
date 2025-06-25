/**
 * BMR Over Time Widget - Issue #11 Widget #10
 * 
 * Displays Basal Metabolic Rate trend over time
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface BMROverTimeWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number // days
}

/**
 * Widget #10: BMR Over Time
 * Shows basal metabolic rate progression over time
 */
const BMROverTimeWidget: React.FC<BMROverTimeWidgetProps> = ({
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
    const baseBMR = 1850 // Starting BMR
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate gradual BMR changes
      const trend = 0.5 * (timeRange - i) // Slight upward trend
      const noise = (Math.random() - 0.5) * 20 // ±10 calories noise
      const bmr = Math.max(1200, baseBMR + trend + noise)
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: bmr,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentBMR = dataPoints[dataPoints.length - 1]?.value || baseBMR
    const previousBMR = dataPoints[dataPoints.length - 8]?.value || baseBMR
    const change = currentBMR - previousBMR

    return {
      data: dataPoints,
      metric: 'bmr',
      unit: 'cal',
      current_value: currentBMR,
      change_amount: change,
      trend_direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable'
    }
  }

  // Fetch real data from API
  const fetchRealData = async (): Promise<ScaleTrendData> => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/scale/weight-sessions?startDate=${startDate}&endDate=${endDate}&limit=${timeRange + 5}`)
      if (!response.ok) throw new Error('Failed to fetch weight sessions')
      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('No BMR data available')
      }

      const chartData = result.data
        .filter((session: any) => session.bmr_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.bmr_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No BMR measurements found')
      }

      const currentBMR = chartData[chartData.length - 1]?.value
      const previousBMR = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentBMR - previousBMR

      return {
        data: chartData,
        metric: 'bmr',
        unit: 'cal',
        current_value: currentBMR,
        change_amount: change,
        trend_direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching BMR data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const bmrData = useMockData ? generateMockData() : await fetchRealData()
      setData(bmrData)
      console.log('🔥 [BMR Widget] Data loaded:', bmrData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load BMR data'
      setError(errorMessage)
      console.error('❌ [BMR Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'bmr', unit: 'cal' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="fire"
      color="#f59e0b"
      referenceLines={[
        { value: 1500, label: 'Low', color: '#ef4444', strokeDasharray: '3 3' },
        { value: 1800, label: 'Average', color: '#3b82f6', strokeDasharray: '5 5' },
        { value: 2100, label: 'High', color: '#10b981', strokeDasharray: '5 5' }
      ]}
      yAxisDomain={['auto', 'auto']}
      showDots={true}
      precision={0}
      className={className}
    />
  )
}

export default BMROverTimeWidget
