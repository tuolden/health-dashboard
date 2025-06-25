/**
 * Electrolytes Widget - Issue #13 Widget #6
 * 
 * Electrolyte balance (Sodium, Potassium, Chloride, CO2)
 */

import React, { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue, getRiskLevelColor, getRiskLevelBackground } from './types'

interface ElectrolytesWidgetProps extends LabWidgetProps {
  collectedOn?: string
}

const ELECTROLYTE_TESTS = [
  'Sodium',
  'Potassium', 
  'Chloride',
  'CO2'
]

export const ElectrolytesWidget: React.FC<ElectrolytesWidgetProps> = ({
  collectedOn,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [electrolyteData, setElectrolyteData] = useState<EnhancedLabResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchElectrolyteData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        enhanced: 'true',
        testNames: ELECTROLYTE_TESTS.join(',')
      })

      if (collectedOn) {
        params.append('startDate', collectedOn)
        params.append('endDate', collectedOn)
      }

      const response = await fetch(`/api/labs/results?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch electrolyte data')
      }

      setElectrolyteData(result.data)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching electrolyte data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchElectrolyteData()
  }, [collectedOn])

  const renderElectrolyte = (result: EnhancedLabResult) => {
    const riskColor = getRiskLevelColor(result.risk_level)
    const riskBg = getRiskLevelBackground(result.risk_level)

    return (
      <div key={result.test_name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
        <div className="flex-1">
          <div className="font-medium text-gray-900">{result.test_name}</div>
          {result.metric?.description && (
            <div className="text-xs text-gray-500">{result.metric.description}</div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="font-semibold text-lg">
              {formatLabValue(result.value, result.metric?.units)}
            </div>
            {result.metric?.range_min && result.metric?.range_max && (
              <div className="text-xs text-gray-500">
                {formatLabValue(result.metric.range_min, result.metric.units)} - {formatLabValue(result.metric.range_max, result.metric.units)}
              </div>
            )}
          </div>
          
          {result.risk_level && (
            <div 
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ color: riskColor, backgroundColor: riskBg }}
            >
              {result.is_in_range ? '✓' : '!'}
            </div>
          )}
        </div>
      </div>
    )
  }

  const abnormalCount = electrolyteData.filter(e => !e.is_in_range).length

  return (
    <LabBaseWidget
      title="Electrolytes"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchElectrolyteData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Zap className="h-5 w-5 text-blue-600" />}
      headerActions={
        electrolyteData.length > 0 && (
          <div className="text-sm text-gray-500">
            {abnormalCount > 0 ? (
              <span className="text-red-600">{abnormalCount} abnormal</span>
            ) : (
              <span className="text-green-600">All normal</span>
            )}
          </div>
        )
      }
    >
      <div className="space-y-1">
        {electrolyteData.length > 0 ? (
          electrolyteData.map(renderElectrolyte)
        ) : (
          <div className="text-center py-8 text-gray-500">
            No electrolyte data available
          </div>
        )}

        {/* Collection Date */}
        {electrolyteData.length > 0 && electrolyteData[0].collected_on && (
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-100">
            Collected: {new Date(electrolyteData[0].collected_on).toLocaleDateString()}
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default ElectrolytesWidget
