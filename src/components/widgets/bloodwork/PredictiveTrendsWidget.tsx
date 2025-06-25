/**
 * Predictive Trends Widget - Issue #13 Widget #29
 * 
 * Uses trend analysis to predict future lab values and identify concerning trajectories
 */

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, AlertTriangle, Target, Calendar } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface PredictiveTrendsWidgetProps extends LabWidgetProps {
  testName: string
  predictionMonths?: number
  confidenceLevel?: number
}

interface PredictionData {
  testName: string
  currentValue: number
  predictedValue: number
  predictionDate: string
  trend: 'improving' | 'stable' | 'concerning' | 'critical'
  confidence: number
  timeToTarget?: number
  riskAssessment: string
  recommendation: string
  historicalData: Array<{
    date: string
    value: number
    isPrediction: boolean
  }>
  targetRange?: { min: number, max: number }
  units?: string
}

export const PredictiveTrendsWidget: React.FC<PredictiveTrendsWidgetProps> = ({
  testName,
  predictionMonths = 6,
  confidenceLevel = 0.7,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchPrediction = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get trend data for the test
      const response = await fetch(`/api/labs/trends/${encodeURIComponent(testName)}?days=365`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trend data')
      }

      if (!result.data || !result.data.values || result.data.values.length < 3) {
        throw new Error('Insufficient data for prediction (need at least 3 data points)')
      }

      // Calculate prediction
      const calculatedPrediction = calculatePrediction(result.data, predictionMonths)
      setPrediction(calculatedPrediction)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(calculatedPrediction)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching prediction data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculatePrediction = (trendData: any, months: number): PredictionData => {
    const values = trendData.values.map((v: any) => ({
      date: v.date,
      value: v.value,
      timestamp: new Date(v.date).getTime()
    })).sort((a: any, b: any) => a.timestamp - b.timestamp)

    // Linear regression for trend prediction
    const n = values.length
    const sumX = values.reduce((sum: number, v: any, i: number) => sum + i, 0)
    const sumY = values.reduce((sum: number, v: any) => sum + v.value, 0)
    const sumXY = values.reduce((sum: number, v: any, i: number) => sum + i * v.value, 0)
    const sumXX = values.reduce((sum: number, v: any, i: number) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared for confidence
    const meanY = sumY / n
    const ssRes = values.reduce((sum: number, v: any, i: number) => {
      const predicted = slope * i + intercept
      return sum + Math.pow(v.value - predicted, 2)
    }, 0)
    const ssTot = values.reduce((sum: number, v: any) => sum + Math.pow(v.value - meanY, 2), 0)
    const rSquared = 1 - (ssRes / ssTot)
    const confidence = Math.max(0, Math.min(1, rSquared))

    // Predict future value
    const futureIndex = n + (months * 30 / (values.length > 1 ? 
      (values[values.length - 1].timestamp - values[0].timestamp) / (1000 * 60 * 60 * 24) / (values.length - 1) : 30))
    const predictedValue = slope * futureIndex + intercept
    const currentValue = values[values.length - 1].value

    // Generate prediction date
    const lastDate = new Date(values[values.length - 1].date)
    const predictionDate = new Date(lastDate.getTime() + months * 30 * 24 * 60 * 60 * 1000)

    // Create historical + prediction data for chart
    const historicalData = [
      ...values.map((v: any) => ({ date: v.date, value: v.value, isPrediction: false })),
      { date: predictionDate.toISOString().split('T')[0], value: predictedValue, isPrediction: true }
    ]

    // Define target ranges for common tests
    const targetRanges: { [key: string]: { min: number, max: number } } = {
      'LDL Cholesterol': { min: 0, max: 100 },
      'HDL Cholesterol': { min: 40, max: 100 },
      'Total Cholesterol': { min: 0, max: 200 },
      'Glucose': { min: 70, max: 99 },
      'Hemoglobin': { min: 12, max: 16 },
      'Creatinine': { min: 0.6, max: 1.2 },
      'TSH': { min: 0.5, max: 4.5 }
    }

    const targetRange = targetRanges[testName]

    // Assess trend
    let trend: 'improving' | 'stable' | 'concerning' | 'critical'
    const changeRate = Math.abs(slope)
    const isMovingTowardTarget = targetRange ? 
      (predictedValue >= targetRange.min && predictedValue <= targetRange.max) : true

    if (changeRate < 0.1) {
      trend = 'stable'
    } else if (isMovingTowardTarget) {
      trend = 'improving'
    } else if (targetRange && (predictedValue < targetRange.min * 0.7 || predictedValue > targetRange.max * 1.5)) {
      trend = 'critical'
    } else {
      trend = 'concerning'
    }

    // Calculate time to target
    let timeToTarget: number | undefined
    if (targetRange && slope !== 0) {
      const targetValue = testName === 'HDL Cholesterol' ? targetRange.min : 
                         (targetRange.min + targetRange.max) / 2
      const timeToTargetDays = Math.abs((targetValue - currentValue) / slope)
      if (timeToTargetDays > 0 && timeToTargetDays < 365 * 2) {
        timeToTarget = Math.round(timeToTargetDays)
      }
    }

    // Generate assessment and recommendation
    const { riskAssessment, recommendation } = generateAssessment(
      testName, currentValue, predictedValue, trend, confidence, timeToTarget
    )

    return {
      testName,
      currentValue,
      predictedValue,
      predictionDate: predictionDate.toISOString().split('T')[0],
      trend,
      confidence,
      timeToTarget,
      riskAssessment,
      recommendation,
      historicalData,
      targetRange,
      units: trendData.values[0]?.units
    }
  }

  const generateAssessment = (
    testName: string,
    current: number,
    predicted: number,
    trend: string,
    confidence: number,
    timeToTarget?: number
  ) => {
    const change = predicted - current
    const changePercent = Math.abs((change / current) * 100)

    let riskAssessment = ''
    let recommendation = ''

    switch (trend) {
      case 'critical':
        riskAssessment = `Critical trajectory detected. ${testName} may reach concerning levels within ${predictionMonths} months.`
        recommendation = 'Immediate medical consultation recommended. Consider aggressive intervention.'
        break
      case 'concerning':
        riskAssessment = `Concerning trend identified. ${testName} is moving away from optimal range.`
        recommendation = 'Schedule follow-up with healthcare provider. Consider lifestyle modifications.'
        break
      case 'improving':
        riskAssessment = `Positive trend detected. ${testName} is moving toward optimal range.`
        recommendation = 'Continue current management approach. Monitor progress regularly.'
        break
      case 'stable':
        riskAssessment = `Stable trend with minimal change expected (${changePercent.toFixed(1)}% change).`
        recommendation = 'Maintain current health practices. Routine monitoring sufficient.'
        break
    }

    if (confidence < 0.5) {
      riskAssessment += ' Note: Prediction confidence is low due to variable data.'
      recommendation += ' More frequent testing may improve prediction accuracy.'
    }

    if (timeToTarget) {
      recommendation += ` Estimated ${timeToTarget} days to reach target range.`
    }

    return { riskAssessment, recommendation }
  }

  useEffect(() => {
    fetchPrediction()
  }, [testName, predictionMonths])

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'critical': return '#DC2626'
      case 'concerning': return '#EA580C'
      case 'improving': return '#10B981'
      case 'stable': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'critical':
      case 'concerning':
        return <AlertTriangle className="h-5 w-5" style={{ color: getTrendColor(trend) }} />
      case 'improving':
        return <TrendingUp className="h-5 w-5" style={{ color: getTrendColor(trend) }} />
      case 'stable':
        return <Target className="h-5 w-5" style={{ color: getTrendColor(trend) }} />
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <p style={{ color: data.isPrediction ? '#EF4444' : '#3B82F6' }}>
            {data.isPrediction ? 'Predicted: ' : 'Actual: '}
            {formatLabValue(payload[0].value, prediction?.units, 1)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <LabBaseWidget
      title={`Predictive Trends: ${testName}`}
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchPrediction}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={getTrendIcon(prediction?.trend || 'stable')}
      headerActions={
        prediction && (
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium capitalize"
            style={{ 
              color: getTrendColor(prediction.trend),
              backgroundColor: `${getTrendColor(prediction.trend)}20`
            }}
          >
            {prediction.trend}
          </div>
        )
      }
    >
      {prediction && (
        <div className="space-y-6">
          {/* Prediction Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Current Value</div>
              <div className="text-xl font-bold text-gray-900">
                {formatLabValue(prediction.currentValue, prediction.units, 1)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Predicted Value</div>
              <div 
                className="text-xl font-bold"
                style={{ color: getTrendColor(prediction.trend) }}
              >
                {formatLabValue(prediction.predictedValue, prediction.units, 1)}
              </div>
            </div>
          </div>

          {/* Confidence and Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Confidence</div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${prediction.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {(prediction.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Prediction Date</div>
              <div className="font-medium">
                {new Date(prediction.predictionDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Trend Projection</h4>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prediction.historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Target range lines */}
                  {prediction.targetRange && (
                    <>
                      <ReferenceLine 
                        y={prediction.targetRange.min} 
                        stroke="#10B981" 
                        strokeDasharray="5 5" 
                        label="Min Target"
                      />
                      <ReferenceLine 
                        y={prediction.targetRange.max} 
                        stroke="#10B981" 
                        strokeDasharray="5 5" 
                        label="Max Target"
                      />
                    </>
                  )}
                  
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={(props) => {
                      const { payload } = props
                      return (
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={4}
                          fill={payload.isPrediction ? '#EF4444' : '#3B82F6'}
                          stroke={payload.isPrediction ? '#EF4444' : '#3B82F6'}
                          strokeWidth={2}
                        />
                      )
                    }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Assessment */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              borderColor: getTrendColor(prediction.trend),
              backgroundColor: `${getTrendColor(prediction.trend)}10`
            }}
          >
            <h5 className="font-medium mb-2" style={{ color: getTrendColor(prediction.trend) }}>
              Risk Assessment
            </h5>
            <p className="text-sm text-gray-700 mb-3">{prediction.riskAssessment}</p>
            <h5 className="font-medium mb-1" style={{ color: getTrendColor(prediction.trend) }}>
              Recommendation
            </h5>
            <p className="text-sm text-gray-700">{prediction.recommendation}</p>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Disclaimer:</strong> Predictions are based on historical trends and should not replace medical advice. 
            Consult healthcare providers for medical decisions.
          </div>
        </div>
      )}
    </LabBaseWidget>
  )
}

export default PredictiveTrendsWidget
