/**
 * Metabolic Age vs Real Age Widget - Issue #11 Widget #9
 * 
 * Displays metabolic age compared to chronological age with health implications
 */

import React, { useState, useEffect } from 'react'
import ScaleBaseWidget from './ScaleBaseWidget'
import { WidgetProps } from '../../../types/widget'
import Icon from '../../Icon'

interface MetabolicAgeData {
  metabolic_age?: number
  real_age?: number
  age_difference?: number
  health_status?: 'excellent' | 'good' | 'average' | 'poor'
  date?: string
}

interface MetabolicAgeWidgetProps extends WidgetProps {
  useMockData?: boolean
  realAge?: number // User's actual age
}

/**
 * Widget #9: Metabolic Age vs Real Age
 * Shows metabolic age compared to chronological age
 */
const MetabolicAgeWidget: React.FC<MetabolicAgeWidgetProps> = ({
  config,
  dataState,
  onRefresh,
  useMockData = true,
  realAge = 35, // Default age, should come from user profile
  className = ''
}) => {
  const [data, setData] = useState<MetabolicAgeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data generator
  const generateMockData = (): MetabolicAgeData => {
    const metabolicAge = realAge + (Math.random() - 0.6) * 10 // Slightly younger on average
    const ageDifference = metabolicAge - realAge
    
    let healthStatus: 'excellent' | 'good' | 'average' | 'poor'
    if (ageDifference <= -5) healthStatus = 'excellent'
    else if (ageDifference <= -2) healthStatus = 'good'
    else if (ageDifference <= 2) healthStatus = 'average'
    else healthStatus = 'poor'

    return {
      metabolic_age: Math.round(metabolicAge),
      real_age: realAge,
      age_difference: ageDifference,
      health_status: healthStatus,
      date: new Date().toISOString()
    }
  }

  // Fetch real data from API
  const fetchRealData = async (): MetabolicAgeData => {
    try {
      // Get latest health snapshot
      const response = await fetch('/api/scale/health-snapshot')
      if (!response.ok) throw new Error('Failed to fetch health snapshot')
      const result = await response.json()

      const snapshot = result.data
      if (!snapshot?.metabolic_age) {
        throw new Error('No metabolic age data available')
      }

      const metabolicAge = snapshot.metabolic_age
      const ageDifference = metabolicAge - realAge
      
      let healthStatus: 'excellent' | 'good' | 'average' | 'poor'
      if (ageDifference <= -5) healthStatus = 'excellent'
      else if (ageDifference <= -2) healthStatus = 'good'
      else if (ageDifference <= 2) healthStatus = 'average'
      else healthStatus = 'poor'

      return {
        metabolic_age: metabolicAge,
        real_age: realAge,
        age_difference: ageDifference,
        health_status: healthStatus,
        date: snapshot.date
      }
    } catch (error) {
      console.error('❌ Error fetching metabolic age data:', error)
      throw error
    }
  }

  // Load data
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const ageData = useMockData ? generateMockData() : await fetchRealData()
      setData(ageData)
      console.log('🧬 [Metabolic Age Widget] Data loaded:', ageData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load metabolic age data'
      setError(errorMessage)
      console.error('❌ [Metabolic Age Widget] Error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount and when refresh is triggered
  useEffect(() => {
    loadData()
  }, [useMockData, realAge])

  // Handle refresh
  const handleRefresh = () => {
    loadData()
    onRefresh()
  }

  // Get status color and message
  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'excellent':
        return { color: 'text-green-600', bgColor: 'bg-green-100', message: 'Excellent metabolic health!' }
      case 'good':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', message: 'Good metabolic health' }
      case 'average':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', message: 'Average metabolic health' }
      case 'poor':
        return { color: 'text-red-600', bgColor: 'bg-red-100', message: 'Focus on metabolic health' }
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', message: 'No data available' }
    }
  }

  // Prepare widget data state
  const widgetDataState = {
    ...dataState,
    isLoading: isLoading || dataState.isLoading,
    isError: !!error || dataState.isError,
    errorMessage: error || dataState.errorMessage,
    lastUpdated: data ? new Date() : dataState.lastUpdated
  }

  const statusInfo = getStatusInfo(data?.health_status)

  return (
    <ScaleBaseWidget
      config={config}
      data={data || {}}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="clock"
      className={className}
    >
      <div className="space-y-4">
        {/* Age Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data?.real_age || '--'}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Real Age</p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${statusInfo.color}`}>
              {data?.metabolic_age || '--'}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Metabolic Age</p>
          </div>
        </div>

        {/* Age Difference */}
        {data?.age_difference !== undefined && (
          <div className="text-center">
            <div className={`flex items-center justify-center space-x-2 ${statusInfo.color}`}>
              <Icon 
                name={data.age_difference < 0 ? 'trending-down' : data.age_difference > 0 ? 'trending-up' : 'minus'} 
                className="w-4 h-4" 
              />
              <span className="font-medium">
                {data.age_difference > 0 ? '+' : ''}{data.age_difference.toFixed(1)} years
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {data.age_difference < 0 ? 'Younger than real age' : 
               data.age_difference > 0 ? 'Older than real age' : 
               'Same as real age'}
            </p>
          </div>
        )}

        {/* Health Status */}
        <div className={`${statusInfo.bgColor} rounded-lg p-3 text-center`}>
          <p className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.message}
          </p>
        </div>

        {/* Visual Comparison */}
        {data?.metabolic_age && data?.real_age && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Younger</span>
              <span>Older</span>
            </div>
            
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              {/* Real age marker */}
              <div 
                className="absolute top-0 w-1 h-2 bg-gray-500 rounded-full"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              />
              
              {/* Metabolic age marker */}
              <div 
                className={`absolute top-0 w-2 h-2 rounded-full ${
                  data.age_difference < 0 ? 'bg-green-500' : 
                  data.age_difference > 0 ? 'bg-red-500' : 
                  'bg-gray-500'
                }`}
                style={{ 
                  left: `${50 + (data.age_difference / 20) * 50}%`, 
                  transform: 'translateX(-50%)' 
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>Real: {data.real_age}</span>
              <span>Metabolic: {data.metabolic_age}</span>
            </div>
          </div>
        )}

        {/* Date */}
        {data?.date && (
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
            {new Date(data.date).toLocaleDateString()}
          </p>
        )}
      </div>
    </ScaleBaseWidget>
  )
}

export default MetabolicAgeWidget
