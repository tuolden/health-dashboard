/**
 * What's Changed Widget - Issue #13 Widget #23
 * 
 * Shows what lab values have changed since the last test with easy-to-understand explanations
 */

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, ArrowRight, Calendar, AlertCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue, getRiskLevelColor } from './types'

interface WhatsChangedWidgetProps extends LabWidgetProps {
  significantChangeThreshold?: number // Percentage change to be considered significant
  maxChanges?: number
}

interface LabChange {
  testName: string
  currentValue: number
  previousValue: number
  change: number
  changePercentage: number
  direction: 'increased' | 'decreased' | 'stable'
  significance: 'major' | 'moderate' | 'minor'
  interpretation: string
  riskLevel?: string
  units?: string
  currentDate: string
  previousDate: string
}

export const WhatsChangedWidget: React.FC<WhatsChangedWidgetProps> = ({
  significantChangeThreshold = 10, // 10% change threshold
  maxChanges = 10,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [changes, setChanges] = useState<LabChange[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchChanges = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get available dates first
      const datesResponse = await fetch('/api/labs/dates')
      if (!datesResponse.ok) {
        throw new Error('Failed to fetch available dates')
      }
      const datesResult = await datesResponse.json()
      if (!datesResult.success || datesResult.data.length < 2) {
        throw new Error('Need at least 2 lab dates to compare changes')
      }

      const dates = datesResult.data
      const latestDate = dates[0]
      const previousDate = dates[1]

      // Get lab results for both dates
      const [latestResponse, previousResponse] = await Promise.all([
        fetch(`/api/labs/results?enhanced=true&startDate=${latestDate}&endDate=${latestDate}`),
        fetch(`/api/labs/results?enhanced=true&startDate=${previousDate}&endDate=${previousDate}`)
      ])

      if (!latestResponse.ok || !previousResponse.ok) {
        throw new Error('Failed to fetch lab results for comparison')
      }

      const [latestResult, previousResult] = await Promise.all([
        latestResponse.json(),
        previousResponse.json()
      ])

      if (!latestResult.success || !previousResult.success) {
        throw new Error('Failed to parse lab results')
      }

      // Calculate changes
      const calculatedChanges = calculateChanges(
        latestResult.data,
        previousResult.data,
        latestDate,
        previousDate
      )

      setChanges(calculatedChanges)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(calculatedChanges)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching lab changes:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateChanges = (
    latestData: EnhancedLabResult[],
    previousData: EnhancedLabResult[],
    latestDate: string,
    previousDate: string
  ): LabChange[] => {
    const changes: LabChange[] = []

    latestData.forEach(latest => {
      const previous = previousData.find(p => p.test_name === latest.test_name)
      
      if (previous && latest.numeric_value && previous.numeric_value) {
        const currentValue = latest.numeric_value
        const previousValue = previous.numeric_value
        const change = currentValue - previousValue
        const changePercentage = Math.abs((change / previousValue) * 100)

        // Only include if change is above threshold
        if (changePercentage >= significantChangeThreshold) {
          const direction = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'stable'
          
          let significance: 'major' | 'moderate' | 'minor'
          if (changePercentage >= 50) significance = 'major'
          else if (changePercentage >= 25) significance = 'moderate'
          else significance = 'minor'

          const interpretation = generateInterpretation(latest.test_name, direction, changePercentage, latest.is_in_range)

          changes.push({
            testName: latest.test_name,
            currentValue,
            previousValue,
            change,
            changePercentage,
            direction,
            significance,
            interpretation,
            riskLevel: latest.risk_level,
            units: latest.metric?.units,
            currentDate: latestDate,
            previousDate: previousDate
          })
        }
      }
    })

    // Sort by significance and change percentage
    return changes
      .sort((a, b) => {
        const significanceOrder = { major: 3, moderate: 2, minor: 1 }
        const aSig = significanceOrder[a.significance]
        const bSig = significanceOrder[b.significance]
        
        if (aSig !== bSig) return bSig - aSig
        return b.changePercentage - a.changePercentage
      })
      .slice(0, maxChanges)
  }

  const generateInterpretation = (
    testName: string,
    direction: string,
    changePercentage: number,
    isInRange?: boolean
  ): string => {
    const changeDesc = changePercentage >= 50 ? 'significantly' : 
                     changePercentage >= 25 ? 'moderately' : 'mildly'
    
    const baseInterpretation = `${testName} has ${changeDesc} ${direction} by ${changePercentage.toFixed(1)}%`
    
    // Add context based on test type
    const contextualAdvice: { [key: string]: { increased: string, decreased: string } } = {
      'Glucose': {
        increased: 'Monitor for diabetes risk and dietary factors',
        decreased: 'Good trend if previously elevated, monitor for hypoglycemia if very low'
      },
      'Total Cholesterol': {
        increased: 'Consider dietary changes and cardiovascular risk assessment',
        decreased: 'Positive trend for heart health'
      },
      'LDL Cholesterol': {
        increased: 'May increase cardiovascular risk, consider lifestyle changes',
        decreased: 'Excellent improvement for heart health'
      },
      'HDL Cholesterol': {
        increased: 'Great improvement for cardiovascular protection',
        decreased: 'May reduce cardiovascular protection'
      },
      'Hemoglobin': {
        increased: 'Good if previously low, monitor if very high',
        decreased: 'Monitor for anemia risk'
      },
      'Creatinine': {
        increased: 'May indicate kidney function decline, follow up needed',
        decreased: 'Positive trend for kidney function'
      }
    }

    const advice = contextualAdvice[testName]?.[direction as 'increased' | 'decreased']
    const rangeStatus = isInRange ? ' (still in normal range)' : ' (now outside normal range)'
    
    return `${baseInterpretation}${rangeStatus}. ${advice || 'Discuss with healthcare provider.'}`
  }

  useEffect(() => {
    fetchChanges()
  }, [significantChangeThreshold, maxChanges])

  const renderChange = (change: LabChange) => {
    const isPositive = change.direction === 'increased'
    const icon = isPositive ? 
      <TrendingUp className="h-5 w-5 text-red-500" /> : 
      <TrendingDown className="h-5 w-5 text-green-500" />

    const significanceColor = {
      major: '#DC2626',
      moderate: '#F59E0B', 
      minor: '#6B7280'
    }[change.significance]

    const significanceBg = {
      major: '#FEF2F2',
      moderate: '#FFFBEB',
      minor: '#F9FAFB'
    }[change.significance]

    return (
      <div 
        key={change.testName}
        className="p-4 rounded-lg border"
        style={{ borderColor: significanceColor, backgroundColor: significanceBg }}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{change.testName}</h4>
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                style={{ color: significanceColor, backgroundColor: 'white' }}
              >
                {change.significance} change
              </span>
            </div>

            {/* Value Comparison */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold">
                {formatLabValue(change.previousValue, change.units, 1)}
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="font-semibold" style={{ color: significanceColor }}>
                {formatLabValue(change.currentValue, change.units, 1)}
              </span>
              <span className="text-sm text-gray-500">
                ({isPositive ? '+' : ''}{change.changePercentage.toFixed(1)}%)
              </span>
            </div>

            {/* Interpretation */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {change.interpretation}
            </p>

            {/* Date Range */}
            <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(change.previousDate).toLocaleDateString()} → {new Date(change.currentDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const majorChanges = changes.filter(c => c.significance === 'major').length
  const moderateChanges = changes.filter(c => c.significance === 'moderate').length

  return (
    <LabBaseWidget
      title="What's Changed?"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchChanges}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
      headerActions={
        changes.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            {majorChanges > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                {majorChanges} major
              </span>
            )}
            {moderateChanges > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                {moderateChanges} moderate
              </span>
            )}
          </div>
        )
      }
    >
      <div className="space-y-4">
        {changes.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700">
                <strong>{changes.length} significant changes</strong> detected since your last lab work
                {changes.length > 0 && (
                  <span className="block text-xs mt-1">
                    Showing changes ≥{significantChangeThreshold}% from previous results
                  </span>
                )}
              </div>
            </div>

            {/* Changes List */}
            <div className="space-y-3">
              {changes.map(renderChange)}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Stable Results</h3>
            <p className="text-gray-500">
              No significant changes (≥{significantChangeThreshold}%) detected since your last lab work
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default WhatsChangedWidget
