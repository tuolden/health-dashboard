/**
 * Lab Timeline Widget - Issue #13 Widget #27
 * 
 * Comprehensive timeline view of all lab results with interactive filtering
 */

import React, { useState, useEffect } from 'react'
import { Calendar, Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue, getRiskLevelColor } from './types'

interface LabTimelineWidgetProps extends LabWidgetProps {
  timeframe?: number // Days to look back
  maxResults?: number
  selectedTests?: string[]
}

interface TimelineEntry {
  date: string
  results: EnhancedLabResult[]
  summary: {
    total: number
    inRange: number
    outOfRange: number
    critical: number
  }
}

export const LabTimelineWidget: React.FC<LabTimelineWidgetProps> = ({
  timeframe = 365,
  maxResults = 10,
  selectedTests = [],
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [filteredTests, setFilteredTests] = useState<string[]>(selectedTests)
  const [showOnlyAbnormal, setShowOnlyAbnormal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchTimeline = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get available dates first
      const datesResponse = await fetch('/api/labs/dates')
      if (!datesResponse.ok) {
        throw new Error('Failed to fetch available dates')
      }
      const datesResult = await datesResponse.json()
      if (!datesResult.success) {
        throw new Error('Failed to parse dates')
      }

      const dates = datesResult.data.slice(0, maxResults)
      setAvailableDates(datesResult.data)

      // Fetch lab results for each date
      const timelinePromises = dates.map(async (date: string) => {
        try {
          const params = new URLSearchParams({
            enhanced: 'true',
            startDate: date,
            endDate: date
          })

          if (filteredTests.length > 0) {
            params.append('testNames', filteredTests.join(','))
          }

          if (showOnlyAbnormal) {
            params.append('onlyAbnormal', 'true')
          }

          const response = await fetch(`/api/labs/results?${params}`)
          if (!response.ok) return null

          const result = await response.json()
          if (!result.success) return null

          const results = result.data
          const summary = {
            total: results.length,
            inRange: results.filter((r: EnhancedLabResult) => r.is_in_range === true).length,
            outOfRange: results.filter((r: EnhancedLabResult) => r.is_in_range === false).length,
            critical: results.filter((r: EnhancedLabResult) => r.risk_level === 'critical').length
          }

          return { date, results, summary }
        } catch {
          return null
        }
      })

      const timelineResults = await Promise.all(timelinePromises)
      const validTimeline = timelineResults.filter(t => t !== null) as TimelineEntry[]

      setTimeline(validTimeline)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(validTimeline)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching timeline:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTimeline()
  }, [timeframe, maxResults, filteredTests, showOnlyAbnormal])

  const renderTimelineEntry = (entry: TimelineEntry) => {
    const hasAbnormal = entry.summary.outOfRange > 0
    const hasCritical = entry.summary.critical > 0

    return (
      <div key={entry.date} className="relative">
        {/* Timeline connector */}
        <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-200" />
        
        <div className="flex items-start space-x-4">
          {/* Date indicator */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            hasCritical ? 'bg-red-500' : hasAbnormal ? 'bg-yellow-500' : 'bg-green-500'
          }`}>
            <Calendar className="h-4 w-4 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {new Date(entry.date).toLocaleDateString('en-US', { 
                    weekday: 'short',
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </h4>
                <div className="flex items-center space-x-2">
                  {hasCritical && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      {entry.summary.critical} critical
                    </span>
                  )}
                  {hasAbnormal && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      {entry.summary.outOfRange} abnormal
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {entry.summary.total} tests
                  </span>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {entry.summary.inRange}
                  </div>
                  <div className="text-xs text-gray-500">In Range</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {entry.summary.outOfRange}
                  </div>
                  <div className="text-xs text-gray-500">Out of Range</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {entry.summary.critical}
                  </div>
                  <div className="text-xs text-gray-500">Critical</div>
                </div>
              </div>

              {/* Key results */}
              {entry.results.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">
                    {showOnlyAbnormal ? 'Abnormal Results' : 'Key Results'}
                  </h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {entry.results.slice(0, 8).map(result => (
                      <div key={result.test_name} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{result.test_name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {formatLabValue(result.value, result.metric?.units)}
                          </span>
                          {result.trend_direction && (
                            <div className="flex items-center">
                              {result.trend_direction === 'increasing' && (
                                <TrendingUp className="h-3 w-3 text-red-500" />
                              )}
                              {result.trend_direction === 'decreasing' && (
                                <TrendingDown className="h-3 w-3 text-green-500" />
                              )}
                              {result.trend_direction === 'stable' && (
                                <Minus className="h-3 w-3 text-gray-500" />
                              )}
                            </div>
                          )}
                          {result.risk_level && result.risk_level !== 'normal' && (
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getRiskLevelColor(result.risk_level) }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    {entry.results.length > 8 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{entry.results.length - 8} more results
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getUniqueTests = () => {
    const tests = new Set<string>()
    timeline.forEach(entry => {
      entry.results.forEach(result => {
        tests.add(result.test_name)
      })
    })
    return Array.from(tests).sort()
  }

  const uniqueTests = getUniqueTests()

  return (
    <LabBaseWidget
      title="Lab Timeline"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchTimeline}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Calendar className="h-5 w-5 text-blue-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowOnlyAbnormal(!showOnlyAbnormal)}
            className={`p-1 rounded-md transition-colors ${
              showOnlyAbnormal
                ? 'text-red-600 bg-red-50'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={`${showOnlyAbnormal ? 'Show all' : 'Show abnormal only'}`}
          >
            <Filter className="h-4 w-4" />
          </button>
          
          <div className="text-sm text-gray-500">
            {timeline.length} dates
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Test filter */}
        {uniqueTests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Filter by Tests</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilteredTests([])}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  filteredTests.length === 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Tests
              </button>
              {uniqueTests.slice(0, 8).map(test => (
                <button
                  key={test}
                  onClick={() => {
                    if (filteredTests.includes(test)) {
                      setFilteredTests(filteredTests.filter(t => t !== test))
                    } else {
                      setFilteredTests([...filteredTests, test])
                    }
                  }}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    filteredTests.includes(test)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {test}
                </button>
              ))}
              {uniqueTests.length > 8 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{uniqueTests.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 ? (
          <div className="relative">
            {timeline.map(renderTimelineEntry)}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Timeline Data</h3>
            <p className="text-gray-500">
              {filteredTests.length > 0 
                ? 'No results found for selected tests'
                : 'No lab results available for timeline'
              }
            </p>
          </div>
        )}

        {/* Summary */}
        {timeline.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              <strong>Timeline Summary:</strong> {timeline.length} lab dates over {Math.round(timeframe / 30)} months
              {filteredTests.length > 0 && (
                <span> • Filtered to {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabTimelineWidget
