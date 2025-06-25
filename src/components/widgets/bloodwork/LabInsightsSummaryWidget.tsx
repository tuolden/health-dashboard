/**
 * Lab Insights Summary Widget - Issue #13 Widget #34
 * 
 * AI-powered insights and patterns from lab data
 */

import React, { useState, useEffect } from 'react'
import { Brain, Lightbulb, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps } from './types'

interface LabInsightsSummaryWidgetProps extends LabWidgetProps {
  timeframe?: number
}

interface Insight {
  type: 'pattern' | 'correlation' | 'trend' | 'anomaly' | 'recommendation'
  title: string
  description: string
  confidence: number
  actionable: boolean
  priority: 'high' | 'medium' | 'low'
  category: string
  relatedTests: string[]
}

export const LabInsightsSummaryWidget: React.FC<LabInsightsSummaryWidgetProps> = ({
  timeframe = 365,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchInsights = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get comprehensive lab data for analysis
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/labs/results?enhanced=true&startDate=${startDate}&endDate=${endDate}&limit=500`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lab data')
      }

      // Generate AI insights
      const generatedInsights = generateInsights(result.data)
      setInsights(generatedInsights)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(generatedInsights)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching insights:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateInsights = (data: any[]): Insight[] => {
    const insights: Insight[] = []

    // Group data by test name and date
    const testData: { [testName: string]: any[] } = {}
    data.forEach(result => {
      if (!testData[result.test_name]) {
        testData[result.test_name] = []
      }
      testData[result.test_name].push(result)
    })

    // Pattern Detection
    insights.push(...detectPatterns(testData))
    
    // Trend Analysis
    insights.push(...analyzeTrends(testData))
    
    // Anomaly Detection
    insights.push(...detectAnomalies(testData))
    
    // Correlation Insights
    insights.push(...findCorrelations(testData))
    
    // Health Recommendations
    insights.push(...generateRecommendations(data))

    // Sort by priority and confidence
    return insights
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority]
        const bPriority = priorityOrder[b.priority]
        
        if (aPriority !== bPriority) return bPriority - aPriority
        return b.confidence - a.confidence
      })
      .slice(0, 8) // Top 8 insights
  }

  const detectPatterns = (testData: { [testName: string]: any[] }): Insight[] => {
    const patterns: Insight[] = []

    Object.entries(testData).forEach(([testName, results]) => {
      if (results.length < 3) return

      // Seasonal patterns
      const monthlyData = groupByMonth(results)
      if (Object.keys(monthlyData).length >= 3) {
        const seasonalVariation = calculateSeasonalVariation(monthlyData)
        if (seasonalVariation > 15) {
          patterns.push({
            type: 'pattern',
            title: `Seasonal Pattern in ${testName}`,
            description: `${testName} shows ${seasonalVariation.toFixed(1)}% seasonal variation. Values tend to be different across seasons.`,
            confidence: 0.7,
            actionable: true,
            priority: 'medium',
            category: 'Temporal',
            relatedTests: [testName]
          })
        }
      }

      // Cyclical patterns
      const cyclicalPattern = detectCyclicalPattern(results)
      if (cyclicalPattern.detected) {
        patterns.push({
          type: 'pattern',
          title: `Cyclical Pattern in ${testName}`,
          description: `${testName} shows a ${cyclicalPattern.period}-day cycle pattern. Consider timing of tests and lifestyle factors.`,
          confidence: cyclicalPattern.confidence,
          actionable: true,
          priority: 'medium',
          category: 'Temporal',
          relatedTests: [testName]
        })
      }
    })

    return patterns
  }

  const analyzeTrends = (testData: { [testName: string]: any[] }): Insight[] => {
    const trends: Insight[] = []

    Object.entries(testData).forEach(([testName, results]) => {
      if (results.length < 4) return

      const sortedResults = results.sort((a, b) => new Date(a.collected_on).getTime() - new Date(b.collected_on).getTime())
      const trendAnalysis = calculateTrend(sortedResults.map(r => r.numeric_value).filter(v => v !== null))

      if (Math.abs(trendAnalysis.slope) > 0.1 && trendAnalysis.confidence > 0.6) {
        const direction = trendAnalysis.slope > 0 ? 'increasing' : 'decreasing'
        const isGoodTrend = determineIfGoodTrend(testName, direction)
        
        trends.push({
          type: 'trend',
          title: `${direction.charAt(0).toUpperCase() + direction.slice(1)} Trend in ${testName}`,
          description: `${testName} has been ${direction} over time. ${isGoodTrend ? 'This is a positive trend.' : 'Monitor this trend closely.'}`,
          confidence: trendAnalysis.confidence,
          actionable: !isGoodTrend,
          priority: isGoodTrend ? 'low' : 'medium',
          category: 'Trend',
          relatedTests: [testName]
        })
      }
    })

    return trends
  }

  const detectAnomalies = (testData: { [testName: string]: any[] }): Insight[] => {
    const anomalies: Insight[] = []

    Object.entries(testData).forEach(([testName, results]) => {
      if (results.length < 5) return

      const values = results.map(r => r.numeric_value).filter(v => v !== null)
      const anomalyResults = findOutliers(values)

      if (anomalyResults.outliers.length > 0) {
        anomalies.push({
          type: 'anomaly',
          title: `Unusual Values in ${testName}`,
          description: `Detected ${anomalyResults.outliers.length} unusual value(s) in ${testName}. These may indicate measurement errors or significant health events.`,
          confidence: 0.8,
          actionable: true,
          priority: 'high',
          category: 'Quality',
          relatedTests: [testName]
        })
      }
    })

    return anomalies
  }

  const findCorrelations = (testData: { [testName: string]: any[] }): Insight[] => {
    const correlations: Insight[] = []
    const testNames = Object.keys(testData)

    for (let i = 0; i < testNames.length; i++) {
      for (let j = i + 1; j < testNames.length; j++) {
        const test1 = testNames[i]
        const test2 = testNames[j]
        
        const correlation = calculateCorrelation(testData[test1], testData[test2])
        
        if (correlation && Math.abs(correlation.value) > 0.6) {
          const direction = correlation.value > 0 ? 'positive' : 'negative'
          correlations.push({
            type: 'correlation',
            title: `Strong ${direction} correlation`,
            description: `${test1} and ${test2} show a strong ${direction} correlation (r=${correlation.value.toFixed(2)}). Changes in one may predict changes in the other.`,
            confidence: Math.abs(correlation.value),
            actionable: true,
            priority: 'medium',
            category: 'Relationship',
            relatedTests: [test1, test2]
          })
        }
      }
    }

    return correlations.slice(0, 3) // Top 3 correlations
  }

  const generateRecommendations = (data: any[]): Insight[] => {
    const recommendations: Insight[] = []

    // Analyze overall health status
    const criticalCount = data.filter(r => r.risk_level === 'critical').length
    const highRiskCount = data.filter(r => r.risk_level === 'high').length
    const abnormalCount = data.filter(r => !r.is_in_range).length

    if (criticalCount > 0) {
      recommendations.push({
        type: 'recommendation',
        title: 'Immediate Medical Attention Required',
        description: `You have ${criticalCount} critical lab value(s). Seek immediate medical consultation to address these urgent findings.`,
        confidence: 1.0,
        actionable: true,
        priority: 'high',
        category: 'Medical',
        relatedTests: data.filter(r => r.risk_level === 'critical').map(r => r.test_name)
      })
    }

    if (highRiskCount > 2) {
      recommendations.push({
        type: 'recommendation',
        title: 'Multiple High-Risk Values',
        description: `${highRiskCount} lab values are at high risk. Consider comprehensive health evaluation and lifestyle modifications.`,
        confidence: 0.9,
        actionable: true,
        priority: 'high',
        category: 'Lifestyle',
        relatedTests: data.filter(r => r.risk_level === 'high').map(r => r.test_name)
      })
    }

    // Specific recommendations based on test patterns
    const lipidTests = data.filter(r => r.test_name.includes('Cholesterol') || r.test_name.includes('Triglycerides'))
    const abnormalLipids = lipidTests.filter(r => !r.is_in_range)
    
    if (abnormalLipids.length >= 2) {
      recommendations.push({
        type: 'recommendation',
        title: 'Cardiovascular Health Focus',
        description: 'Multiple lipid values are abnormal. Consider heart-healthy diet, regular exercise, and cardiology consultation.',
        confidence: 0.8,
        actionable: true,
        priority: 'medium',
        category: 'Cardiovascular',
        relatedTests: lipidTests.map(r => r.test_name)
      })
    }

    return recommendations
  }

  // Helper functions
  const groupByMonth = (results: any[]) => {
    const monthly: { [month: string]: any[] } = {}
    results.forEach(result => {
      const month = new Date(result.collected_on).getMonth()
      if (!monthly[month]) monthly[month] = []
      monthly[month].push(result)
    })
    return monthly
  }

  const calculateSeasonalVariation = (monthlyData: { [month: string]: any[] }) => {
    const monthlyAverages = Object.values(monthlyData).map(monthResults => {
      const values = monthResults.map(r => r.numeric_value).filter(v => v !== null)
      return values.reduce((sum, v) => sum + v, 0) / values.length
    })
    
    const min = Math.min(...monthlyAverages)
    const max = Math.max(...monthlyAverages)
    return ((max - min) / min) * 100
  }

  const detectCyclicalPattern = (results: any[]) => {
    // Simplified cyclical detection
    return { detected: false, period: 0, confidence: 0 }
  }

  const calculateTrend = (values: number[]) => {
    const n = values.length
    const sumX = values.reduce((sum, _, i) => sum + i, 0)
    const sumY = values.reduce((sum, v) => sum + v, 0)
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0)
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    
    // Calculate R-squared for confidence
    const meanY = sumY / n
    const ssRes = values.reduce((sum, v, i) => {
      const predicted = slope * i + (sumY - slope * sumX) / n
      return sum + Math.pow(v - predicted, 2)
    }, 0)
    const ssTot = values.reduce((sum, v) => sum + Math.pow(v - meanY, 2), 0)
    const confidence = Math.max(0, 1 - (ssRes / ssTot))

    return { slope, confidence }
  }

  const determineIfGoodTrend = (testName: string, direction: string) => {
    const lowerIsBetter = ['LDL Cholesterol', 'Total Cholesterol', 'Triglycerides', 'Glucose', 'Creatinine']
    const higherIsBetter = ['HDL Cholesterol', 'Hemoglobin']

    if (lowerIsBetter.some(test => testName.includes(test))) {
      return direction === 'decreasing'
    } else if (higherIsBetter.some(test => testName.includes(test))) {
      return direction === 'increasing'
    }
    return false
  }

  const findOutliers = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    
    const outliers = values.filter(v => v < lowerBound || v > upperBound)
    return { outliers, bounds: { lower: lowerBound, upper: upperBound } }
  }

  const calculateCorrelation = (data1: any[], data2: any[]) => {
    // Find common dates and calculate correlation
    const commonDates = data1.filter(d1 => 
      data2.some(d2 => d2.collected_on === d1.collected_on)
    )
    
    if (commonDates.length < 3) return null

    const values1 = commonDates.map(d => d.numeric_value).filter(v => v !== null)
    const values2 = commonDates.map(d => {
      const match = data2.find(d2 => d2.collected_on === d.collected_on)
      return match?.numeric_value
    }).filter(v => v !== null)

    if (values1.length !== values2.length || values1.length < 3) return null

    // Pearson correlation calculation
    const n = values1.length
    const sum1 = values1.reduce((a, b) => a + b, 0)
    const sum2 = values2.reduce((a, b) => a + b, 0)
    const sum1Sq = values1.reduce((a, b) => a + b * b, 0)
    const sum2Sq = values2.reduce((a, b) => a + b * b, 0)
    const pSum = values1.reduce((acc, val, i) => acc + val * values2[i], 0)

    const num = pSum - (sum1 * sum2 / n)
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n))

    return den === 0 ? null : { value: num / den }
  }

  useEffect(() => {
    fetchInsights()
  }, [timeframe])

  const renderInsight = (insight: Insight) => {
    const priorityColors = {
      high: '#DC2626',
      medium: '#F59E0B',
      low: '#10B981'
    }

    const typeIcons = {
      pattern: <TrendingUp className="h-5 w-5" />,
      correlation: <Brain className="h-5 w-5" />,
      trend: <TrendingUp className="h-5 w-5" />,
      anomaly: <AlertCircle className="h-5 w-5" />,
      recommendation: <Lightbulb className="h-5 w-5" />
    }

    const color = priorityColors[insight.priority]

    return (
      <div 
        key={`${insight.type}-${insight.title}`}
        className="p-4 border border-gray-200 rounded-lg"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1" style={{ color }}>
            {typeIcons[insight.type]}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{insight.title}</h4>
              <div className="flex items-center space-x-2">
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                  style={{ color, backgroundColor: `${color}20` }}
                >
                  {insight.priority}
                </span>
                {insight.actionable && (
                  <CheckCircle className="h-4 w-4 text-green-500" title="Actionable" />
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2">{insight.description}</p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
              <span className="capitalize">{insight.category}</span>
            </div>

            {insight.relatedTests.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Related Tests:</div>
                <div className="flex flex-wrap gap-1">
                  {insight.relatedTests.slice(0, 3).map(test => (
                    <span key={test} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {test}
                    </span>
                  ))}
                  {insight.relatedTests.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{insight.relatedTests.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const highPriorityCount = insights.filter(i => i.priority === 'high').length
  const actionableCount = insights.filter(i => i.actionable).length

  return (
    <LabBaseWidget
      title="Lab Insights Summary"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchInsights}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Brain className="h-5 w-5 text-purple-600" />}
      headerActions={
        insights.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            {highPriorityCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                {highPriorityCount} high priority
              </span>
            )}
            {actionableCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {actionableCount} actionable
              </span>
            )}
          </div>
        )
      }
    >
      <div className="space-y-4">
        {insights.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-700">
                <strong>AI Analysis Complete:</strong> Found {insights.length} insights from your lab data
                {actionableCount > 0 && (
                  <span className="block text-xs mt-1">
                    {actionableCount} insights have actionable recommendations
                  </span>
                )}
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-3">
              {insights.map(renderInsight)}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Insights Available</h3>
            <p className="text-gray-500">
              Need more lab data over time to generate meaningful insights
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabInsightsSummaryWidget
