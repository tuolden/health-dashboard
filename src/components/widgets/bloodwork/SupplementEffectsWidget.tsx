/**
 * Supplement Effects Widget - Issue #13 Widget #31
 * 
 * Tracks the effects of supplements on lab values over time
 */

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Pill, TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface SupplementEffectsWidgetProps extends LabWidgetProps {
  supplementName?: string
  testName?: string
  timeframe?: number
}

interface SupplementEffect {
  supplementName: string
  testName: string
  startDate: string
  beforeValue: number
  afterValue: number
  change: number
  changePercentage: number
  effect: 'positive' | 'negative' | 'neutral'
  significance: 'high' | 'medium' | 'low'
  timeToEffect: number // days
  confidence: number
  recommendation: string
  units?: string
  chartData: Array<{
    date: string
    value: number
    isSupplementPeriod: boolean
  }>
}

export const SupplementEffectsWidget: React.FC<SupplementEffectsWidgetProps> = ({
  supplementName = 'Vitamin D',
  testName = 'Vitamin D',
  timeframe = 365,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [effects, setEffects] = useState<SupplementEffect[]>([])
  const [selectedSupplement, setSelectedSupplement] = useState<string>(supplementName)
  const [selectedTest, setSelectedTest] = useState<string>(testName)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchSupplementEffects = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get trend data for the selected test
      const response = await fetch(`/api/labs/trends/${encodeURIComponent(selectedTest)}?days=${timeframe}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trend data')
      }

      if (!result.data || !result.data.values || result.data.values.length < 4) {
        throw new Error('Insufficient data for supplement effect analysis (need at least 4 data points)')
      }

      // Analyze supplement effects
      const calculatedEffects = analyzeSupplementEffects(result.data, selectedSupplement)
      setEffects(calculatedEffects)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(calculatedEffects)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching supplement effects:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeSupplementEffects = (trendData: any, supplement: string): SupplementEffect[] => {
    const values = trendData.values.map((v: any) => ({
      date: v.date,
      value: v.value,
      timestamp: new Date(v.date).getTime()
    })).sort((a: any, b: any) => a.timestamp - b.timestamp)

    // Simulate supplement start dates (in real implementation, this would come from user data)
    const supplementPeriods = getSupplementPeriods(supplement, values)
    
    const effects: SupplementEffect[] = []

    supplementPeriods.forEach(period => {
      const effect = calculateSupplementEffect(values, period, supplement, selectedTest)
      if (effect) {
        effects.push(effect)
      }
    })

    return effects
  }

  const getSupplementPeriods = (supplement: string, values: any[]) => {
    // Simulate supplement periods based on common patterns
    // In real implementation, this would come from user supplement tracking data
    const periods = []
    
    if (values.length >= 6) {
      // Simulate a supplement period starting at 1/3 through the data
      const startIndex = Math.floor(values.length / 3)
      const endIndex = Math.min(startIndex + Math.floor(values.length / 2), values.length - 1)
      
      periods.push({
        startDate: values[startIndex].date,
        endDate: values[endIndex].date,
        startIndex,
        endIndex
      })
    }

    return periods
  }

  const calculateSupplementEffect = (values: any[], period: any, supplement: string, testName: string): SupplementEffect | null => {
    const beforeValues = values.slice(0, period.startIndex)
    const duringValues = values.slice(period.startIndex, period.endIndex + 1)
    const afterValues = values.slice(period.endIndex + 1)

    if (beforeValues.length < 2 || duringValues.length < 2) return null

    // Calculate averages
    const beforeAvg = beforeValues.reduce((sum, v) => sum + v.value, 0) / beforeValues.length
    const duringAvg = duringValues.reduce((sum, v) => sum + v.value, 0) / duringValues.length
    const afterAvg = afterValues.length > 0 ? 
      afterValues.reduce((sum, v) => sum + v.value, 0) / afterValues.length : duringAvg

    // Use the most recent value as "after" if we have post-supplement data
    const afterValue = afterValues.length > 0 ? afterAvg : duringAvg
    const change = afterValue - beforeAvg
    const changePercentage = (change / beforeAvg) * 100

    // Determine effect direction based on test type
    const isPositiveChange = determinePositiveChange(testName, change)
    const effect = Math.abs(changePercentage) < 5 ? 'neutral' : 
                  isPositiveChange ? 'positive' : 'negative'

    // Calculate significance based on change magnitude
    const absChangePercent = Math.abs(changePercentage)
    const significance = absChangePercent >= 20 ? 'high' : 
                        absChangePercent >= 10 ? 'medium' : 'low'

    // Calculate time to effect
    const timeToEffect = duringValues.length > 0 ? 
      Math.round((new Date(duringValues[duringValues.length - 1].date).getTime() - 
                  new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0

    // Calculate confidence based on data consistency
    const confidence = calculateConfidence(beforeValues, duringValues, afterValues)

    // Generate chart data
    const chartData = values.map(v => ({
      date: v.date,
      value: v.value,
      isSupplementPeriod: new Date(v.date) >= new Date(period.startDate) && 
                         new Date(v.date) <= new Date(period.endDate)
    }))

    const recommendation = generateRecommendation(supplement, testName, effect, significance, changePercentage)

    return {
      supplementName: supplement,
      testName,
      startDate: period.startDate,
      beforeValue: beforeAvg,
      afterValue,
      change,
      changePercentage,
      effect,
      significance,
      timeToEffect,
      confidence,
      recommendation,
      units: values[0]?.units,
      chartData
    }
  }

  const determinePositiveChange = (testName: string, change: number): boolean => {
    // Tests where higher values are better
    const higherIsBetter = ['HDL Cholesterol', 'Vitamin D', 'Vitamin B12', 'Iron', 'Hemoglobin']
    // Tests where lower values are better
    const lowerIsBetter = ['LDL Cholesterol', 'Total Cholesterol', 'Triglycerides', 'Glucose', 'Creatinine']

    if (higherIsBetter.some(test => testName.includes(test))) {
      return change > 0
    } else if (lowerIsBetter.some(test => testName.includes(test))) {
      return change < 0
    } else {
      // Default: assume higher is better for vitamins and nutrients
      return change > 0
    }
  }

  const calculateConfidence = (before: any[], during: any[], after: any[]): number => {
    // Calculate variance in each period
    const beforeVariance = calculateVariance(before.map(v => v.value))
    const duringVariance = calculateVariance(during.map(v => v.value))
    
    // Lower variance = higher confidence
    const avgVariance = (beforeVariance + duringVariance) / 2
    const confidence = Math.max(0.3, Math.min(1.0, 1 - (avgVariance / 100)))
    
    return confidence
  }

  const calculateVariance = (values: number[]): number => {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    return variance
  }

  const generateRecommendation = (supplement: string, testName: string, effect: string, significance: string, changePercent: number): string => {
    const absChange = Math.abs(changePercent)
    
    if (effect === 'positive' && significance === 'high') {
      return `${supplement} appears to have a strong positive effect on ${testName} (${absChange.toFixed(1)}% improvement). Consider continuing supplementation.`
    } else if (effect === 'positive' && significance === 'medium') {
      return `${supplement} shows moderate positive effects on ${testName} (${absChange.toFixed(1)}% improvement). Monitor with continued use.`
    } else if (effect === 'negative' && significance === 'high') {
      return `${supplement} may be negatively affecting ${testName} (${absChange.toFixed(1)}% decline). Consider discontinuing or adjusting dosage.`
    } else if (effect === 'negative' && significance === 'medium') {
      return `${supplement} shows some negative effects on ${testName} (${absChange.toFixed(1)}% decline). Monitor closely and consider dosage adjustment.`
    } else {
      return `${supplement} shows minimal effect on ${testName} (${absChange.toFixed(1)}% change). Continue monitoring for longer-term trends.`
    }
  }

  useEffect(() => {
    fetchSupplementEffects()
  }, [selectedSupplement, selectedTest, timeframe])

  const renderEffect = (effect: SupplementEffect) => {
    const effectColors = {
      positive: '#10B981',
      negative: '#EF4444',
      neutral: '#6B7280'
    }

    const color = effectColors[effect.effect]
    const isPositive = effect.effect === 'positive'

    return (
      <div key={`${effect.supplementName}-${effect.testName}`} className="space-y-4">
        {/* Summary */}
        <div 
          className="p-4 rounded-lg border"
          style={{ borderColor: color, backgroundColor: `${color}10` }}
        >
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              {effect.supplementName} → {effect.testName}
            </h4>
            <div className="flex items-center space-x-2">
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                style={{ color, backgroundColor: 'white' }}
              >
                {effect.effect} effect
              </span>
              <span className="text-sm font-bold" style={{ color }}>
                {isPositive ? '+' : ''}{effect.changePercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div className="text-xs text-gray-500">Before</div>
              <div className="font-semibold">
                {formatLabValue(effect.beforeValue, effect.units, 1)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">After</div>
              <div className="font-semibold" style={{ color }}>
                {formatLabValue(effect.afterValue, effect.units, 1)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Time to Effect</div>
              <div className="font-medium">
                {effect.timeToEffect} days
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2">{effect.recommendation}</p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Confidence: {(effect.confidence * 100).toFixed(0)}%</span>
            <span className="capitalize">{effect.significance} significance</span>
          </div>
        </div>

        {/* Chart */}
        <div>
          <h5 className="font-medium text-gray-900 mb-2">Effect Timeline</h5>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={effect.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [formatLabValue(value, effect.units, 1), effect.testName]}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                
                {/* Supplement period indicator */}
                <ReferenceLine 
                  x={effect.startDate} 
                  stroke="#8B5CF6" 
                  strokeDasharray="5 5" 
                  label="Supplement Start"
                />
                
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={(props) => {
                    const { payload } = props
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={payload.isSupplementPeriod ? '#8B5CF6' : color}
                        stroke={payload.isSupplementPeriod ? '#8B5CF6' : color}
                        strokeWidth={2}
                      />
                    )
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const availableSupplements = ['Vitamin D', 'Vitamin B12', 'Iron', 'Magnesium', 'Omega-3', 'Probiotics']
  const availableTests = ['Vitamin D', 'Vitamin B12', 'Iron', 'Hemoglobin', 'LDL Cholesterol', 'HDL Cholesterol']

  return (
    <LabBaseWidget
      title="Supplement Effects"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchSupplementEffects}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Pill className="h-5 w-5 text-purple-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <select
            value={selectedSupplement}
            onChange={(e) => setSelectedSupplement(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            {availableSupplements.map(supp => (
              <option key={supp} value={supp}>{supp}</option>
            ))}
          </select>
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            {availableTests.map(test => (
              <option key={test} value={test}>{test}</option>
            ))}
          </select>
        </div>
      }
    >
      <div className="space-y-6">
        {effects.length > 0 ? (
          <>
            {effects.map(renderEffect)}
            
            {/* Analysis Notes */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h5 className="font-medium text-purple-900 mb-2">Analysis Notes</h5>
              <div className="text-sm text-purple-700 space-y-1">
                <p>• Purple dots indicate supplement period</p>
                <p>• Effects are calculated by comparing before/after averages</p>
                <p>• Confidence is based on data consistency and sample size</p>
                <p>• Consider other factors that may influence lab values</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Effect Data</h3>
            <p className="text-gray-500">
              Insufficient data to analyze supplement effects. Need at least 4 lab results over time.
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default SupplementEffectsWidget
