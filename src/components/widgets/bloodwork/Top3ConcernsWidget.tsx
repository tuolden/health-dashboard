/**
 * Top 3 Concerns Widget - Issue #13 Widget #24
 * 
 * Prioritizes and displays the top 3 most concerning lab values with actionable advice
 */

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Clock, ArrowRight, CheckCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue, getRiskLevelColor, getRiskLevelBackground } from './types'

interface Top3ConcernsWidgetProps extends LabWidgetProps {
  collectedOn?: string
}

interface Concern {
  testName: string
  value: string | number
  units?: string
  riskLevel: string
  deviationScore: number
  priority: 'urgent' | 'high' | 'moderate'
  concern: string
  actionNeeded: string
  timeframe: string
  explanation: string
  collectedOn: string
}

export const Top3ConcernsWidget: React.FC<Top3ConcernsWidgetProps> = ({
  collectedOn,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [concerns, setConcerns] = useState<Concern[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchConcerns = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        enhanced: 'true',
        onlyAbnormal: 'true',
        limit: '50' // Get more to properly prioritize
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
        throw new Error(result.error || 'Failed to fetch lab concerns')
      }

      // Process and prioritize concerns
      const processedConcerns = processConcerns(result.data)
      setConcerns(processedConcerns)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(processedConcerns)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching lab concerns:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processConcerns = (data: EnhancedLabResult[]): Concern[] => {
    const concerns: Concern[] = []

    data.forEach(result => {
      if (result.risk_level && ['elevated', 'high', 'critical'].includes(result.risk_level)) {
        const concern = generateConcern(result)
        if (concern) {
          concerns.push(concern)
        }
      }
    })

    // Sort by priority and deviation score
    return concerns
      .sort((a, b) => {
        const priorityOrder = { urgent: 3, high: 2, moderate: 1 }
        const aPriority = priorityOrder[a.priority]
        const bPriority = priorityOrder[b.priority]
        
        if (aPriority !== bPriority) return bPriority - aPriority
        return b.deviationScore - a.deviationScore
      })
      .slice(0, 3) // Top 3 only
  }

  const generateConcern = (result: EnhancedLabResult): Concern | null => {
    if (!result.deviation_score || !result.risk_level) return null

    const testName = result.test_name
    const riskLevel = result.risk_level
    const deviationScore = result.deviation_score

    // Determine priority based on risk level and deviation
    let priority: 'urgent' | 'high' | 'moderate'
    if (riskLevel === 'critical' || deviationScore >= 2.0) {
      priority = 'urgent'
    } else if (riskLevel === 'high' || deviationScore >= 1.5) {
      priority = 'high'
    } else {
      priority = 'moderate'
    }

    // Generate specific concerns and actions based on test type
    const concernData = getConcernData(testName, riskLevel, result.numeric_value, result.metric)
    
    return {
      testName,
      value: result.value,
      units: result.metric?.units,
      riskLevel,
      deviationScore,
      priority,
      concern: concernData.concern,
      actionNeeded: concernData.action,
      timeframe: concernData.timeframe,
      explanation: concernData.explanation,
      collectedOn: result.collected_on
    }
  }

  const getConcernData = (testName: string, riskLevel: string, value?: number, metric?: any) => {
    const concernMap: { [key: string]: any } = {
      'Glucose': {
        concern: 'Blood sugar levels are outside normal range',
        action: 'Monitor blood sugar, review diet, consider diabetes screening',
        timeframe: riskLevel === 'critical' ? 'Within 24 hours' : 'Within 1 week',
        explanation: 'Elevated glucose can indicate diabetes risk or poor blood sugar control'
      },
      'Creatinine': {
        concern: 'Kidney function may be impaired',
        action: 'Nephrology consultation, avoid nephrotoxic medications',
        timeframe: riskLevel === 'critical' ? 'Within 48 hours' : 'Within 2 weeks',
        explanation: 'High creatinine suggests the kidneys may not be filtering waste properly'
      },
      'LDL Cholesterol': {
        concern: 'Increased cardiovascular disease risk',
        action: 'Cardiology consultation, lifestyle changes, consider statin therapy',
        timeframe: 'Within 1-2 weeks',
        explanation: 'High LDL cholesterol can lead to heart disease and stroke'
      },
      'HDL Cholesterol': {
        concern: 'Reduced cardiovascular protection',
        action: 'Increase exercise, improve diet, consider medication',
        timeframe: 'Within 1 month',
        explanation: 'Low HDL cholesterol reduces protection against heart disease'
      },
      'Hemoglobin': {
        concern: value && value < (metric?.range_min || 12) ? 'Possible anemia' : 'Blood count abnormality',
        action: 'Complete blood work, iron studies, hematology if severe',
        timeframe: riskLevel === 'critical' ? 'Within 48 hours' : 'Within 1 week',
        explanation: 'Abnormal hemoglobin can indicate anemia, bleeding, or blood disorders'
      },
      'TSH': {
        concern: 'Thyroid function abnormality',
        action: 'Endocrinology consultation, complete thyroid panel',
        timeframe: 'Within 2-4 weeks',
        explanation: 'Abnormal TSH indicates thyroid gland over- or under-activity'
      },
      'AST': {
        concern: 'Possible liver stress or damage',
        action: 'Review medications, avoid alcohol, hepatology if severe',
        timeframe: riskLevel === 'critical' ? 'Within 48 hours' : 'Within 1 week',
        explanation: 'Elevated liver enzymes can indicate liver inflammation or damage'
      },
      'ALT': {
        concern: 'Possible liver stress or damage',
        action: 'Review medications, avoid alcohol, hepatology if severe',
        timeframe: riskLevel === 'critical' ? 'Within 48 hours' : 'Within 1 week',
        explanation: 'Elevated liver enzymes can indicate liver inflammation or damage'
      }
    }

    return concernMap[testName] || {
      concern: `${testName} is outside normal range`,
      action: 'Follow up with healthcare provider for evaluation',
      timeframe: 'Within 1-2 weeks',
      explanation: 'This lab value requires medical attention and follow-up'
    }
  }

  useEffect(() => {
    fetchConcerns()
  }, [collectedOn])

  const renderConcern = (concern: Concern, index: number) => {
    const priorityColors = {
      urgent: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
      high: { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
      moderate: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' }
    }

    const colors = priorityColors[concern.priority]
    const priorityIcons = {
      urgent: <AlertTriangle className="h-5 w-5" style={{ color: colors.color }} />,
      high: <AlertTriangle className="h-5 w-5" style={{ color: colors.color }} />,
      moderate: <Clock className="h-5 w-5" style={{ color: colors.color }} />
    }

    return (
      <div 
        key={concern.testName}
        className="p-4 rounded-lg border-2"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {priorityIcons[concern.priority]}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold" style={{ color: colors.color }}>
                  #{index + 1}
                </span>
                <h4 className="font-semibold text-gray-900">{concern.testName}</h4>
              </div>
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium uppercase"
                style={{ color: colors.color, backgroundColor: 'white' }}
              >
                {concern.priority}
              </span>
            </div>

            {/* Current Value */}
            <div className="mb-3">
              <span className="text-lg font-bold" style={{ color: colors.color }}>
                {formatLabValue(concern.value, concern.units)}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                ({(concern.deviationScore * 100).toFixed(0)}% outside normal)
              </span>
            </div>

            {/* Concern Description */}
            <div className="mb-3">
              <h5 className="font-medium text-gray-900 mb-1">What this means:</h5>
              <p className="text-sm text-gray-700">{concern.explanation}</p>
            </div>

            {/* Action Needed */}
            <div className="mb-3">
              <h5 className="font-medium text-gray-900 mb-1">Action needed:</h5>
              <p className="text-sm text-gray-700">{concern.actionNeeded}</p>
            </div>

            {/* Timeframe */}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium" style={{ color: colors.color }}>
                {concern.timeframe}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <LabBaseWidget
      title="Top 3 Concerns"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchConcerns}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={
        concerns.length > 0 ? (
          <AlertTriangle className="h-5 w-5 text-red-600" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )
      }
      headerActions={
        concerns.length > 0 && (
          <div className="flex items-center space-x-1">
            {concerns.filter(c => c.priority === 'urgent').length > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                URGENT
              </span>
            )}
            <span className="text-sm text-gray-500">
              {concerns.length} concern{concerns.length !== 1 ? 's' : ''}
            </span>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {concerns.length > 0 ? (
          <>
            {/* Priority Summary */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <strong>Priority-ranked concerns</strong> based on medical significance and deviation from normal ranges
              </div>
            </div>

            {/* Concerns List */}
            <div className="space-y-4">
              {concerns.map(renderConcern)}
            </div>

            {/* Next Steps */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900 mb-1">Next Steps:</h5>
                  <p className="text-sm text-blue-700">
                    Contact your healthcare provider to discuss these results and create an action plan. 
                    Bring this summary to your appointment.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Major Concerns!</h3>
            <p className="text-gray-500">
              Your lab results don't show any values requiring immediate attention
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default Top3ConcernsWidget
