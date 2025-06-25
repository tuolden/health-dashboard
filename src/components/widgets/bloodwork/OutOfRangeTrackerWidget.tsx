/**
 * Out-of-Range Tracker Widget - Issue #13 Widget #21
 * 
 * Comprehensive tracker for all out-of-range lab values with trends
 */

import React, { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp, TrendingDown, Filter, Calendar } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue, getRiskLevelColor, getRiskLevelBackground } from './types'

interface OutOfRangeTrackerWidgetProps extends LabWidgetProps {
  collectedOn?: string
  maxResults?: number
  riskLevels?: ('elevated' | 'high' | 'critical')[]
  showTrends?: boolean
}

export const OutOfRangeTrackerWidget: React.FC<OutOfRangeTrackerWidgetProps> = ({
  collectedOn,
  maxResults = 20,
  riskLevels = ['elevated', 'high', 'critical'],
  showTrends = true,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [outOfRangeData, setOutOfRangeData] = useState<EnhancedLabResult[]>([])
  const [filteredData, setFilteredData] = useState<EnhancedLabResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'risk' | 'deviation' | 'name'>('risk')

  const fetchOutOfRangeData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        enhanced: 'true',
        onlyAbnormal: 'true',
        limit: maxResults.toString()
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
        throw new Error(result.error || 'Failed to fetch out-of-range data')
      }

      // Filter by risk levels
      const filtered = result.data.filter((lab: EnhancedLabResult) => 
        lab.risk_level && riskLevels.includes(lab.risk_level)
      )

      setOutOfRangeData(filtered)
      setFilteredData(filtered)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(filtered)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching out-of-range data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOutOfRangeData()
  }, [collectedOn, maxResults, riskLevels])

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...outOfRangeData]

    // Filter by risk level
    if (selectedRiskLevel !== 'all') {
      filtered = filtered.filter(item => item.risk_level === selectedRiskLevel)
    }

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'risk':
          const riskOrder = { critical: 3, high: 2, elevated: 1, normal: 0, low: 0 }
          return (riskOrder[b.risk_level as keyof typeof riskOrder] || 0) - 
                 (riskOrder[a.risk_level as keyof typeof riskOrder] || 0)
        case 'deviation':
          return (b.deviation_score || 0) - (a.deviation_score || 0)
        case 'name':
          return a.test_name.localeCompare(b.test_name)
        default:
          return 0
      }
    })

    setFilteredData(filtered)
  }, [outOfRangeData, selectedRiskLevel, sortBy])

  const renderOutOfRangeItem = (result: EnhancedLabResult) => {
    const riskColor = getRiskLevelColor(result.risk_level)
    const riskBg = getRiskLevelBackground(result.risk_level)

    return (
      <div 
        key={`${result.test_name}-${result.collected_on}`}
        className="p-3 rounded-lg border"
        style={{ borderColor: riskColor, backgroundColor: riskBg }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">{result.test_name}</h4>
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                style={{ color: riskColor, backgroundColor: 'white' }}
              >
                {result.risk_level}
              </span>
            </div>
            
            <div className="mt-1 flex items-center space-x-4">
              <div>
                <span className="font-semibold text-lg" style={{ color: riskColor }}>
                  {formatLabValue(result.value, result.metric?.units)}
                </span>
                {result.metric?.range_min && result.metric?.range_max && (
                  <div className="text-sm text-gray-500">
                    Normal: {formatLabValue(result.metric.range_min, result.metric.units)} - {formatLabValue(result.metric.range_max, result.metric.units)}
                  </div>
                )}
              </div>
              
              {showTrends && result.trend_direction && (
                <div className="flex items-center space-x-1">
                  {result.trend_direction === 'increasing' && (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  )}
                  {result.trend_direction === 'decreasing' && (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-xs text-gray-500 capitalize">
                    {result.trend_direction}
                  </span>
                </div>
              )}
            </div>

            {result.deviation_score && (
              <div className="mt-1 text-xs text-gray-600">
                {(result.deviation_score * 100).toFixed(0)}% outside normal range
              </div>
            )}

            {result.collected_on && (
              <div className="mt-1 text-xs text-gray-500">
                {new Date(result.collected_on).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const getRiskLevelCounts = () => {
    const counts = {
      critical: outOfRangeData.filter(r => r.risk_level === 'critical').length,
      high: outOfRangeData.filter(r => r.risk_level === 'high').length,
      elevated: outOfRangeData.filter(r => r.risk_level === 'elevated').length
    }
    return counts
  }

  const counts = getRiskLevelCounts()

  return (
    <LabBaseWidget
      title="Out-of-Range Tracker"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchOutOfRangeData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={
        outOfRangeData.length > 0 ? (
          <AlertCircle className="h-5 w-5 text-red-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-green-600" />
        )
      }
      headerActions={
        <div className="flex items-center space-x-2">
          {/* Risk Level Filter */}
          <select
            value={selectedRiskLevel}
            onChange={(e) => setSelectedRiskLevel(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="elevated">Elevated</option>
          </select>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'risk' | 'deviation' | 'name')}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="risk">By Risk</option>
            <option value="deviation">By Deviation</option>
            <option value="name">By Name</option>
          </select>

          {/* Count Badge */}
          <div className="text-sm text-gray-500">
            {filteredData.length} of {outOfRangeData.length}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 font-medium">Critical</div>
            <div className="text-xl font-bold text-red-700">{counts.critical}</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 font-medium">High</div>
            <div className="text-xl font-bold text-red-700">{counts.high}</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-600 font-medium">Elevated</div>
            <div className="text-xl font-bold text-yellow-700">{counts.elevated}</div>
          </div>
        </div>

        {/* Out-of-Range Items */}
        {filteredData.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                Out-of-Range Results ({filteredData.length})
              </h4>
              {collectedOn && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(collectedOn).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredData.map(renderOutOfRangeItem)}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">All Values in Range!</h3>
            <p className="text-gray-500">
              {selectedRiskLevel === 'all' 
                ? 'No out-of-range lab values found'
                : `No ${selectedRiskLevel} risk values found`
              }
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            <strong>Risk Levels:</strong> Critical (immediate attention), High (follow up soon), Elevated (monitor closely)
          </div>
        </div>
      </div>
    </LabBaseWidget>
  )
}

export default OutOfRangeTrackerWidget
