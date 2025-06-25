/**
 * Lab Alert Widget Component - Issue #13
 * 
 * Displays critical lab alerts and out-of-range values
 */

import React, { useState, useEffect } from 'react'
import { AlertTriangle, AlertCircle, Bell, BellOff } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { 
  LabAlertWidgetProps, 
  EnhancedLabResult,
  getRiskLevelColor, 
  getRiskLevelBackground,
  formatLabValue 
} from './types'

export const LabAlertWidget: React.FC<LabAlertWidgetProps> = ({
  title = 'Lab Alerts',
  maxAlerts = 10,
  riskLevels = ['elevated', 'high', 'critical'],
  collectedOn,
  className,
  refreshInterval = 300000, // 5 minutes
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [alerts, setAlerts] = useState<EnhancedLabResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [alertsEnabled, setAlertsEnabled] = useState(true)

  const fetchAlerts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch enhanced lab results with only abnormal values
      const params = new URLSearchParams({
        enhanced: 'true',
        onlyAbnormal: 'true',
        limit: maxAlerts.toString()
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
        throw new Error(result.error || 'Failed to fetch lab alerts')
      }

      // Filter by risk levels and sort by severity
      const filteredAlerts = result.data
        .filter((lab: EnhancedLabResult) => 
          lab.risk_level && riskLevels.includes(lab.risk_level)
        )
        .sort((a: EnhancedLabResult, b: EnhancedLabResult) => {
          const riskOrder = { critical: 3, high: 2, elevated: 1, normal: 0, low: 0 }
          return (riskOrder[b.risk_level as keyof typeof riskOrder] || 0) - 
                 (riskOrder[a.risk_level as keyof typeof riskOrder] || 0)
        })
        .slice(0, maxAlerts)

      setAlerts(filteredAlerts)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(filteredAlerts)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching lab alerts:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [maxAlerts, riskLevels, collectedOn])

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'high':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'elevated':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const renderAlert = (alert: EnhancedLabResult) => {
    const riskColor = getRiskLevelColor(alert.risk_level)
    const riskBg = getRiskLevelBackground(alert.risk_level)

    return (
      <div 
        key={`${alert.test_name}-${alert.collected_on}`}
        className="flex items-start space-x-3 p-3 rounded-lg border"
        style={{ borderColor: riskColor, backgroundColor: riskBg }}
      >
        <div className="flex-shrink-0 mt-0.5">
          {getRiskIcon(alert.risk_level)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{alert.test_name}</h4>
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ color: riskColor, backgroundColor: 'white' }}
            >
              {alert.risk_level}
            </span>
          </div>
          
          <div className="mt-1 flex items-center justify-between">
            <div>
              <span className="font-semibold" style={{ color: riskColor }}>
                {formatLabValue(alert.value, alert.metric?.units)}
              </span>
              {alert.metric?.range_min && alert.metric?.range_max && (
                <span className="text-sm text-gray-500 ml-2">
                  (Normal: {formatLabValue(alert.metric.range_min, alert.metric.units)} - {formatLabValue(alert.metric.range_max, alert.metric.units)})
                </span>
              )}
            </div>
          </div>

          {alert.deviation_score && (
            <div className="mt-1 text-xs text-gray-600">
              {(alert.deviation_score * 100).toFixed(0)}% outside normal range
            </div>
          )}

          {alert.collected_on && (
            <div className="mt-1 text-xs text-gray-500">
              {new Date(alert.collected_on).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    )
  }

  const criticalCount = alerts.filter(a => a.risk_level === 'critical').length
  const highCount = alerts.filter(a => a.risk_level === 'high').length
  const elevatedCount = alerts.filter(a => a.risk_level === 'elevated').length

  return (
    <LabBaseWidget
      title={title}
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchAlerts}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={
        alerts.length > 0 ? (
          <AlertTriangle className="h-5 w-5 text-red-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-green-600" />
        )
      }
      headerActions={
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`p-1 rounded-md transition-colors ${
              alertsEnabled
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={`Alerts ${alertsEnabled ? 'enabled' : 'disabled'}`}
          >
            {alertsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
          
          {alerts.length > 0 && (
            <div className="flex items-center space-x-1 text-sm">
              {criticalCount > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {criticalCount} critical
                </span>
              )}
              {highCount > 0 && (
                <span className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                  {highCount} high
                </span>
              )}
              {elevatedCount > 0 && (
                <span className="px-2 py-1 bg-yellow-50 text-yellow-600 rounded-full text-xs font-medium">
                  {elevatedCount} elevated
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {alerts.length > 0 ? (
          <>
            {/* Summary */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                {alerts.length} alert{alerts.length !== 1 ? 's' : ''} found
              </div>
              <div className="text-xs text-gray-500">
                Showing {riskLevels.join(', ')} risk levels
              </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-2">
              {alerts.map(renderAlert)}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">All Clear!</h3>
            <p className="text-gray-500">No lab alerts at this time</p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabAlertWidget
