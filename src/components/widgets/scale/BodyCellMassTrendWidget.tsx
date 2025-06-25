/**
 * Body Cell Mass Trend Widget - Issue #11 Widget #16
 * 
 * Displays body cell mass trend over time (active metabolic tissue)
 */

import React, { useState, useEffect } from 'react'
import { ScaleTrendWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleTrendData } from './types'

interface BodyCellMassTrendWidgetProps extends WidgetProps {
  useMockData?: boolean
  timeRange?: number
}

/**
 * Widget #16: Body Cell Mass Trend
 * Shows body cell mass (active metabolic tissue) progression
 */
const BodyCellMassTrendWidget: React.FC<BodyCellMassTrendWidgetProps> = ({
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
    const baseBCM = 95 // Starting body cell mass
    const dataPoints = []
    
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const trend = 0.03 * (timeRange - i) // Slight improvement
      const noise = (Math.random() - 0.5) * 2 // ±1 lbs noise
      const bcm = Math.max(70, baseBCM + trend + noise)
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value: bcm,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const currentBCM = dataPoints[dataPoints.length - 1]?.value || baseBCM
    const previousBCM = dataPoints[dataPoints.length - 8]?.value || baseBCM
    const change = currentBCM - previousBCM

    return {
      data: dataPoints,
      metric: 'body_cell_mass',
      unit: 'lbs',
      current_value: currentBCM,
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
        throw new Error('No body cell mass data available')
      }

      const chartData = result.data
        .filter((session: any) => session.body_cell_mass_after !== null)
        .map((session: any) => ({
          date: session.date,
          value: session.body_cell_mass_after,
          displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date))

      if (chartData.length === 0) {
        throw new Error('No body cell mass measurements found')
      }

      const currentBCM = chartData[chartData.length - 1]?.value
      const previousBCM = chartData.length > 7 ? chartData[chartData.length - 8]?.value : chartData[0]?.value
      const change = currentBCM - previousBCM

      return {
        data: chartData,
        metric: 'body_cell_mass',
        unit: 'lbs',
        current_value: currentBCM,
        change_amount: change,
        trend_direction: change > 0.2 ? 'increasing' : change < -0.2 ? 'decreasing' : 'stable'
      }
    } catch (error) {
      console.error('❌ Error fetching body cell mass data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const bcmData = useMockData ? generateMockData() : await fetchRealData()
      setData(bcmData)
      console.log('🧬 [Body Cell Mass Trend Widget] Data loaded:', bcmData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load body cell mass data'
      setError(errorMessage)
      console.error('❌ [Body Cell Mass Trend Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'body_cell_mass', unit: 'lbs' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="cell"
      color="#8b5cf6"
      referenceLines={[
        { value: 80, label: 'Low', color: '#ef4444', strokeDasharray: '3 3' },
        { value: 90, label: 'Average', color: '#3b82f6', strokeDasharray: '5 5' },
        { value: 100, label: 'Good', color: '#10b981', strokeDasharray: '5 5' },
        { value: 110, label: 'Excellent', color: '#059669', strokeDasharray: '5 5' }
      ]}
      yAxisDomain={['auto', 'auto']}
      showDots={true}
      precision={1}
      className={className}
    />
  )
}

export default BodyCellMassTrendWidget
