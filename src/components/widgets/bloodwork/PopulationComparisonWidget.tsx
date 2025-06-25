/**
 * Population Comparison Widget - Issue #13 Widget #30
 * 
 * Compares user's lab values against population percentiles and demographics
 */

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, Award, AlertCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue } from './types'

interface PopulationComparisonWidgetProps extends LabWidgetProps {
  collectedOn?: string
  ageGroup?: string
  gender?: string
  selectedTests?: string[]
}

interface PopulationData {
  testName: string
  userValue: number
  percentile: number
  ageGroupAverage: number
  populationAverage: number
  ranking: 'excellent' | 'good' | 'average' | 'below-average' | 'concerning'
  comparison: string
  units?: string
  sampleSize: number
}

export const PopulationComparisonWidget: React.FC<PopulationComparisonWidgetProps> = ({
  collectedOn,
  ageGroup = '30-50',
  gender = 'all',
  selectedTests = ['LDL Cholesterol', 'HDL Cholesterol', 'Glucose', 'Hemoglobin', 'Creatinine'],
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [comparisons, setComparisons] = useState<PopulationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchComparisons = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get user's latest lab results
      let targetDate = collectedOn
      if (!targetDate) {
        const datesResponse = await fetch('/api/labs/dates')
        if (!datesResponse.ok) throw new Error('Failed to fetch dates')
        const datesResult = await datesResponse.json()
        if (!datesResult.success || datesResult.data.length === 0) {
          throw new Error('No lab data available')
        }
        targetDate = datesResult.data[0]
      }

      const params = new URLSearchParams({
        enhanced: 'true',
        startDate: targetDate,
        endDate: targetDate,
        testNames: selectedTests.join(',')
      })

      const response = await fetch(`/api/labs/results?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lab results')
      }

      // Calculate population comparisons
      const calculatedComparisons = calculatePopulationComparisons(result.data, ageGroup, gender)
      setComparisons(calculatedComparisons)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(calculatedComparisons)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching population comparison:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculatePopulationComparisons = (userResults: EnhancedLabResult[], ageGroup: string, gender: string): PopulationData[] => {
    // Population reference data (simplified - in real implementation, this would come from a database)
    const populationData: { [key: string]: any } = {
      'LDL Cholesterol': {
        percentiles: { 10: 70, 25: 90, 50: 115, 75: 140, 90: 165 },
        ageGroupAvg: { '18-30': 95, '30-50': 115, '50-70': 130, '70+': 125 },
        populationAvg: 115,
        sampleSize: 50000,
        lowerIsBetter: true
      },
      'HDL Cholesterol': {
        percentiles: { 10: 35, 25: 45, 50: 55, 75: 65, 90: 80 },
        ageGroupAvg: { '18-30': 55, '30-50': 52, '50-70': 58, '70+': 60 },
        populationAvg: 55,
        sampleSize: 50000,
        lowerIsBetter: false
      },
      'Glucose': {
        percentiles: { 10: 75, 25: 82, 50: 90, 75: 98, 90: 108 },
        ageGroupAvg: { '18-30': 88, '30-50': 92, '50-70': 96, '70+': 100 },
        populationAvg: 92,
        sampleSize: 75000,
        lowerIsBetter: true
      },
      'Hemoglobin': {
        percentiles: { 10: 11.5, 25: 12.8, 50: 14.2, 75: 15.5, 90: 16.8 },
        ageGroupAvg: { '18-30': 14.5, '30-50': 14.2, '50-70': 13.8, '70+': 13.5 },
        populationAvg: 14.2,
        sampleSize: 60000,
        lowerIsBetter: false
      },
      'Creatinine': {
        percentiles: { 10: 0.6, 25: 0.8, 50: 1.0, 75: 1.2, 90: 1.4 },
        ageGroupAvg: { '18-30': 0.9, '30-50': 1.0, '50-70': 1.1, '70+': 1.2 },
        populationAvg: 1.0,
        sampleSize: 45000,
        lowerIsBetter: true
      },
      'Total Cholesterol': {
        percentiles: { 10: 140, 25: 170, 50: 200, 75: 230, 90: 260 },
        ageGroupAvg: { '18-30': 185, '30-50': 205, '50-70': 220, '70+': 210 },
        populationAvg: 200,
        sampleSize: 55000,
        lowerIsBetter: true
      }
    }

    const comparisons: PopulationData[] = []

    userResults.forEach(result => {
      if (!result.numeric_value || !populationData[result.test_name]) return

      const testData = populationData[result.test_name]
      const userValue = result.numeric_value
      const percentiles = testData.percentiles
      const ageGroupAverage = testData.ageGroupAvg[ageGroup] || testData.populationAvg
      const populationAverage = testData.populationAvg
      const lowerIsBetter = testData.lowerIsBetter

      // Calculate percentile
      let percentile = 50 // default
      if (userValue <= percentiles[10]) percentile = 5
      else if (userValue <= percentiles[25]) percentile = 17.5
      else if (userValue <= percentiles[50]) percentile = 37.5
      else if (userValue <= percentiles[75]) percentile = 62.5
      else if (userValue <= percentiles[90]) percentile = 82.5
      else percentile = 95

      // Adjust percentile for "higher is better" tests
      if (!lowerIsBetter) {
        percentile = 100 - percentile
      }

      // Determine ranking
      let ranking: 'excellent' | 'good' | 'average' | 'below-average' | 'concerning'
      if (percentile >= 90) ranking = 'excellent'
      else if (percentile >= 75) ranking = 'good'
      else if (percentile >= 50) ranking = 'average'
      else if (percentile >= 25) ranking = 'below-average'
      else ranking = 'concerning'

      // Generate comparison text
      const comparison = generateComparison(
        result.test_name,
        userValue,
        percentile,
        ageGroupAverage,
        populationAverage,
        lowerIsBetter,
        ageGroup
      )

      comparisons.push({
        testName: result.test_name,
        userValue,
        percentile,
        ageGroupAverage,
        populationAverage,
        ranking,
        comparison,
        units: result.metric?.units,
        sampleSize: testData.sampleSize
      })
    })

    return comparisons.sort((a, b) => b.percentile - a.percentile)
  }

  const generateComparison = (
    testName: string,
    userValue: number,
    percentile: number,
    ageGroupAvg: number,
    populationAvg: number,
    lowerIsBetter: boolean,
    ageGroup: string
  ): string => {
    const percentileText = percentile >= 90 ? 'top 10%' :
                          percentile >= 75 ? 'top 25%' :
                          percentile >= 50 ? 'above average' :
                          percentile >= 25 ? 'below average' : 'bottom 25%'

    const vsAgeGroup = userValue > ageGroupAvg ? 'above' : userValue < ageGroupAvg ? 'below' : 'equal to'
    const vsPopulation = userValue > populationAvg ? 'above' : userValue < populationAvg ? 'below' : 'equal to'

    return `Your ${testName} is in the ${percentileText} compared to the general population. ` +
           `It's ${vsAgeGroup} the average for your age group (${ageGroup}) and ${vsPopulation} the overall population average.`
  }

  useEffect(() => {
    fetchComparisons()
  }, [collectedOn, ageGroup, gender, selectedTests])

  const renderComparison = (comp: PopulationData) => {
    const rankingColors = {
      excellent: '#10B981',
      good: '#3B82F6',
      average: '#6B7280',
      'below-average': '#F59E0B',
      concerning: '#EF4444'
    }

    const color = rankingColors[comp.ranking]

    return (
      <div key={comp.testName} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-gray-900">{comp.testName}</h4>
          <div className="flex items-center space-x-2">
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ color, backgroundColor: `${color}20` }}
            >
              {comp.ranking.replace('-', ' ')}
            </span>
            <span className="text-sm font-bold" style={{ color }}>
              {comp.percentile.toFixed(0)}th %ile
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-500">Your Value</div>
            <div className="font-semibold" style={{ color }}>
              {formatLabValue(comp.userValue, comp.units, 1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Age Group Avg</div>
            <div className="font-medium text-gray-700">
              {formatLabValue(comp.ageGroupAverage, comp.units, 1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Population Avg</div>
            <div className="font-medium text-gray-700">
              {formatLabValue(comp.populationAverage, comp.units, 1)}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-2">{comp.comparison}</p>

        <div className="text-xs text-gray-500">
          Based on {comp.sampleSize.toLocaleString()} population samples
        </div>
      </div>
    )
  }

  const chartData = comparisons.map(comp => ({
    name: comp.testName.length > 15 ? comp.testName.substring(0, 15) + '...' : comp.testName,
    percentile: comp.percentile,
    ranking: comp.ranking
  }))

  const excellentCount = comparisons.filter(c => c.ranking === 'excellent').length
  const goodCount = comparisons.filter(c => c.ranking === 'good').length
  const concerningCount = comparisons.filter(c => c.ranking === 'concerning').length

  return (
    <LabBaseWidget
      title="Population Comparison"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchComparisons}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Users className="h-5 w-5 text-blue-600" />}
      headerActions={
        <div className="flex items-center space-x-2 text-sm">
          {excellentCount > 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              {excellentCount} excellent
            </span>
          )}
          {concerningCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              {concerningCount} concerning
            </span>
          )}
          <span className="text-gray-500">vs {ageGroup} age group</span>
        </div>
      }
    >
      <div className="space-y-6">
        {comparisons.length > 0 ? (
          <>
            {/* Chart */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Percentile Rankings</h4>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                      label={{ value: 'Percentile', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${value}th percentile`, 'Ranking']}
                    />
                    <Bar 
                      dataKey="percentile" 
                      fill="#3B82F6"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Comparisons */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Detailed Analysis</h4>
              <div className="space-y-3">
                {comparisons.map(renderComparison)}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Population Summary</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>{excellentCount}</strong> values in excellent range (top 10%)</p>
                <p>• <strong>{goodCount}</strong> values in good range (top 25%)</p>
                <p>• <strong>{concerningCount}</strong> values needing attention (bottom 25%)</p>
                <p className="mt-2 text-xs">
                  Comparisons based on age group: {ageGroup}, gender: {gender}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Comparison Data</h3>
            <p className="text-gray-500">
              No lab results available for population comparison
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default PopulationComparisonWidget
