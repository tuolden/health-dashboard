/**
 * Current Weight Widget - Issue #11 Widget #1
 * 
 * Displays current weight with trend and comparison to previous measurement
 */

import React, { useState, useEffect } from 'react'
import { ScaleNumberWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleNumberData } from './types'

interface CurrentWeightWidgetProps extends WidgetProps {
  useMockData?: boolean
}

/**
 * Widget #1: Current Weight
 * Shows latest weight measurement with change from previous reading
 */
const CurrentWeightWidget: React.FC<CurrentWeightWidgetProps> = ({
  config,
  dataState,
  onRefresh,
  useMockData = true,
  className = ''
}) => {
  const [data, setData] = useState<ScaleNumberData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data generator
  const generateMockData = (): ScaleNumberData => {
    const currentWeight = 175.2 + (Math.random() - 0.5) * 10 // 170-180 lbs range
    const previousWeight = currentWeight + (Math.random() - 0.5) * 4 // ±2 lbs change
    const change = currentWeight - previousWeight
    const changePercentage = (change / previousWeight) * 100

    return {
      current_value: currentWeight,
      previous_value: previousWeight,
      change_amount: change,
      change_percentage: changePercentage,
      trend_direction: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable',
      unit: 'lbs',
      label: 'Current Weight',
      date: new Date().toISOString()
    }
  }

  // Fetch real data from API
  const fetchRealData = async (): Promise<ScaleNumberData> => {
    try {
      // Get latest health snapshot
      const snapshotResponse = await fetch('/api/scale/health-snapshot')
      if (!snapshotResponse.ok) throw new Error('Failed to fetch health snapshot')
      const snapshotResult = await snapshotResponse.json()

      // Get weight delta for trend
      const deltaResponse = await fetch('/api/scale/weight-delta?days=7')
      if (!deltaResponse.ok) throw new Error('Failed to fetch weight delta')
      const deltaResult = await deltaResponse.json()

      const snapshot = snapshotResult.data
      const delta = deltaResult.data

      if (!snapshot?.weight) {
        throw new Error('No weight data available')
      }

      return {
        current_value: snapshot.weight,
        previous_value: delta?.previous_value,
        change_amount: delta?.change_amount,
        change_percentage: delta?.change_percentage,
        trend_direction: delta?.trend_direction || 'stable',
        unit: 'lbs',
        label: 'Current Weight',
        date: snapshot.date
      }
    } catch (error) {
      console.error('❌ Error fetching current weight data:', error)
      throw error
    }
  }

  // Load data
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const weightData = useMockData ? generateMockData() : await fetchRealData()
      setData(weightData)
      console.log('⚖️ [Current Weight Widget] Data loaded:', weightData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weight data'
      setError(errorMessage)
      console.error('❌ [Current Weight Widget] Error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount and when refresh is triggered
  useEffect(() => {
    loadData()
  }, [useMockData])

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
    <ScaleNumberWidget
      config={config}
      data={data || {}}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="weight-scale"
      precision={1}
      showComparison={true}
      thresholds={{
        good: 150,
        warning: 200,
        danger: 250
      }}
      className={className}
    />
  )
}

export default CurrentWeightWidget
