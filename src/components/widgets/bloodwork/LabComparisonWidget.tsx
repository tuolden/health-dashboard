/**
 * Lab Comparison Widget - Issue #13 Widget #33
 * 
 * Side-by-side comparison of lab results between different dates
 */

import React, { useState, useEffect } from 'react'
import { ArrowRight, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue, getRiskLevelColor } from './types'

interface LabComparisonWidgetProps extends LabWidgetProps {
  date1?: string
  date2?: string
  selectedTests?: string[]
}

interface ComparisonResult {
  testName: string
  date1Value: number
  date2Value: number
  change: number
  changePercentage: number
  direction: 'improved' | 'worsened' | 'stable'
  significance: 'major' | 'moderate' | 'minor'
  units?: string
  date1Risk?: string
  date2Risk?: string
}

export const LabComparisonWidget: React.FC<LabComparisonWidgetProps> = ({
  date1,
  date2,
  selectedTests = [],
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate1, setSelectedDate1] = useState<string>(date1 || '')
  const [selectedDate2, setSelectedDate2] = useState<string>(date2 || '')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchComparisons = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get available dates if not provided
      if (!selectedDate1 || !selectedDate2) {
        const datesResponse = await fetch('/api/labs/dates')
        if (!datesResponse.ok) throw new Error('Failed to fetch dates')
        const datesResult = await datesResponse.json()
        if (!datesResult.success || datesResult.data.length < 2) {
          throw new Error('Need at least 2 lab dates for comparison')
        }
        
        setAvailableDates(datesResult.data)
        
        if (!selectedDate1) setSelectedDate1(datesResult.data[1]) // Second most recent
        if (!selectedDate2) setSelectedDate2(datesResult.data[0]) // Most recent
        
        return // Will trigger useEffect again with dates set
      }

      // Fetch lab results for both dates
      const [results1Response, results2Response] = await Promise.all([
        fetch(`/api/labs/results?enhanced=true&startDate=${selectedDate1}&endDate=${selectedDate1}`),
        fetch(`/api/labs/results?enhanced=true&startDate=${selectedDate2}&endDate=${selectedDate2}`)
      ])

      if (!results1Response.ok || !results2Response.ok) {
        throw new Error('Failed to fetch lab results')
      }

      const [results1, results2] = await Promise.all([
        results1Response.json(),
        results2Response.json()
      ])

      if (!results1.success || !results2.success) {
        throw new Error('Failed to parse lab results')
      }

      // Calculate comparisons
      const calculatedComparisons = calculateComparisons(results1.data, results2.data)
      setComparisons(calculatedComparisons)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(calculatedComparisons)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching comparisons:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateComparisons = (results1: EnhancedLabResult[], results2: EnhancedLabResult[]): ComparisonResult[] => {
    const comparisons: ComparisonResult[] = []

    results1.forEach(result1 => {
      const result2 = results2.find(r => r.test_name === result1.test_name)
      
      if (result2 && result1.numeric_value && result2.numeric_value) {
        // Filter by selected tests if specified
        if (selectedTests.length > 0 && !selectedTests.includes(result1.test_name)) {
          return
        }

        const date1Value = result1.numeric_value
        const date2Value = result2.numeric_value
        const change = date2Value - date1Value
        const changePercentage = Math.abs((change / date1Value) * 100)

        // Determine direction based on test type and change
        let direction: 'improved' | 'worsened' | 'stable'
        if (changePercentage < 5) {
          direction = 'stable'
        } else {
          direction = determineDirection(result1.test_name, change)
        }

        // Determine significance
        let significance: 'major' | 'moderate' | 'minor'
        if (changePercentage >= 25) significance = 'major'
        else if (changePercentage >= 10) significance = 'moderate'
        else significance = 'minor'

        comparisons.push({
          testName: result1.test_name,
          date1Value,
          date2Value,
          change,
          changePercentage,
          direction,
          significance,
          units: result1.metric?.units,
          date1Risk: result1.risk_level,
          date2Risk: result2.risk_level
        })
      }
    })

    // Sort by significance and change percentage
    return comparisons.sort((a, b) => {
      const significanceOrder = { major: 3, moderate: 2, minor: 1 }
      const aSig = significanceOrder[a.significance]
      const bSig = significanceOrder[b.significance]
      
      if (aSig !== bSig) return bSig - aSig
      return b.changePercentage - a.changePercentage
    })
  }

  const determineDirection = (testName: string, change: number): 'improved' | 'worsened' | 'stable' => {
    // Tests where lower values are better
    const lowerIsBetter = [
      'LDL Cholesterol', 'Total Cholesterol', 'Triglycerides', 
      'Glucose', 'Creatinine', 'AST', 'ALT', 'Bilirubin'
    ]
    
    // Tests where higher values are better
    const higherIsBetter = [
      'HDL Cholesterol', 'Hemoglobin', 'Hematocrit', 'RBC'
    ]

    if (lowerIsBetter.some(test => testName.includes(test))) {
      return change < 0 ? 'improved' : 'worsened'
    } else if (higherIsBetter.some(test => testName.includes(test))) {
      return change > 0 ? 'improved' : 'worsened'
    } else {
      // For tests where target range matters more than direction
      return Math.abs(change) < 0.1 ? 'stable' : 'worsened'
    }
  }

  useEffect(() => {
    fetchComparisons()
  }, [selectedDate1, selectedDate2, selectedTests])

  const renderComparison = (comp: ComparisonResult) => {
    const directionColors = {
      improved: '#10B981',
      worsened: '#EF4444',
      stable: '#6B7280'
    }

    const color = directionColors[comp.direction]
    const isImproved = comp.direction === 'improved'
    const isStable = comp.direction === 'stable'

    const DirectionIcon = isStable ? Minus : isImproved ? TrendingUp : TrendingDown

    return (
      <div key={comp.testName} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-gray-900">{comp.testName}</h4>
          <div className="flex items-center space-x-2">
            <DirectionIcon className="h-4 w-4" style={{ color }} />
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ color, backgroundColor: `${color}20` }}
            >
              {comp.direction}
            </span>
          </div>
        </div>

        {/* Value Comparison */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">
              {new Date(selectedDate1).toLocaleDateString()}
            </div>
            <div className="font-semibold">
              {formatLabValue(comp.date1Value, comp.units, 1)}
            </div>
            {comp.date1Risk && comp.date1Risk !== 'normal' && (
              <div 
                className="text-xs px-1 rounded mt-1"
                style={{ 
                  color: getRiskLevelColor(comp.date1Risk),
                  backgroundColor: `${getRiskLevelColor(comp.date1Risk)}20`
                }}
              >
                {comp.date1Risk}
              </div>
            )}
          </div>

          <ArrowRight className="h-5 w-5 text-gray-400 mx-4" />

          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">
              {new Date(selectedDate2).toLocaleDateString()}
            </div>
            <div className="font-semibold" style={{ color }}>
              {formatLabValue(comp.date2Value, comp.units, 1)}
            </div>
            {comp.date2Risk && comp.date2Risk !== 'normal' && (
              <div 
                className="text-xs px-1 rounded mt-1"
                style={{ 
                  color: getRiskLevelColor(comp.date2Risk),
                  backgroundColor: `${getRiskLevelColor(comp.date2Risk)}20`
                }}
              >
                {comp.date2Risk}
              </div>
            )}
          </div>
        </div>

        {/* Change Details */}
        <div className="text-center">
          <div className="text-sm font-medium" style={{ color }}>
            {comp.change > 0 ? '+' : ''}{formatLabValue(comp.change, comp.units, 2)} 
            ({comp.change > 0 ? '+' : ''}{comp.changePercentage.toFixed(1)}%)
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {comp.significance} change
          </div>
        </div>
      </div>
    )
  }

  const improvedCount = comparisons.filter(c => c.direction === 'improved').length
  const worsenedCount = comparisons.filter(c => c.direction === 'worsened').length
  const stableCount = comparisons.filter(c => c.direction === 'stable').length

  return (
    <LabBaseWidget
      title="Lab Comparison"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchComparisons}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<ArrowRight className="h-5 w-5 text-blue-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          {availableDates.length > 0 && (
            <>
              <select
                value={selectedDate1}
                onChange={(e) => setSelectedDate1(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">vs</span>
              <select
                value={selectedDate2}
                onChange={(e) => setSelectedDate2(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {comparisons.length > 0 ? (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{improvedCount}</div>
                <div className="text-xs text-gray-500">Improved</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-600">{stableCount}</div>
                <div className="text-xs text-gray-500">Stable</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">{worsenedCount}</div>
                <div className="text-xs text-gray-500">Worsened</div>
              </div>
            </div>

            {/* Comparisons */}
            <div className="space-y-3">
              {comparisons.map(renderComparison)}
            </div>

            {/* Date Range */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
              Comparing {new Date(selectedDate1).toLocaleDateString()} to {new Date(selectedDate2).toLocaleDateString()}
              <br />
              <span className="text-xs">
                {Math.abs(new Date(selectedDate2).getTime() - new Date(selectedDate1).getTime()) / (1000 * 60 * 60 * 24)} days apart
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Comparison Data</h3>
            <p className="text-gray-500">
              Select two different lab dates to compare results
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabComparisonWidget
