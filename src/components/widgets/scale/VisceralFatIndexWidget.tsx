/**
 * Visceral Fat Index Trend Widget - Issue #11 Widget #15
 * 
 * Displays visceral fat index trend over time with health risk zones
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface VisceralFatIndexWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number
}

/**
 * Widget #15: Visceral Fat Index Trend
 * Shows visceral (organ) fat index with health risk assessment
 */
const VisceralFatIndexWidget: React.FC<VisceralFatIndexWidgetProps> = ({
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

  // Visceral fat index health zones
  const VISCERAL_ZONES = {
    HEALTHY: 9,
    ELEVATED: 14,
    HIGH: 19,
    VERY_HIGH: 24
  }

  const generateMockData = (): ScaleTrendData => {
    const baseVisceral = 8 // Starting in healthy range
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const trend = -0.02 * (timeRange - i) // Slight improvement
      const noise = (Math.random() - 0.5) * 1 // ±0.5 index noise
      const visceral = Math.max(1, Math.min(30, baseVisceral + trend + noise))
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: visceral,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentVisceral = dataPoints[dataPoints.length - 1]?.value || baseVisceral
    const previousVisceral = dataPoints[dataPoints.length - 8]?.value || baseVisceral
    const change = currentVisceral - previousVisceral

    return {
      data: dataPoints,
      metric: 'visceral_fat_index',
      unit: '',
      current_value: currentVisceral,
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
        throw new Error('No visceral fat index data available')
      }

      const chartData = result.data
        .filter((session: any) => session.visceral_fat_index_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.visceral_fat_index_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No visceral fat index measurements found')
      }

      const currentVisceral = chartData[chartData.length - 1]?.value
      const previousVisceral = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentVisceral - previousVisceral

      return {
        data: chartData,
        metric: 'visceral_fat_index',
        unit: '',
        current_value: currentVisceral,
        change_amount: change,
        trend_direction: change > 0.2 ? 'increasing' : change < -0.2 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching visceral fat index data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const visceralData = useMockData ? generateMockData() : await fetchRealData()
      setData(visceralData)
      console.log('🫀 [Visceral Fat Index Widget] Data loaded:', visceralData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load visceral fat index data'
      setError(errorMessage)
      console.error('❌ [Visceral Fat Index Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'visceral_fat_index', unit: '' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="target"
      color="#dc2626"
      referenceLines={[
        { value: VISCERAL_ZONES.HEALTHY, label: 'Healthy', color: '#10b981', strokeDasharray: '5 5' },
        { value: VISCERAL_ZONES.ELEVATED, label: 'Elevated', color: '#f59e0b', strokeDasharray: '3 3' },
        { value: VISCERAL_ZONES.HIGH, label: 'High Risk', color: '#ef4444', strokeDasharray: '3 3' },
        { value: VISCERAL_ZONES.VERY_HIGH, label: 'Very High', color: '#991b1b', strokeDasharray: '2 2' }
      ]}
      yAxisDomain={[1, 25]}
      showDots={true}
      precision={1}
      className={className}
    />
  )
}

export default VisceralFatIndexWidget
