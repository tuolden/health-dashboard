/**
 * BCM vs Lean Mass Today Widget - Issue #11 Widget #17
 * 
 * Displays body cell mass vs lean mass comparison with ratio analysis
 */

import React, { useState, useEffect } from 'react'
import ScaleBaseWidget from './ScaleBaseWidget'
import { WidgetProps } from '../../../types/widget'
import Icon from '../../Icon'

interface BCMvsLeanMassData {
  body_cell_mass?: number
  lean_mass?: number
  bcm_ratio?: number // BCM as percentage of lean mass
  date?: string
}

interface BCMvsLeanMassWidgetProps extends WidgetProps {
  useMockData?: boolean
}

/**
 * Widget #17: BCM vs Lean Mass Today
 * Shows body cell mass compared to lean mass with ratio analysis
 */
const BCMvsLeanMassWidget: React.FC<BCMvsLeanMassWidgetProps> = ({
  config,
  dataState,
  onRefresh,
  useMockData = true,
  className = ''
}) => {
  const [data, setData] = useState<BCMvsLeanMassData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateMockData = (): BCMvsLeanMassData => {
    const leanMass = 145 + (Math.random() - 0.5) * 10 // 140-150 lbs
    const bodyCellMass = leanMass * (0.65 + (Math.random() - 0.5) * 0.1) // 60-70% of lean mass
    const bcmRatio = (bodyCellMass / leanMass) * 100

    return {
      body_cell_mass: bodyCellMass,
      lean_mass: leanMass,
      bcm_ratio: bcmRatio,
      date: new Date().toISOString()
    }
  }

  const fetchRealData = async (): Promise<BCMvsLeanMassData> => {
    try {
      const response = await fetch('/api/scale/health-snapshot')
      if (!response.ok) throw new Error('Failed to fetch health snapshot')
      const result = await response.json()

      const snapshot = result.data
      if (!snapshot?.body_cell_mass || !snapshot?.lean_mass) {
        throw new Error('No body composition data available')
      }

      const bcmRatio = (snapshot.body_cell_mass / snapshot.lean_mass) * 100

      return {
        body_cell_mass: snapshot.body_cell_mass,
        lean_mass: snapshot.lean_mass,
        bcm_ratio: bcmRatio,
        date: snapshot.date
      }
    } catch (error) {
      console.error('❌ Error fetching BCM vs lean mass data:', error)
      throw error
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const compData = useMockData ? generateMockData() : await fetchRealData()
      setData(compData)
      console.log('🧬💪 [BCM vs Lean Mass Widget] Data loaded:', compData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load body composition data'
      setError(errorMessage)
      console.error('❌ [BCM vs Lean Mass Widget] Error:', errorMessage)
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

  // Get ratio status
  const getRatioStatus = (ratio?: number) => {
    if (!ratio) return { status: 'unknown', color: 'text-gray-500', message: 'No data' }
    
    if (ratio >= 70) return { status: 'excellent', color: 'text-green-600', message: 'Excellent cellular health' }
    if (ratio >= 65) return { status: 'good', color: 'text-blue-600', message: 'Good cellular health' }
    if (ratio >= 60) return { status: 'average', color: 'text-yellow-600', message: 'Average cellular health' }
    return { status: 'poor', color: 'text-red-600', message: 'Focus on cellular health' }
  }

  const formatValue = (value?: number) => {
    if (value === undefined || value === null) return '--'
    return value.toFixed(1)
  }

  const widgetDataState = {
    ...dataState,
    isLoading: isLoading || dataState.isLoading,
    isError: !!error || dataState.isError,
    errorMessage: error || dataState.errorMessage,
    lastUpdated: data ? new Date() : dataState.lastUpdated
  }

  const ratioStatus = getRatioStatus(data?.bcm_ratio)

  return (
    <ScaleBaseWidget
      config={config}
      data={data || {}}
      dataState={widgetDataState}
      onRefresh={handleRefresh}
      icon="compare"
      className={className}
    >
      <div className="space-y-4">
        {/* Main Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {formatValue(data?.body_cell_mass)}
              <span className="text-sm text-gray-500 ml-1">lbs</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Body Cell Mass</p>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {formatValue(data?.lean_mass)}
              <span className="text-sm text-gray-500 ml-1">lbs</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Lean Mass</p>
          </div>
        </div>

        {/* Ratio Analysis */}
        <div className="text-center space-y-2">
          <div className={`text-xl font-bold ${ratioStatus.color}`}>
            {data?.bcm_ratio ? `${data.bcm_ratio.toFixed(1)}%` : '--'}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">BCM/Lean Mass Ratio</p>
          <p className={`text-sm font-medium ${ratioStatus.color}`}>
            {ratioStatus.message}
          </p>
        </div>

        {/* Visual Ratio Bar */}
        {data?.bcm_ratio && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Poor (50%)</span>
              <span>Excellent (70%+)</span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  data.bcm_ratio >= 70 ? 'bg-green-500' :
                  data.bcm_ratio >= 65 ? 'bg-blue-500' :
                  data.bcm_ratio >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min((data.bcm_ratio / 75) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Breakdown */}
        {data?.body_cell_mass && data?.lean_mass && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Composition Breakdown
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-purple-100 dark:bg-purple-900 rounded p-2 text-center">
                <div className="font-medium text-purple-800 dark:text-purple-200">
                  {formatValue(data.body_cell_mass)} lbs
                </div>
                <div className="text-purple-600 dark:text-purple-400">Active Cells</div>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-center">
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  {formatValue((data.lean_mass || 0) - (data.body_cell_mass || 0))} lbs
                </div>
                <div className="text-gray-600 dark:text-gray-400">Other Lean</div>
              </div>
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

export default BCMvsLeanMassWidget
