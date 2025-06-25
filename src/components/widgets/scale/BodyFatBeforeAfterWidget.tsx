/**
 * Body Fat % Before vs After Widget - Issue #11 Widget #22
 * 
 * Displays body fat percentage before vs after for each scale session
 */

import React, { useState, useEffect } from 'react'
import { ScaleComparisonWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleComparisonData } from './types'

interface BodyFatBeforeAfterWidgetProps extends WidgetProps {
  useMockData?: boolean
  sessionCount?: number
}

/**
 * Widget #22: Body Fat % Before vs After
 * Shows before/after body fat percentage comparison for recent scale sessions
 */
const BodyFatBeforeAfterWidget: React.FC<BodyFatBeforeAfterWidgetProps> = ({
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
      
      const beforeBodyFat = 18 + (Math.random() - 0.5) * 4 // 16-20% range
      const afterBodyFat = beforeBodyFat - (Math.random() * 0.5) // 0-0.5% lower after
      const change = afterBodyFat - beforeBodyFat
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        before: beforeBodyFat,
        after: afterBodyFat,
        change: change,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    const latest = dataPoints[dataPoints.length - 1]

    return {
      data: dataPoints,
      metric: 'body_fat_percentage',
      unit: '%',
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
        throw new Error('No body fat session data available')
      }

      // Filter sessions that have both before and after body fat percentages
      const sessionsWithBeforeAfter = result.data
        .filter((session: any) => 
          session.body_fat_percentage_before !== null && 
          session.body_fat_percentage_after !== null
        )
        .slice(0, sessionCount)

      if (sessionsWithBeforeAfter.length === 0) {
        throw new Error('No before/after body fat measurements found')
      }

      const chartData = sessionsWithBeforeAfter.map((session: any) => ({
        date: session.date,
        before: session.body_fat_percentage_before,
        after: session.body_fat_percentage_after,
        change: session.body_fat_change || (session.body_fat_percentage_after - session.body_fat_percentage_before),
        displayDate: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))

      const latest = chartData[0] // Most recent session

      return {
        data: chartData.reverse(), // Show oldest to newest
        metric: 'body_fat_percentage',
        unit: '%',
        latest_before: latest?.before,
        latest_after: latest?.after,
        latest_change: latest?.change
      }
    } catch (error) {
      console.error('❌ Error fetching body fat before/after data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const bodyFatData = useMockData ? generateMockData() : await fetchRealData()
      setData(bodyFatData)
      console.log('📊🔥 [Body Fat Before/After Widget] Data loaded:', bodyFatData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load body fat before/after data'
      setError(errorMessage)
      console.error('❌ [Body Fat Before/After Widget] Error:', errorMessage)
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
      data={data || { data: [], metric: 'body_fat_percentage', unit: '%' }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="percentage"
      beforeColor="#f59e0b"
      afterColor="#dc2626"
      showChart={true}
      precision={1}
      className={className}
    />
  )
}

export default BodyFatBeforeAfterWidget
