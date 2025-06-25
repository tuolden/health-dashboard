/**
 * Subcutaneous Fat Mass Over Time Widget - Issue #11 Widget #14
 * 
 * Displays subcutaneous fat mass trend over time
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface SubcutaneousFatMassWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number
}

/**
 * Widget #14: Subcutaneous Fat Mass Over Time
 * Shows subcutaneous (under-skin) fat mass progression
 */
const SubcutaneousFatMassWidget: React.FC<SubcutaneousFatMassWidgetProps> = ({
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

  const generateMockData = (): ScaleTrendData => {
    const baseSubFat = 22 // Starting subcutaneous fat mass
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const trend = -0.05 * (timeRange - i) // Slight reduction
      const noise = (Math.random() - 0.5) * 1 // ±0.5 lbs noise
      const subFat = Math.max(10, baseSubFat + trend + noise)
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: subFat,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentSubFat = dataPoints[dataPoints.length - 1]?.value || baseSubFat
    const previousSubFat = dataPoints[dataPoints.length - 8]?.value || baseSubFat
    const change = currentSubFat - previousSubFat

    return {
      data: dataPoints,
      metric: 'subcutaneous_fat_mass',
      unit: 'lbs',
      current_value: currentSubFat,
      change_amount: change,
      trend_direction: change > 0.2 ? 'increasing' : change < -0.2 ? 'decreasing' : 'stable'
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
        throw new Error('No subcutaneous fat mass data available')
      }

      const chartData = result.data
        .filter((session: any) => session.subcutaneous_fat_mass_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.subcutaneous_fat_mass_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No subcutaneous fat mass measurements found')
      }

      const currentSubFat = chartData[chartData.length - 1]?.value
      const previousSubFat = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentSubFat - previousSubFat

      return {
        data: chartData,
        metric: 'subcutaneous_fat_mass',
        unit: 'lbs',
        current_value: currentSubFat,
        change_amount: change,
        trend_direction: change > 0.2 ? 'increasing' : change < -0.2 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching subcutaneous fat mass data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const subFatData = useMockData ? generateMockData() : await fetchRealData()
      setData(subFatData)
      console.log('🧈 [Subcutaneous Fat Mass Widget] Data loaded:', subFatData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subcutaneous fat mass data'
      setError(errorMessage)
      console.error('❌ [Subcutaneous Fat Mass Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'subcutaneous_fat_mass', unit: 'lbs' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="layers"
      color="#f59e0b"
      referenceLines={[
        { value: 15, label: 'Low', color: '#10b981', strokeDasharray: '5 5' },
        { value: 20, label: 'Normal', color: '#3b82f6', strokeDasharray: '5 5' },
        { value: 25, label: 'High', color: '#f59e0b', strokeDasharray: '3 3' },
        { value: 30, label: 'Very High', color: '#ef4444', strokeDasharray: '3 3' }
      ]}
      yAxisDomain={['auto', 'auto']}
      showDots={true}
      precision={1}
      className={className}
    />
  )
}

export default SubcutaneousFatMassWidget
