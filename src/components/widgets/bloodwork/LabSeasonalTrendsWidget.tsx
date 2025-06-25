/**
 * Lab Seasonal Trends Widget - Issue #13 Widget #42
 * 
 * Analyzes seasonal patterns in lab values across multiple years
 */

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Calendar, Sun, Snowflake, Leaf } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabSeasonalTrendsWidgetProps extends LabWidgetProps {
  testNames?: string[]
  yearsBack?: number
}

interface SeasonalData {
  testName: string
  seasonalPattern: SeasonalPattern[]
  yearlyComparison: YearlyData[]
  significance: 'high' | 'medium' | 'low'
  peakSeason: string
  lowSeason: string
  variationPercent: number
  units?: string
}

interface SeasonalPattern {
  season: string
  month: number
  averageValue: number
  sampleCount: number
  standardDeviation: number
}

interface YearlyData {
  year: number
  spring: number
  summer: number
  fall: number
  winter: number
}

export const LabSeasonalTrendsWidget: React.FC<LabSeasonalTrendsWidgetProps> = ({
  testNames = ['Vitamin D', 'HDL Cholesterol', 'LDL Cholesterol', 'Glucose', 'TSH'],
  yearsBack = 3,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [seasonalData, setSeasonalData] = useState<SeasonalData[]>([])
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'seasonal' | 'yearly'>('seasonal')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchSeasonalTrends = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const endDate = new Date()
      const startDate = new Date(endDate.getFullYear() - yearsBack, 0, 1)

      const seasonalPromises = testNames.map(async (testName) => {
        try {
          const response = await fetch(`/api/labs/results?enhanced=true&testNames=${encodeURIComponent(testName)}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&limit=1000`)
          if (!response.ok) return null

          const result = await response.json()
          if (!result.success || !result.data || result.data.length < 12) return null

          return analyzeSeasonalPatterns(testName, result.data)
        } catch {
          return null
        }
      })

      const seasonalResults = await Promise.all(seasonalPromises)
      const validData = seasonalResults.filter(d => d !== null) as SeasonalData[]

      setSeasonalData(validData)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(validData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching seasonal trends:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeSeasonalPatterns = (testName: string, results: any[]): SeasonalData | null => {
    if (results.length < 12) return null

    // Group results by season and month
    const seasonalGroups: { [season: string]: any[] } = {
      spring: [], // Mar, Apr, May
      summer: [], // Jun, Jul, Aug
      fall: [],   // Sep, Oct, Nov
      winter: []  // Dec, Jan, Feb
    }

    const monthlyGroups: { [month: number]: any[] } = {}
    const yearlyGroups: { [year: number]: { [season: string]: any[] } } = {}

    results.forEach(result => {
      if (!result.numeric_value) return

      const date = new Date(result.collected_on)
      const month = date.getMonth() + 1 // 1-12
      const year = date.getFullYear()

      // Group by season
      let season: string
      if (month >= 3 && month <= 5) season = 'spring'
      else if (month >= 6 && month <= 8) season = 'summer'
      else if (month >= 9 && month <= 11) season = 'fall'
      else season = 'winter'

      seasonalGroups[season].push(result)

      // Group by month
      if (!monthlyGroups[month]) monthlyGroups[month] = []
      monthlyGroups[month].push(result)

      // Group by year and season
      if (!yearlyGroups[year]) {
        yearlyGroups[year] = { spring: [], summer: [], fall: [], winter: [] }
      }
      yearlyGroups[year][season].push(result)
    })

    // Calculate seasonal patterns
    const seasonalPattern: SeasonalPattern[] = []
    const seasonOrder = ['winter', 'spring', 'summer', 'fall']
    
    seasonOrder.forEach(season => {
      const seasonResults = seasonalGroups[season]
      if (seasonResults.length === 0) return

      const values = seasonResults.map(r => r.numeric_value)
      const average = values.reduce((sum, v) => sum + v, 0) / values.length
      const variance = values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)

      // Get representative month for season
      const monthMap = { winter: 1, spring: 4, summer: 7, fall: 10 }

      seasonalPattern.push({
        season: season.charAt(0).toUpperCase() + season.slice(1),
        month: monthMap[season as keyof typeof monthMap],
        averageValue: average,
        sampleCount: seasonResults.length,
        standardDeviation: stdDev
      })
    })

    // Calculate yearly comparison
    const yearlyComparison: YearlyData[] = []
    Object.entries(yearlyGroups).forEach(([year, seasons]) => {
      const yearData: YearlyData = { year: parseInt(year), spring: 0, summer: 0, fall: 0, winter: 0 }
      
      Object.entries(seasons).forEach(([season, results]) => {
        if (results.length > 0) {
          const values = results.map(r => r.numeric_value)
          yearData[season as keyof Omit<YearlyData, 'year'>] = values.reduce((sum, v) => sum + v, 0) / values.length
        }
      })
      
      yearlyComparison.push(yearData)
    })

    // Determine significance and peak/low seasons
    const seasonalAverages = seasonalPattern.map(s => s.averageValue)
    const maxValue = Math.max(...seasonalAverages)
    const minValue = Math.min(...seasonalAverages)
    const variationPercent = ((maxValue - minValue) / minValue) * 100

    const peakSeason = seasonalPattern.find(s => s.averageValue === maxValue)?.season || 'Unknown'
    const lowSeason = seasonalPattern.find(s => s.averageValue === minValue)?.season || 'Unknown'

    const significance = variationPercent >= 20 ? 'high' : variationPercent >= 10 ? 'medium' : 'low'

    return {
      testName,
      seasonalPattern,
      yearlyComparison: yearlyComparison.sort((a, b) => a.year - b.year),
      significance,
      peakSeason,
      lowSeason,
      variationPercent,
      units: results[0]?.metric?.units
    }
  }

  useEffect(() => {
    fetchSeasonalTrends()
  }, [testNames, yearsBack])

  const selectedData = seasonalData.find(d => d.testName === selectedTest)

  const renderSeasonalChart = (data: SeasonalData) => {
    const chartData = data.seasonalPattern.map(pattern => ({
      season: pattern.season,
      value: pattern.averageValue,
      sampleCount: pattern.sampleCount
    }))

    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="season" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => [formatLabValue(value, data.units, 1), 'Average']}
              labelFormatter={(label) => `${label} Season`}
            />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderYearlyChart = (data: SeasonalData) => {
    const chartData = data.yearlyComparison.map(year => ({
      year: year.year.toString(),
      Spring: year.spring,
      Summer: year.summer,
      Fall: year.fall,
      Winter: year.winter
    }))

    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => [formatLabValue(value, data.units, 1), '']}
            />
            <Line type="monotone" dataKey="Spring" stroke="#10B981" strokeWidth={2} />
            <Line type="monotone" dataKey="Summer" stroke="#F59E0B" strokeWidth={2} />
            <Line type="monotone" dataKey="Fall" stroke="#EF4444" strokeWidth={2} />
            <Line type="monotone" dataKey="Winter" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const getSeasonIcon = (season: string) => {
    switch (season.toLowerCase()) {
      case 'spring': return <Leaf className="h-4 w-4 text-green-500" />
      case 'summer': return <Sun className="h-4 w-4 text-yellow-500" />
      case 'fall': return <Leaf className="h-4 w-4 text-orange-500" />
      case 'winter': return <Snowflake className="h-4 w-4 text-blue-500" />
      default: return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  return (
    <LabBaseWidget
      title="Seasonal Trends Analysis"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchSeasonalTrends}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Calendar className="h-5 w-5 text-orange-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <select
            value={selectedTest || ''}
            onChange={(e) => setSelectedTest(e.target.value || null)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All Tests</option>
            {seasonalData.map(data => (
              <option key={data.testName} value={data.testName}>
                {data.testName}
              </option>
            ))}
          </select>
          {selectedTest && (
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('seasonal')}
                className={`px-2 py-1 text-xs ${viewMode === 'seasonal' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              >
                Seasonal
              </button>
              <button
                onClick={() => setViewMode('yearly')}
                className={`px-2 py-1 text-xs ${viewMode === 'yearly' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              >
                Yearly
              </button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {seasonalData.length > 0 ? (
          <>
            {selectedTest && selectedData ? (
              <>
                {/* Selected Test Analysis */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{selectedData.testName} Seasonal Analysis</h4>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                      style={{ 
                        color: getSignificanceColor(selectedData.significance),
                        backgroundColor: `${getSignificanceColor(selectedData.significance)}20`
                      }}
                    >
                      {selectedData.significance} variation
                    </span>
                  </div>

                  {/* Chart */}
                  {viewMode === 'seasonal' ? renderSeasonalChart(selectedData) : renderYearlyChart(selectedData)}

                  {/* Insights */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        {getSeasonIcon(selectedData.peakSeason)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{selectedData.peakSeason}</div>
                      <div className="text-xs text-gray-500">Peak Season</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        {getSeasonIcon(selectedData.lowSeason)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{selectedData.lowSeason}</div>
                      <div className="text-xs text-gray-500">Low Season</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">
                        {selectedData.variationPercent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Variation</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {selectedData.seasonalPattern.reduce((sum, s) => sum + s.sampleCount, 0)}
                      </div>
                      <div className="text-xs text-gray-500">Total Samples</div>
                    </div>
                  </div>

                  {/* Seasonal Details */}
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-3">Seasonal Breakdown</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selectedData.seasonalPattern.map(pattern => (
                        <div key={pattern.season} className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2 mb-2">
                            {getSeasonIcon(pattern.season)}
                            <span className="font-medium text-sm">{pattern.season}</span>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatLabValue(pattern.averageValue, selectedData.units, 1)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {pattern.sampleCount} samples
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Overview */}
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <h4 className="font-medium text-orange-900">Seasonal Analysis Overview</h4>
                  </div>
                  <div className="text-sm text-orange-700">
                    Analyzed {seasonalData.length} lab tests for seasonal patterns over {yearsBack} years
                  </div>
                </div>

                {/* Test Summary */}
                <div className="space-y-3">
                  {seasonalData.map(data => (
                    <div 
                      key={data.testName}
                      className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300"
                      onClick={() => setSelectedTest(data.testName)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{data.testName}</h4>
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                          style={{ 
                            color: getSignificanceColor(data.significance),
                            backgroundColor: `${getSignificanceColor(data.significance)}20`
                          }}
                        >
                          {data.significance}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Peak:</span>
                          <div className="flex items-center space-x-1">
                            {getSeasonIcon(data.peakSeason)}
                            <span className="font-medium">{data.peakSeason}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Low:</span>
                          <div className="flex items-center space-x-1">
                            {getSeasonIcon(data.lowSeason)}
                            <span className="font-medium">{data.lowSeason}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Variation:</span>
                          <span className="font-medium">{data.variationPercent.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Clinical Insights */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Clinical Insights</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Vitamin D typically peaks in summer due to sun exposure</li>
                <li>• Cholesterol may vary with seasonal diet and activity changes</li>
                <li>• Thyroid function can fluctuate with temperature changes</li>
                <li>• Blood pressure often increases in winter months</li>
                <li>• Consider seasonal factors when interpreting lab results</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Seasonal Data</h3>
            <p className="text-gray-500">
              Need at least {yearsBack} years of lab data to analyze seasonal trends
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabSeasonalTrendsWidget
