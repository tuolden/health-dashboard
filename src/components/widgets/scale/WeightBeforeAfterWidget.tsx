/**
 * Weight Before vs After (Per Weigh-In) Widget - Issue #11 Widget #21
 * 
 * Displays weight before vs after for each scale session
 */

import React, { useState, useEffect } from 'react'
import { ScaleComparisonWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleComparisonData } from './types'

interface WeightBeforeAfterWidgetProps extends WidgetProps {
  useMockData?: boolean
  sessionCount?: number
}

/**
 * Widget #21: Weight Before vs After (Per Weigh-In)
 * Shows before/after weight comparison for recent scale sessions
 */
const WeightBeforeAfterWidget: React.FC<WeightBeforeAfterWidgetProps> = ({
  config,
  dataState,
  onRefresh,
  useMockData = true,
  sessionCount = 5,
  className = ''
}) => {
  const [data, setData] = useState<ScaleComparisonData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateMockData = (): ScaleComparisonData => {
    const dataPoints = []
    
    for (let i = sessionCount - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i * 3) // Every 3 days
      
      const beforeWeight = 175 + (Math.random() - 0.5) * 8 // 171-179 range
      const afterWeight = beforeWeight - (Math.random() * 2) // 0-2 lbs lighter after
      const change = afterWeight - beforeWeight
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        before: beforeWeight,
        after: afterWeight,
        change: change,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const latest = dataPoints[dataPoints.length - 1]

    return {
      data: dataPoints,
      metric: 'weight',
      unit: 'lbs',
      latest_before: latest?.before,
      latest_after: latest?.after,
      latest_change: latest?.change
    }
  }

  const fetchRealData = async (): Promise<ScaleComparisonData> => {
    try {
      // Get recent weight sessions with before/after data
      const response = await fetch(`/api/scale/weight-sessions/summary?limit=${sessionCount + 5}`)
      if (!response.ok) throw new Error('Failed to fetch weight sessions')
      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('No weight session data available')
      }

      // Filter sessions that have both before and after weights
      const sessionsWithBeforeAfter = result.data
        .filter((session: any) => 
          session.weight_before !== null && 
          session.weight_after !== null
        )
        .slice(0, sessionCount)

      if (sessionsWithBeforeAfter.length === 0) {
        throw new Error('No before/after weight measurements found')
      }

      const chartData = sessionsWithBeforeAfter.map((session: any) => ({
        date: session.date,
        before: session.weight_before,
        after: session.weight_after,
        change: session.weight_change || (session.weight_after - session.weight_before),
        displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))

      const latest = chartData[0] // Most recent session

      return {
        data: chartData.reverse(), // Show oldest to newest
        metric: 'weight',
        unit: 'lbs',
        latest_before: latest?.before,
        latest_after: latest?.after,
        latest_change: latest?.change
      }
    } catch (error) {
      console.error('❌ Error fetching weight before/after data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const weightData = useMockData ? generateMockData() : await fetchRealData()
      setData(weightData)
      console.log('⚖️📊 [Weight Before/After Widget] Data loaded:', weightData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weight before/after data'
      setError(errorMessage)
      console.error('❌ [Weight Before/After Widget] Error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [useMockData, sessionCount])

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
    <ScaleComparisonWidget
      config={config}
      data={data || { data: [], metric: 'weight', unit: 'lbs' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="scale"
      beforeColor="#94a3b8"
      afterColor="#2563eb"
      showChart={true}
      precision={1}
      className={className}
    />
  )
}

export default WeightBeforeAfterWidget
