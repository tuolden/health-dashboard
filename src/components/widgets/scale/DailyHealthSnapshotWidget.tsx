/**
 * Daily Health Snapshot Widget - Issue #11 Widget #24
 * 
 * Displays comprehensive daily health metrics in a grid layout
 */

import React, { useState, useEffect } from 'react'
import ScaleBaseWidget from './ScaleBaseWidget'
import { WidgetProps } from '../../../types/widget'
import { HealthSnapshotData } from './types'
import Icon from '../../Icon'

interface DailyHealthSnapshotWidgetProps extends WidgetProps {
  useMockData?: boolean
}

/**
 * Widget #24: Daily Health Snapshot
 * Shows comprehensive overview of today's health metrics
 */
const DailyHealthSnapshotWidget: React.FC<DailyHealthSnapshotWidgetProps> = ({
  config,
  dataState,
  onRefresh,
  useMockData = true,
  className = ''
}) => {
  const [data, setData] = useState<HealthSnapshotData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateMockData = (): HealthSnapshotData => {
    return {
      date: new Date().toISOString().split('T')[0],
      weight: 175.2,
      body_fat_percentage: 17.8,
      skeletal_muscle_mass: 76.3,
      body_water: 62.1,
      bmr: 1847,
      resting_heart_rate: 58,
      metabolic_age: 32,
      health_score: 82
    }
  }

  const fetchRealData = async (): HealthSnapshotData => {
    try {
      const response = await fetch('/api/scale/health-snapshot')
      if (!response.ok) throw new Error('Failed to fetch health snapshot')
      const result = await response.json()

      const snapshot = result.data
      if (!snapshot) {
        throw new Error('No health snapshot data available')
      }

      return {
        date: snapshot.date,
        weight: snapshot.weight,
        body_fat_percentage: snapshot.body_fat_percentage,
        skeletal_muscle_mass: snapshot.skeletal_muscle_mass,
        body_water: snapshot.body_water,
        bmr: snapshot.bmr,
        resting_heart_rate: snapshot.resting_heart_rate,
        metabolic_age: snapshot.metabolic_age,
        health_score: snapshot.health_score
      }
    } catch (error) {
      console.error('❌ Error fetching daily health snapshot:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const snapshotData = useMockData ? generateMockData() : await fetchRealData()
      setData(snapshotData)
      console.log('📸🏥 [Daily Health Snapshot Widget] Data loaded:', snapshotData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load health snapshot'
      setError(errorMessage)
      console.error('❌ [Daily Health Snapshot Widget] Error:', errorMessage)
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

  const formatValue = (value?: number, unit?: string, precision = 1) => {
    if (value === undefined || value === null) return '--'
    return `${value.toFixed(precision)}${unit || ''}`
  }

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const widgetDataState = {
    ...dataState,
    isLoading: isLoading || dataState.isLoading,
    isError: !!error || dataState.isError,
    errorMessage: error || dataState.errorMessage,
    lastUpdated: data ? new Date() : dataState.lastUpdated
  }

  return (
    <ScaleBaseWidget
      config={config}
      data={data || {}}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="dashboard"
      className={className}
    >
      <div className="space-y-4">
        {/* Header with Health Score */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getHealthScoreColor(data?.health_score)}`}>
            {data?.health_score || '--'}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Overall Health Score</p>
          {data?.date && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(data.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Weight */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Icon name="weight-scale" className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-blue-600 dark:text-blue-400">Weight</span>
            </div>
            <div className="font-bold text-blue-800 dark:text-blue-200">
              {formatValue(data?.weight, ' lbs')}
            </div>
          </div>

          {/* Body Fat % */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Icon name="percentage" className="w-3 h-3 text-red-600" />
              <span className="text-xs text-red-600 dark:text-red-400">Body Fat</span>
            </div>
            <div className="font-bold text-red-800 dark:text-red-200">
              {formatValue(data?.body_fat_percentage, '%')}
            </div>
          </div>

          {/* Muscle Mass */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Icon name="muscle" className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600 dark:text-green-400">Muscle</span>
            </div>
            <div className="font-bold text-green-800 dark:text-green-200">
              {formatValue(data?.skeletal_muscle_mass, ' lbs')}
            </div>
          </div>

          {/* Body Water */}
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Icon name="droplet" className="w-3 h-3 text-cyan-600" />
              <span className="text-xs text-cyan-600 dark:text-cyan-400">Water</span>
            </div>
            <div className="font-bold text-cyan-800 dark:text-cyan-200">
              {formatValue(data?.body_water, '%')}
            </div>
          </div>

          {/* BMR */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Icon name="fire" className="w-3 h-3 text-orange-600" />
              <span className="text-xs text-orange-600 dark:text-orange-400">BMR</span>
            </div>
            <div className="font-bold text-orange-800 dark:text-orange-200">
              {formatValue(data?.bmr, ' cal', 0)}
            </div>
          </div>

          {/* Resting Heart Rate */}
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Icon name="heart" className="w-3 h-3 text-pink-600" />
              <span className="text-xs text-pink-600 dark:text-pink-400">RHR</span>
            </div>
            <div className="font-bold text-pink-800 dark:text-pink-200">
              {formatValue(data?.resting_heart_rate, ' bpm', 0)}
            </div>
          </div>
        </div>

        {/* Metabolic Age */}
        {data?.metabolic_age && (
          <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Icon name="clock" className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-purple-600 dark:text-purple-400">Metabolic Age</span>
            </div>
            <div className="font-bold text-purple-800 dark:text-purple-200">
              {data.metabolic_age} years
            </div>
          </div>
        )}
      </div>
    </ScaleBaseWidget>
  )
}

export default DailyHealthSnapshotWidget
