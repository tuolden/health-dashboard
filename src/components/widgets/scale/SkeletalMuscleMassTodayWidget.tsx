/**
 * Skeletal Muscle Mass Today Widget - Issue #11 Widget #6
 * 
 * Displays current skeletal muscle mass with comparison to previous measurement
 */

import React, { useState, useEffect } from 'react'
import { ScaleNumberWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleNumberData } from './types'

interface SkeletalMuscleMassTodayWidgetProps extends WidgetProps {
  useMockData?: boolean
}

/**
 * Widget #6: Skeletal Muscle Mass Today
 * Shows current skeletal muscle mass with trend analysis
 */
const SkeletalMuscleMassTodayWidget: React.FC<SkeletalMuscleMassTodayWidgetProps> = ({
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
    const currentMuscle = 75.5 + (Math.random() - 0.5) * 5 // 73-78 lbs range
    const previousMuscle = currentMuscle + (Math.random() - 0.5) * 2 // ±1 lb change
    const change = currentMuscle - previousMuscle
    const changePercentage = (change / previousMuscle) * 100

    return {
      current_value: currentMuscle,
      previous_value: previousMuscle,
      change_amount: change,
      change_percentage: changePercentage,
      trend_direction: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable',
      unit: 'lbs',
      label: 'Skeletal Muscle Mass',
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

      // Get recent sessions for comparison
      const sessionsResponse = await fetch('/api/scale/weight-sessions?limit=10')
      if (!sessionsResponse.ok) throw new Error('Failed to fetch weight sessions')
      const sessionsResult = await sessionsResponse.json()

      const snapshot = snapshotResult.data
      const sessions = sessionsResult.data || []

      if (!snapshot?.skeletal_muscle_mass) {
        throw new Error('No skeletal muscle mass data available')
      }

      // Find previous measurement for comparison
      const currentMuscle = snapshot.skeletal_muscle_mass
      const previousSession = sessions.find((session: any, index: number) => 
        index > 0 && session.skeletal_muscle_mass_after !== null
      )
      const previousMuscle = previousSession?.skeletal_muscle_mass_after

      let change = null
      let changePercentage = null
      let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable'

      if (previousMuscle !== undefined) {
        change = currentMuscle - previousMuscle
        changePercentage = (change / previousMuscle) * 100
        trendDirection = change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable'
      }

      return {
        current_value: currentMuscle,
        previous_value: previousMuscle,
        change_amount: change,
        change_percentage: changePercentage,
        trend_direction: trendDirection,
        unit: 'lbs',
        label: 'Skeletal Muscle Mass',
        date: snapshot.date
      }
    } catch (error) {
      console.error('❌ Error fetching skeletal muscle mass data:', error)
      throw error
    }
  }

  // Load data
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const muscleData = useMockData ? generateMockData() : await fetchRealData()
      setData(muscleData)
      console.log('💪 [Skeletal Muscle Mass Today Widget] Data loaded:', muscleData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load skeletal muscle mass data'
      setError(errorMessage)
      console.error('❌ [Skeletal Muscle Mass Today Widget] Error:', errorMessage)
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
      icon="muscle"
      precision={1}
      showComparison={true}
      thresholds={{
        good: 70,
        warning: 60,
        danger: 50
      }}
      className={className}
    />
  )
}

export default SkeletalMuscleMassTodayWidget
