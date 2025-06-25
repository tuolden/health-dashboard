/**
 * Correlation Analysis Widget - Issue #13 Widget #28
 * 
 * Analyzes correlations between different lab markers with statistical insights
 */

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, BarChart3, AlertCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps } from './types'

interface CorrelationAnalysisWidgetProps extends LabWidgetProps {
  timeframe?: number
  primaryTest?: string
  correlationThreshold?: number
}

interface CorrelationData {
  testPair: string
  test1: string
  test2: string
  correlation: number
  strength: 'very-strong' | 'strong' | 'moderate' | 'weak' | 'very-weak'
  direction: 'positive' | 'negative'
  significance: 'high' | 'medium' | 'low'
  interpretation: string
  dataPoints: number
}

export const CorrelationAnalysisWidget: React.FC<CorrelationAnalysisWidgetProps> = ({
  timeframe = 365,
  primaryTest,
  correlationThreshold = 0.3,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [correlations, setCorrelations] = useState<CorrelationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [selectedTest, setSelectedTest] = useState<string>(primaryTest || '')

  const fetchCorrelations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Get all lab results for the timeframe
      const response = await fetch(`/api/labs/results?enhanced=true&startDate=${startDate}&endDate=${endDate}&limit=1000`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lab data')
      }

      // Calculate correlations
      const calculatedCorrelations = calculateCorrelations(result.data)
      setCorrelations(calculatedCorrelations)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(calculatedCorrelations)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching correlation data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCorrelations = (data: any[]): CorrelationData[] => {
    // Group data by test name and date
    const testData: { [testName: string]: { [date: string]: number } } = {}
    
    data.forEach(result => {
      if (result.numeric_value && result.is_numeric) {
        if (!testData[result.test_name]) {
          testData[result.test_name] = {}
        }
        testData[result.test_name][result.collected_on] = result.numeric_value
      }
    })

    const testNames = Object.keys(testData)
    const correlations: CorrelationData[] = []

    // Calculate correlations between all test pairs
    for (let i = 0; i < testNames.length; i++) {
      for (let j = i + 1; j < testNames.length; j++) {
        const test1 = testNames[i]
        const test2 = testNames[j]

        // Skip if we have a selected test and neither test matches
        if (selectedTest && !test1.includes(selectedTest) && !test2.includes(selectedTest)) {
          continue
        }

        const correlation = calculatePearsonCorrelation(testData[test1], testData[test2])
        
        if (correlation !== null && Math.abs(correlation) >= correlationThreshold) {
          const correlationData = analyzeCorrelation(test1, test2, correlation, testData[test1], testData[test2])
          correlations.push(correlationData)
        }
      }
    }

    // Sort by absolute correlation strength
    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 10)
  }

  const calculatePearsonCorrelation = (data1: { [date: string]: number }, data2: { [date: string]: number }): number | null => {
    // Find common dates
    const commonDates = Object.keys(data1).filter(date => date in data2)
    
    if (commonDates.length < 3) return null // Need at least 3 data points

    const values1 = commonDates.map(date => data1[date])
    const values2 = commonDates.map(date => data2[date])

    const n = values1.length
    const sum1 = values1.reduce((a, b) => a + b, 0)
    const sum2 = values2.reduce((a, b) => a + b, 0)
    const sum1Sq = values1.reduce((a, b) => a + b * b, 0)
    const sum2Sq = values2.reduce((a, b) => a + b * b, 0)
    const pSum = values1.reduce((acc, val, i) => acc + val * values2[i], 0)

    const num = pSum - (sum1 * sum2 / n)
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n))

    if (den === 0) return null

    return num / den
  }

  const analyzeCorrelation = (test1: string, test2: string, correlation: number, data1: any, data2: any): CorrelationData => {
    const absCorr = Math.abs(correlation)
    
    let strength: 'very-strong' | 'strong' | 'moderate' | 'weak' | 'very-weak'
    if (absCorr >= 0.8) strength = 'very-strong'
    else if (absCorr >= 0.6) strength = 'strong'
    else if (absCorr >= 0.4) strength = 'moderate'
    else if (absCorr >= 0.2) strength = 'weak'
    else strength = 'very-weak'

    const direction = correlation > 0 ? 'positive' : 'negative'
    const significance = absCorr >= 0.7 ? 'high' : absCorr >= 0.5 ? 'medium' : 'low'
    const dataPoints = Object.keys(data1).filter(date => date in data2).length

    const interpretation = generateInterpretation(test1, test2, correlation, strength, direction)

    return {
      testPair: `${test1} vs ${test2}`,
      test1,
      test2,
      correlation,
      strength,
      direction,
      significance,
      interpretation,
      dataPoints
    }
  }

  const generateInterpretation = (test1: string, test2: string, correlation: number, strength: string, direction: string): string => {
    const corrValue = Math.abs(correlation).toFixed(2)
    const directionText = direction === 'positive' ? 'increase together' : 'move in opposite directions'
    
    // Specific interpretations for known relationships
    const knownRelationships: { [key: string]: string } = {
      'LDL Cholesterol-Total Cholesterol': 'LDL is a major component of total cholesterol',
      'AST-ALT': 'Both are liver enzymes that often rise together in liver injury',
      'BUN-Creatinine': 'Both indicate kidney function and often correlate',
      'Glucose-HbA1c': 'HbA1c reflects average glucose levels over 2-3 months',
      'HDL Cholesterol-Triglycerides': 'Often inversely related - high triglycerides with low HDL'
    }

    const pairKey = `${test1}-${test2}`
    const reversePairKey = `${test2}-${test1}`
    
    if (knownRelationships[pairKey] || knownRelationships[reversePairKey]) {
      const explanation = knownRelationships[pairKey] || knownRelationships[reversePairKey]
      return `${strength.replace('-', ' ')} ${direction} correlation (r=${corrValue}). ${explanation}.`
    }

    return `${strength.replace('-', ' ')} ${direction} correlation (r=${corrValue}). These values tend to ${directionText}.`
  }

  useEffect(() => {
    fetchCorrelations()
  }, [timeframe, selectedTest, correlationThreshold])

  const renderCorrelation = (corr: CorrelationData) => {
    const strengthColors = {
      'very-strong': '#DC2626',
      'strong': '#EA580C',
      'moderate': '#D97706',
      'weak': '#65A30D',
      'very-weak': '#6B7280'
    }

    const color = strengthColors[corr.strength]
    const isNegative = corr.direction === 'negative'

    return (
      <div key={corr.testPair} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 text-sm">{corr.testPair}</h4>
          <div className="flex items-center space-x-2">
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ color, backgroundColor: `${color}20` }}
            >
              {corr.strength.replace('-', ' ')}
            </span>
            <span className={`text-sm font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
              {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">{corr.interpretation}</p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{corr.dataPoints} data points</span>
          <span className="capitalize">{corr.significance} significance</span>
        </div>
      </div>
    )
  }

  const chartData = correlations.slice(0, 6).map(corr => ({
    name: corr.testPair.length > 20 ? corr.testPair.substring(0, 20) + '...' : corr.testPair,
    correlation: Math.abs(corr.correlation),
    direction: corr.correlation > 0 ? 'Positive' : 'Negative'
  }))

  const availableTests = [...new Set(correlations.flatMap(c => [c.test1, c.test2]))].sort()

  return (
    <LabBaseWidget
      title="Correlation Analysis"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchCorrelations}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All Tests</option>
            {availableTests.map(test => (
              <option key={test} value={test}>{test}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500">
            {correlations.length} correlations
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {correlations.length > 0 ? (
          <>
            {/* Chart */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Correlation Strength</h4>
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
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value, name) => [value.toFixed(2), 'Correlation']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar 
                      dataKey="correlation" 
                      fill="#3B82F6"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Correlations List */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Detailed Analysis</h4>
              <div className="space-y-3">
                {correlations.map(renderCorrelation)}
              </div>
            </div>

            {/* Interpretation Guide */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Understanding Correlations</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Positive correlation:</strong> Values tend to increase together</p>
                <p><strong>Negative correlation:</strong> As one increases, the other decreases</p>
                <p><strong>Strength:</strong> Very Strong (0.8+), Strong (0.6+), Moderate (0.4+), Weak (0.2+)</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Correlations Found</h3>
            <p className="text-gray-500">
              Need more lab data points or lower correlation threshold to find relationships
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default CorrelationAnalysisWidget
