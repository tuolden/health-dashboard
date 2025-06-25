/**
 * Change in Body Fat Mass (Last 30 Days) Widget - Issue #11 Widget #19
 * 
 * Displays body fat mass change over the last 30 days
 */

import React, { useState, useEffect } from 'react'
import { ScaleNumberWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleNumberData } from './types'

interface BodyFatChange30DaysWidgetProps extends WidgetProps {
  useMockData?: boolean
}

/**
 * Widget #19: Change in Body Fat Mass (Last 30 Days)
 * Shows body fat mass change over the past month
 */
const BodyFatChange30DaysWidget: React.FC<BodyFatChange30DaysWidgetProps> = ({
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
    const currentBodyFatMass = 28.5
    const monthAgoBodyFatMass = currentBodyFatMass + (Math.random() - 0.7) * 3 // Bias toward fat loss
    const change = currentBodyFatMass - monthAgoBodyFatMass
    const changePercentage = (change / monthAgoBodyFatMass) * 100

    return {
      current_value: change,
      previous_value: 0, // Previous month's change for comparison
      change_amount: change,
      change_percentage: changePercentage,
      trend_direction: change > 0.2 ? 'increasing' : change < -0.2 ? 'decreasing' : 'stable',
      unit: 'lbs',
      label: '30-Day Body Fat Change',
      date: new Date().toISOString()
    }
  }

  const fetchRealData = async (): Promise<ScaleNumberData> => {
    try {
      // Get current and 30-day-old body fat mass
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/scale/weight-sessions?startDate=${startDate}&endDate=${endDate}&limit=50`)
      if (!response.ok) throw new Error('Failed to fetch weight sessions')
      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('No body fat mass data available')
      }

      const sessions = result.data.filter((session: any) => session.body_fat_mass_after !== null)
      
      if (sessions.length < 2) {
        throw new Error('Insufficient body fat mass data for 30-day comparison')
      }

      // Get most recent and oldest measurements
      const sortedSessions = sessions.sort((a: any, b: any) => a.date.localeCompare(b.date))
      const oldestBodyFatMass = sortedSessions[0].body_fat_mass_after
      const newestBodyFatMass = sortedSessions[sortedSessions.length - 1].body_fat_mass_after

      const change = newestBodyFatMass - oldestBodyFatMass
      const changePercentage = (change / oldestBodyFatMass) * 100

      // Get previous month's change for comparison (if available)
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      let previousMonthChange = 0

      try {
        const prevResponse = await fetch(`/api/scale/weight-sessions?startDate=${twoMonthsAgo}&endDate=${startDate}&limit=50`)
        if (prevResponse.ok) {
          const prevResult = await prevResponse.json()
          const prevSessions = prevResult.data?.filter((session: any) => session.body_fat_mass_after !== null) || []
          
          if (prevSessions.length >= 2) {
            const prevSorted = prevSessions.sort((a: any, b: any) => a.date.localeCompare(b.date))
            const prevOldest = prevSorted[0].body_fat_mass_after
            const prevNewest = prevSorted[prevSorted.length - 1].body_fat_mass_after
            previousMonthChange = prevNewest - prevOldest
          }
        }
      } catch (e) {
        console.log('Could not fetch previous month data for comparison')
      }

      return {
        current_value: change,
        previous_value: previousMonthChange,
        change_amount: change,
        change_percentage: changePercentage,
        trend_direction: change > 0.2 ? 'increasing' : change < -0.2 ? 'decreasing' : 'stable',
        unit: 'lbs',
        label: '30-Day Body Fat Change',
        date: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Error fetching 30-day body fat change data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const changeData = useMockData ? generateMockData() : await fetchRealData()
      setData(changeData)
      console.log('📉 [30-Day Body Fat Change Widget] Data loaded:', changeData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load body fat change data'
      setError(errorMessage)
      console.error('❌ [30-Day Body Fat Change Widget] Error:', errorMessage)
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
      icon="trending-down"
      precision={1}
      showComparison={true}
      thresholds={{
        good: -1, // Body fat loss is good
        warning: 0.5, // Small body fat gain
        danger: 2  // Significant body fat gain
      }}
      className={className}
    />
  )
}

export default BodyFatChange30DaysWidget
