/**
 * Change in Weight (Last 7 Days) Widget - Issue #11 Widget #18
 * 
 * Displays weight change over the last 7 days with trend analysis
 */

import React, { useState, useEffect } from 'react'
import { ScaleNumberWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleNumberData } from './types'

interface WeightChange7DaysWidgetProps extends WidgetProps {
  useMockData?: boolean
}

/**
 * Widget #18: Change in Weight (Last 7 Days)
 * Shows weight change over the past week with trend assessment
 */
const WeightChange7DaysWidget: React.FC<WeightChange7DaysWidgetProps> = ({
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
    const currentWeight = 175.2
    const weekAgoWeight = currentWeight + (Math.random() - 0.5) * 4 // ±2 lbs change
    const change = currentWeight - weekAgoWeight
    const changePercentage = (change / weekAgoWeight) * 100

    return {
      current_value: change, // The change itself is the main value
      previous_value: 0, // Previous week's change (for comparison)
      change_amount: change,
      change_percentage: changePercentage,
      trend_direction: change > 0.2 ? 'increasing' : change < -0.2 ? 'decreasing' : 'stable',
      unit: 'lbs',
      label: '7-Day Weight Change',
      date: new Date().toISOString()
    }
  }

  const fetchRealData = async (): Promise<ScaleNumberData> => {
    try {
      // Get weight delta for 7 days
      const response = await fetch('/api/scale/weight-delta?days=7')
      if (!response.ok) throw new Error('Failed to fetch weight delta')
      const result = await response.json()

      const delta = result.data
      if (!delta) {
        throw new Error('No weight change data available')
      }

      // Get 14-day delta for comparison (previous week's change)
      const prevResponse = await fetch('/api/scale/weight-delta?days=14')
      let previousWeekChange = 0
      if (prevResponse.ok) {
        const prevResult = await prevResponse.json()
        if (prevResult.data?.change_amount) {
          // Calculate previous week's change (14-day change minus current 7-day change)
          previousWeekChange = prevResult.data.change_amount - (delta.change_amount || 0)
        }
      }

      const change = delta.change_amount || 0
      const changePercentage = delta.change_percentage || 0

      return {
        current_value: change,
        previous_value: previousWeekChange,
        change_amount: change,
        change_percentage: changePercentage,
        trend_direction: delta.trend_direction || 'stable',
        unit: 'lbs',
        label: '7-Day Weight Change',
        date: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Error fetching 7-day weight change data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const changeData = useMockData ? generateMockData() : await fetchRealData()
      setData(changeData)
      console.log('📊 [7-Day Weight Change Widget] Data loaded:', changeData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weight change data'
      setError(errorMessage)
      console.error('❌ [7-Day Weight Change Widget] Error:', errorMessage)
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
      icon="trending-up"
      precision={1}
      showComparison={true}
      thresholds={{
        good: -1, // Weight loss is good
        warning: 1, // Small weight gain
        danger: 3  // Significant weight gain
      }}
      className={className}
    />
  )
}

export default WeightChange7DaysWidget
