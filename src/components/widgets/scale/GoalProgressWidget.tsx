/**
 * Goal Progress to Target Weight Widget - Issue #11 Widget #25
 * 
 * Displays progress toward target weight goal with timeline estimation
 */

import React, { useState, useEffect } from 'react'
import { ScaleProgressWidget } from './index'
import { WidgetProps } from '../../../types/widget'
import { ScaleProgressData } from './types'

interface GoalProgressWidgetProps extends WidgetProps {
  useMockData?: boolean
  targetWeight?: number // User's target weight goal
  startWeight?: number // Starting weight for goal
}

/**
 * Widget #25: Goal Progress to Target Weight
 * Shows progress toward weight loss/gain goal with timeline
 */
const GoalProgressWidget: React.FC<GoalProgressWidgetProps> = ({
  config,
  dataState,
  onRefresh,
  useMockData = true,
  targetWeight = 170, // Default target weight
  startWeight = 180, // Default starting weight
  className = ''
}) => {
  const [data, setData] = useState<ScaleProgressData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateMockData = (): ScaleProgressData => {
    const currentWeight = 175.2 // Current progress
    const totalChange = targetWeight - startWeight
    const currentChange = currentWeight - startWeight
    const progressPercentage = Math.abs(currentChange / totalChange) * 100
    const remaining = targetWeight - currentWeight

    // Estimate completion date based on current rate (assuming 1 lb per week)
    const weeksRemaining = Math.abs(remaining) / 1
    const estimatedCompletion = new Date()
    estimatedCompletion.setDate(estimatedCompletion.getDate() + weeksRemaining * 7)

    return {
      current_value: currentWeight,
      goal_value: targetWeight,
      start_value: startWeight,
      progress_percentage: Math.min(progressPercentage, 100),
      remaining_amount: remaining,
      estimated_completion_date: estimatedCompletion.toISOString(),
      unit: 'lbs',
      metric: 'weight_goal'
    }
  }

  const fetchRealData = async (): Promise<ScaleProgressData> => {
    try {
      // Get current weight
      const snapshotResponse = await fetch('/api/scale/health-snapshot')
      if (!snapshotResponse.ok) throw new Error('Failed to fetch current weight')
      const snapshotResult = await snapshotResponse.json()

      const currentWeight = snapshotResult.data?.weight
      if (!currentWeight) {
        throw new Error('No current weight data available')
      }

      // Calculate progress
      const totalChange = targetWeight - startWeight
      const currentChange = currentWeight - startWeight
      const progressPercentage = totalChange !== 0 ? Math.abs(currentChange / totalChange) * 100 : 0
      const remaining = targetWeight - currentWeight

      // Get recent weight trend to estimate completion
      let estimatedCompletion = null
      try {
        const deltaResponse = await fetch('/api/scale/weight-delta?days=30')
        if (deltaResponse.ok) {
          const deltaResult = await deltaResponse.json()
          const monthlyChange = deltaResult.data?.change_amount || 0
          
          if (Math.abs(monthlyChange) > 0.1) {
            // Estimate based on current monthly rate
            const monthsRemaining = Math.abs(remaining) / Math.abs(monthlyChange)
            const completion = new Date()
            completion.setMonth(completion.getMonth() + monthsRemaining)
            estimatedCompletion = completion.toISOString()
          }
        }
      } catch (e) {
        console.log('Could not calculate estimated completion')
      }

      return {
        current_value: currentWeight,
        goal_value: targetWeight,
        start_value: startWeight,
        progress_percentage: Math.min(Math.max(progressPercentage, 0), 100),
        remaining_amount: remaining,
        estimated_completion_date: estimatedCompletion,
        unit: 'lbs',
        metric: 'weight_goal'
      }
    } catch (error) {
      console.error('❌ Error fetching goal progress data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const goalData = useMockData ? generateMockData() : await fetchRealData()
      setData(goalData)
      console.log('🎯📈 [Goal Progress Widget] Data loaded:', goalData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load goal progress data'
      setError(errorMessage)
      console.error('❌ [Goal Progress Widget] Error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [useMockData, targetWeight, startWeight])

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
    <ScaleProgressWidget
      config={config}
      data={data || { 
        current_value: 0, 
        goal_value: targetWeight, 
        start_value: startWeight, 
        unit: 'lbs', 
        metric: 'weight_goal' 
      }}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="target"
      progressColor="#3b82f6"
      showEstimatedCompletion={true}
      precision={1}
      className={className}
    />
  )
}

export default GoalProgressWidget
