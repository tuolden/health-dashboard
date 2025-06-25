/**
 * Lab Number Widget Component - Issue #13
 * 
 * Displays individual lab values with trends and reference ranges
 */

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { 
  LabNumberWidgetProps, 
  EnhancedLabResult, 
  getRiskLevelColor, 
  getRiskLevelBackground,
  formatLabValue 
} from './types'

export const LabNumberWidget: React.FC<LabNumberWidgetProps> = ({
  testName,
  title,
  showTrend = true,
  showReferenceRange = true,
  precision = 2,
  className,
  refreshInterval = 300000, // 5 minutes
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [labData, setLabData] = useState<EnhancedLabResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchLabData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch latest lab results
      const response = await fetch('/api/labs/latest')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lab data')
      }

      // Find the specific test
      const testResult = result.data.find((lab: EnhancedLabResult) => 
        lab.test_name === testName
      )

      if (!testResult) {
        throw new Error(`No data found for test: ${testName}`)
      }

      setLabData(testResult)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(testResult)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching lab data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLabData()
  }, [testName])

  const renderTrendIcon = () => {
    if (!showTrend || !labData?.trend_direction) return null

    const iconClass = "h-4 w-4"
    
    switch (labData.trend_direction) {
      case 'increasing':
        return <TrendingUp className={`${iconClass} text-red-500`} />
      case 'decreasing':
        return <TrendingDown className={`${iconClass} text-green-500`} />
      case 'stable':
        return <Minus className={`${iconClass} text-gray-500`} />
      default:
        return null
    }
  }

  const renderRiskIndicator = () => {
    if (!labData?.risk_level) return null

    const color = getRiskLevelColor(labData.risk_level)
    const bgColor = getRiskLevelBackground(labData.risk_level)

    const icon = labData.is_in_range ? (
      <CheckCircle className="h-4 w-4" />
    ) : (
      <AlertCircle className="h-4 w-4" />
    )

    return (
      <div 
        className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium"
        style={{ color, backgroundColor: bgColor }}
      >
        {icon}
        <span className="capitalize">{labData.risk_level}</span>
      </div>
    )
  }

  const renderReferenceRange = () => {
    if (!showReferenceRange || !labData?.metric?.range_min || !labData?.metric?.range_max) {
      return null
    }

    const { range_min, range_max, units } = labData.metric

    return (
      <div className="text-sm text-gray-500 mt-1">
        Reference: {formatLabValue(range_min, units, precision)} - {formatLabValue(range_max, units, precision)}
      </div>
    )
  }

  const renderChangeIndicator = () => {
    if (!showTrend || !labData?.change_percentage) return null

    const isPositive = labData.change_percentage > 0
    const colorClass = isPositive ? 'text-red-600' : 'text-green-600'
    const sign = isPositive ? '+' : ''

    return (
      <div className={`text-sm ${colorClass} mt-1`}>
        {sign}{labData.change_percentage.toFixed(1)}% from previous
      </div>
    )
  }

  return (
    <LabBaseWidget
      title={title || testName}
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchLabData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<AlertCircle className="h-5 w-5 text-blue-600" />}
      headerActions={renderRiskIndicator()}
    >
      {labData && (
        <div className="space-y-3">
          {/* Main Value */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                {formatLabValue(labData.value, labData.metric?.units, precision)}
              </span>
              {renderTrendIcon()}
            </div>
          </div>

          {/* Reference Range */}
          {renderReferenceRange()}

          {/* Change Indicator */}
          {renderChangeIndicator()}

          {/* Additional Info */}
          {labData.collected_on && (
            <div className="text-sm text-gray-500">
              Collected: {new Date(labData.collected_on).toLocaleDateString()}
            </div>
          )}

          {/* Deviation Score (for debugging/advanced users) */}
          {labData.deviation_score && labData.deviation_score > 0 && (
            <div className="text-xs text-gray-400">
              Deviation: {(labData.deviation_score * 100).toFixed(1)}% outside normal range
            </div>
          )}
        </div>
      )}
    </LabBaseWidget>
  )
}

export default LabNumberWidget
