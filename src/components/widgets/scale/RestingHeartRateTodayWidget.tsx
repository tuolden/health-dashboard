/**
 * Resting Heart Rate Today Widget - Issue #11 Widget #12
 * 
 * Displays current resting heart rate with fitness level assessment
 */

import React, { useState, useEffect } from 'react'
import { ScaleNumberWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleNumberData } from './types'

interface RestingHeartRateTodayWidgetProps extends WidgetProps {
  useMockData?: boolean
}

/**
 * Widget #12: Resting Heart Rate Today
 * Shows current resting heart rate with fitness assessment
 */
const RestingHeartRateTodayWidget: React.FC<RestingHeartRateTodayWidgetProps> = ({
  config,
  dataState,
  onRefresh,
  useMockData = true,
  className = ''
}) => {
  const [data, setData] = useState<ScaleNumberData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateMockData = (): ScaleNumberData => {
    const currentRHR = 58 + (Math.random() - 0.5) * 10 // 53-63 bpm range
    const previousRHR = currentRHR + (Math.random() - 0.5) * 4 // ±2 bpm change
    const change = currentRHR - previousRHR
    const changePercentage = (change / previousRHR) * 100

    return {
      current_value: Math.round(currentRHR),
      previous_value: Math.round(previousRHR),
      change_amount: change,
      change_percentage: changePercentage,
      trend_direction: change > 1 ? 'increasing' : change < -1 ? 'decreasing' : 'stable',
      unit: 'bpm',
      label: 'Resting Heart Rate',
      date: new Date().toISOString()
    }
  }

  const fetchRealData = async (): Promise<ScaleNumberData> => {
    try {
      const snapshotResponse = await fetch('/api/scale/health-snapshot')
      if (!snapshotResponse.ok) throw new Error('Failed to fetch health snapshot')
      const snapshotResult = await snapshotResponse.json()

      const sessionsResponse = await fetch('/api/scale/weight-sessions?limit=10')
      if (!sessionsResponse.ok) throw new Error('Failed to fetch weight sessions')
      const sessionsResult = await sessionsResponse.json()

      const snapshot = snapshotResult.data
      const sessions = sessionsResult.data || []

      if (!snapshot?.resting_heart_rate) {
        throw new Error('No resting heart rate data available')
      }

      const currentRHR = snapshot.resting_heart_rate
      const previousSession = sessions.find((session: any, index: number) => 
        index > 0 && session.resting_heart_rate_after !== null
      )
      const previousRHR = previousSession?.resting_heart_rate_after

      let change = null
      let changePercentage = null
      let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable'

      if (previousRHR !== undefined) {
        change = currentRHR - previousRHR
        changePercentage = (change / previousRHR) * 100
        trendDirection = change > 1 ? 'increasing' : change < -1 ? 'decreasing' : 'stable'
      }

      return {
        current_value: currentRHR,
        previous_value: previousRHR,
        change_amount: change,
        change_percentage: changePercentage,
        trend_direction: trendDirection,
        unit: 'bpm',
        label: 'Resting Heart Rate',
        date: snapshot.date
      }
    } catch (error) {
      console.error('❌ Error fetching resting heart rate data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const rhrData = useMockData ? generateMockData() : await fetchRealData()
      setData(rhrData)
      console.log('❤️ [RHR Today Widget] Data loaded:', rhrData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load resting heart rate data'
      setError(errorMessage)
      console.error('❌ [RHR Today Widget] Error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [useMockData])

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
    <ScaleNumberWidget
      config={config}
      data={data || {}}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="heart"
      precision={0}
      showComparison={true}
      thresholds={{
        good: 60,
        warning: 70,
        danger: 80
      }}
      className={className}
    />
  )
}

export default RestingHeartRateTodayWidget
