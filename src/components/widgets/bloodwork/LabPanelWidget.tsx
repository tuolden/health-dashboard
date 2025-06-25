/**
 * Lab Panel Widget Component - Issue #13
 * 
 * Displays grouped lab panels (CBC, Lipid, etc.) with status indicators
 */

import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, XCircle, Filter } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { 
  LabPanelWidgetProps, 
  LabSummary, 
  EnhancedLabResult,
  getRiskLevelColor, 
  getRiskLevelBackground,
  formatLabValue 
} from './types'

export const LabPanelWidget: React.FC<LabPanelWidgetProps> = ({
  panelType,
  title,
  showOnlyAbnormal = false,
  collectedOn,
  className,
  refreshInterval = 300000, // 5 minutes
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [labSummary, setLabSummary] = useState<LabSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [filterAbnormal, setFilterAbnormal] = useState(showOnlyAbnormal)

  const fetchLabSummary = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Use provided date or get latest
      let targetDate = collectedOn
      if (!targetDate) {
        // Get latest available date
        const datesResponse = await fetch('/api/labs/dates')
        if (!datesResponse.ok) {
          throw new Error('Failed to fetch available dates')
        }
        const datesResult = await datesResponse.json()
        if (!datesResult.success || datesResult.data.length === 0) {
          throw new Error('No lab data available')
        }
        targetDate = datesResult.data[0] // Most recent date
      }

      const response = await fetch(`/api/labs/summary/${targetDate}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lab summary')
      }

      setLabSummary(result.data)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching lab summary:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLabSummary()
  }, [panelType, collectedOn])

  const getTargetPanel = () => {
    if (!labSummary?.panels) return null
    return labSummary.panels.find(panel => 
      panel.panel_name.toLowerCase().includes(panelType.toLowerCase())
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'abnormal':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const renderLabResult = (result: EnhancedLabResult) => {
    const riskColor = getRiskLevelColor(result.risk_level)
    const riskBg = getRiskLevelBackground(result.risk_level)

    return (
      <div key={result.test_name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
        <div className="flex-1">
          <div className="font-medium text-gray-900">{result.test_name}</div>
          {result.metric?.description && (
            <div className="text-xs text-gray-500">{result.metric.description}</div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="font-semibold">
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

  const panel = getTargetPanel()
  const filteredTests = panel?.tests.filter(test => 
    !filterAbnormal || !test.is_in_range
  ) || []

  return (
    <LabBaseWidget
      title={title || `${panelType} Panel`}
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchLabSummary}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={panel ? getStatusIcon(panel.overall_status) : undefined}
      headerActions={
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterAbnormal(!filterAbnormal)}
            className={`p-1 rounded-md transition-colors ${
              filterAbnormal
                ? 'text-red-600 bg-red-50'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={`${filterAbnormal ? 'Show all' : 'Show abnormal only'}`}
          >
            <Filter className="h-4 w-4" />
          </button>
          
          {panel && (
            <div className="text-sm text-gray-500">
              {panel.abnormal_count > 0 ? (
                <span className="text-red-600">{panel.abnormal_count} abnormal</span>
              ) : (
                <span className="text-green-600">All normal</span>
              )}
            </div>
          )}
        </div>
      }
    >
      {panel ? (
        <div className="space-y-4">
          {/* Panel Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {getStatusIcon(panel.overall_status)}
              <span className="font-medium capitalize">{panel.overall_status}</span>
            </div>
            <div className="text-sm text-gray-600">
              {panel.total_count - panel.abnormal_count}/{panel.total_count} in range
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-1">
            {filteredTests.length > 0 ? (
              filteredTests.map(renderLabResult)
            ) : (
              <div className="text-center py-4 text-gray-500">
                {filterAbnormal ? 'No abnormal results' : 'No test results available'}
              </div>
            )}
          </div>

          {/* Collection Date */}
          {labSummary?.collected_on && (
            <div className="text-sm text-gray-500 pt-2 border-t border-gray-100">
              Collected: {new Date(labSummary.collected_on).toLocaleDateString()}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No {panelType} panel data available
        </div>
      )}
    </LabBaseWidget>
  )
}

export default LabPanelWidget
