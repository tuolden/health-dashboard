/**
 * Lab Anomaly Detection Widget - Issue #13 Widget #38
 * 
 * AI-powered anomaly detection for unusual lab values and patterns
 */

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Eye, TrendingUp, Calendar } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabAnomalyDetectionWidgetProps extends LabWidgetProps {
  sensitivityLevel?: 'low' | 'medium' | 'high'
  timeframe?: number
}

interface Anomaly {
  testName: string
  value: number
  date: string
  anomalyType: 'outlier' | 'sudden_change' | 'pattern_break' | 'trend_reversal'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  description: string
  possibleCauses: string[]
  recommendations: string[]
  units?: string
  previousValue?: number
  expectedRange?: { min: number, max: number }
}

export const LabAnomalyDetectionWidget: React.FC<LabAnomalyDetectionWidgetProps> = ({
  sensitivityLevel = 'medium',
  timeframe = 365,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchAnomalies = async () => {
    try {
      setIsLoading(true)
      setError(null)

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

      // Detect anomalies
      const detectedAnomalies = detectAnomalies(result.data, sensitivityLevel)
      setAnomalies(detectedAnomalies)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(detectedAnomalies)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching anomalies:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const detectAnomalies = (data: any[], sensitivity: string): Anomaly[] => {
    const anomalies: Anomaly[] = []
    
    // Group data by test name
    const testData: { [testName: string]: any[] } = {}
    data.forEach(result => {
      if (result.numeric_value && result.is_numeric) {
        if (!testData[result.test_name]) {
          testData[result.test_name] = []
        }
        testData[result.test_name].push(result)
      }
    })

    // Sensitivity thresholds
    const thresholds = {
      low: { outlier: 3.0, change: 50, confidence: 0.8 },
      medium: { outlier: 2.5, change: 30, confidence: 0.7 },
      high: { outlier: 2.0, change: 20, confidence: 0.6 }
    }
    const threshold = thresholds[sensitivity]

    Object.entries(testData).forEach(([testName, results]) => {
      if (results.length < 3) return

      // Sort by date
      const sortedResults = results.sort((a, b) => 
        new Date(a.collected_on).getTime() - new Date(b.collected_on).getTime()
      )

      // Detect outliers
      anomalies.push(...detectOutliers(testName, sortedResults, threshold))
      
      // Detect sudden changes
      anomalies.push(...detectSuddenChanges(testName, sortedResults, threshold))
      
      // Detect trend reversals
      anomalies.push(...detectTrendReversals(testName, sortedResults, threshold))
    })

    // Sort by severity and confidence
    return anomalies
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const aSeverity = severityOrder[a.severity]
        const bSeverity = severityOrder[b.severity]
        
        if (aSeverity !== bSeverity) return bSeverity - aSeverity
        return b.confidence - a.confidence
      })
      .slice(0, 10) // Top 10 anomalies
  }

  const detectOutliers = (testName: string, results: any[], threshold: any): Anomaly[] => {
    const values = results.map(r => r.numeric_value)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length)
    
    const outliers: Anomaly[] = []
    
    results.forEach(result => {
      const zScore = Math.abs((result.numeric_value - mean) / stdDev)
      
      if (zScore >= threshold.outlier) {
        const severity = zScore >= 4 ? 'critical' : zScore >= 3 ? 'high' : 'medium'
        
        outliers.push({
          testName,
          value: result.numeric_value,
          date: result.collected_on,
          anomalyType: 'outlier',
          severity,
          confidence: Math.min(0.95, zScore / 4),
          description: `${testName} value is ${zScore.toFixed(1)} standard deviations from normal`,
          possibleCauses: [
            'Laboratory error or contamination',
            'Medication effect',
            'Acute illness or stress',
            'Dietary factors',
            'Sample collection issues'
          ],
          recommendations: [
            'Verify result with repeat testing',
            'Review recent medications and supplements',
            'Consider clinical correlation',
            'Check for sample collection errors'
          ],
          units: result.metric?.units,
          expectedRange: { min: mean - 2 * stdDev, max: mean + 2 * stdDev }
        })
      }
    })
    
    return outliers
  }

  const detectSuddenChanges = (testName: string, results: any[], threshold: any): Anomaly[] => {
    const changes: Anomaly[] = []
    
    for (let i = 1; i < results.length; i++) {
      const current = results[i]
      const previous = results[i - 1]
      
      const changePercent = Math.abs((current.numeric_value - previous.numeric_value) / previous.numeric_value) * 100
      
      if (changePercent >= threshold.change) {
        const severity = changePercent >= 75 ? 'critical' : 
                        changePercent >= 50 ? 'high' : 'medium'
        
        changes.push({
          testName,
          value: current.numeric_value,
          date: current.collected_on,
          anomalyType: 'sudden_change',
          severity,
          confidence: Math.min(0.9, changePercent / 100),
          description: `${testName} changed by ${changePercent.toFixed(1)}% from previous measurement`,
          possibleCauses: [
            'Medication change or new prescription',
            'Acute medical condition',
            'Lifestyle change (diet, exercise)',
            'Laboratory variation',
            'Sample timing differences'
          ],
          recommendations: [
            'Review recent changes in medications',
            'Consider repeat testing to confirm',
            'Evaluate for acute medical conditions',
            'Review lifestyle factors'
          ],
          units: current.metric?.units,
          previousValue: previous.numeric_value
        })
      }
    }
    
    return changes
  }

  const detectTrendReversals = (testName: string, results: any[], threshold: any): Anomaly[] => {
    if (results.length < 4) return []
    
    const reversals: Anomaly[] = []
    
    // Look for trend reversals in the last few measurements
    for (let i = 3; i < results.length; i++) {
      const recent = results.slice(i - 3, i + 1)
      const values = recent.map(r => r.numeric_value)
      
      // Check if there's a clear trend reversal
      const firstHalf = values.slice(0, 2)
      const secondHalf = values.slice(2, 4)
      
      const firstTrend = firstHalf[1] - firstHalf[0]
      const secondTrend = secondHalf[1] - secondHalf[0]
      
      // Significant trend reversal
      if (Math.abs(firstTrend) > values[0] * 0.1 && 
          Math.abs(secondTrend) > values[0] * 0.1 && 
          Math.sign(firstTrend) !== Math.sign(secondTrend)) {
        
        reversals.push({
          testName,
          value: results[i].numeric_value,
          date: results[i].collected_on,
          anomalyType: 'trend_reversal',
          severity: 'medium',
          confidence: threshold.confidence,
          description: `${testName} trend reversed from ${firstTrend > 0 ? 'increasing' : 'decreasing'} to ${secondTrend > 0 ? 'increasing' : 'decreasing'}`,
          possibleCauses: [
            'Treatment response or medication adjustment',
            'Lifestyle intervention effects',
            'Disease progression change',
            'Seasonal variation',
            'Measurement variability'
          ],
          recommendations: [
            'Monitor trend continuation',
            'Review recent interventions',
            'Consider clinical significance',
            'Plan follow-up testing'
          ],
          units: results[i].metric?.units
        })
      }
    }
    
    return reversals
  }

  useEffect(() => {
    fetchAnomalies()
  }, [sensitivityLevel, timeframe])

  const renderAnomaly = (anomaly: Anomaly) => {
    const severityColors = {
      critical: '#DC2626',
      high: '#EA580C',
      medium: '#F59E0B',
      low: '#10B981'
    }

    const typeIcons = {
      outlier: <AlertTriangle className="h-5 w-5" />,
      sudden_change: <TrendingUp className="h-5 w-5" />,
      pattern_break: <Eye className="h-5 w-5" />,
      trend_reversal: <TrendingUp className="h-5 w-5 transform rotate-180" />
    }

    const color = severityColors[anomaly.severity]

    return (
      <div 
        key={`${anomaly.testName}-${anomaly.date}`}
        className="p-4 border border-gray-200 rounded-lg"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1" style={{ color }}>
            {typeIcons[anomaly.anomalyType]}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{anomaly.testName}</h4>
              <div className="flex items-center space-x-2">
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                  style={{ color, backgroundColor: `${color}20` }}
                >
                  {anomaly.severity}
                </span>
                <span className="text-xs text-gray-500">
                  {(anomaly.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">{anomaly.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xs text-gray-500">Anomalous Value</div>
                <div className="font-semibold" style={{ color }}>
                  {formatLabValue(anomaly.value, anomaly.units, 1)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Date</div>
                <div className="font-medium">
                  {new Date(anomaly.date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {anomaly.previousValue && (
              <div className="mb-3">
                <div className="text-xs text-gray-500">Previous Value</div>
                <div className="font-medium">
                  {formatLabValue(anomaly.previousValue, anomaly.units, 1)}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Possible Causes:</div>
                <div className="text-xs text-gray-600">
                  {anomaly.possibleCauses.slice(0, 3).join(', ')}
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Recommendations:</div>
                <div className="text-xs text-gray-600">
                  {anomaly.recommendations.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length
  const highCount = anomalies.filter(a => a.severity === 'high').length

  return (
    <LabBaseWidget
      title="Anomaly Detection"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchAnomalies}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Eye className="h-5 w-5 text-purple-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <select
            value={sensitivityLevel}
            onChange={(e) => setSensitivityLevel(e.target.value as 'low' | 'medium' | 'high')}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="low">Low Sensitivity</option>
            <option value="medium">Medium Sensitivity</option>
            <option value="high">High Sensitivity</option>
          </select>
          {anomalies.length > 0 && (
            <div className="flex items-center space-x-1">
              {criticalCount > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {criticalCount} critical
                </span>
              )}
              {highCount > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                  {highCount} high
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {anomalies.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-700">
                <strong>AI Analysis:</strong> Detected {anomalies.length} anomalies in your lab data
                {criticalCount > 0 && (
                  <span className="block text-xs mt-1 text-red-600">
                    {criticalCount} require immediate attention
                  </span>
                )}
              </div>
            </div>

            {/* Anomalies List */}
            <div className="space-y-3">
              {anomalies.map(renderAnomaly)}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Anomalies Detected</h3>
            <p className="text-gray-500">
              Your lab values appear normal with no unusual patterns detected
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabAnomalyDetectionWidget
