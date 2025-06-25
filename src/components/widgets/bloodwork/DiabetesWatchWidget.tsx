/**
 * Diabetes Watch Widget - Issue #13 Widget #19
 * 
 * Diabetes risk monitoring based on glucose and related markers
 */

import React, { useState, useEffect } from 'react'
import { Zap, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue } from './types'

interface DiabetesWatchWidgetProps extends LabWidgetProps {
  collectedOn?: string
}

const DIABETES_TESTS = ['Glucose', 'HbA1c', 'Insulin']

interface DiabetesAssessment {
  riskLevel: 'normal' | 'prediabetes' | 'diabetes' | 'uncontrolled'
  category: string
  riskFactors: string[]
  recommendations: string[]
  nextSteps: string[]
}

export const DiabetesWatchWidget: React.FC<DiabetesWatchWidgetProps> = ({
  collectedOn,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [diabetesData, setDiabetesData] = useState<EnhancedLabResult[]>([])
  const [assessment, setAssessment] = useState<DiabetesAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchDiabetesData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        enhanced: 'true',
        testNames: DIABETES_TESTS.join(',')
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
        throw new Error(result.error || 'Failed to fetch diabetes data')
      }

      setDiabetesData(result.data)
      
      // Calculate diabetes risk assessment
      const diabetesAssessment = calculateDiabetesRisk(result.data)
      setAssessment(diabetesAssessment)
      
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate({ data: result.data, assessment: diabetesAssessment })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching diabetes data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateDiabetesRisk = (data: EnhancedLabResult[]): DiabetesAssessment => {
    const glucose = data.find(d => d.test_name === 'Glucose')
    const hba1c = data.find(d => d.test_name === 'HbA1c')
    const insulin = data.find(d => d.test_name === 'Insulin')

    const riskFactors: string[] = []
    const recommendations: string[] = []
    const nextSteps: string[] = []

    let riskLevel: 'normal' | 'prediabetes' | 'diabetes' | 'uncontrolled' = 'normal'
    let category = 'Normal glucose metabolism'

    // Fasting Glucose Assessment (assuming fasting)
    if (glucose?.numeric_value) {
      const glucoseValue = glucose.numeric_value
      
      if (glucoseValue >= 126) {
        riskLevel = 'diabetes'
        category = 'Diabetes (fasting glucose ≥126 mg/dL)'
        riskFactors.push('Fasting glucose in diabetic range')
        
        if (glucoseValue >= 200) {
          riskLevel = 'uncontrolled'
          category = 'Uncontrolled diabetes (glucose ≥200 mg/dL)'
          riskFactors.push('Severely elevated glucose')
        }
      } else if (glucoseValue >= 100) {
        riskLevel = 'prediabetes'
        category = 'Prediabetes (fasting glucose 100-125 mg/dL)'
        riskFactors.push('Impaired fasting glucose')
      } else {
        category = 'Normal fasting glucose (<100 mg/dL)'
      }
    }

    // HbA1c Assessment (if available)
    if (hba1c?.numeric_value) {
      const hba1cValue = hba1c.numeric_value
      
      if (hba1cValue >= 6.5) {
        if (riskLevel === 'normal' || riskLevel === 'prediabetes') {
          riskLevel = 'diabetes'
          category = 'Diabetes (HbA1c ≥6.5%)'
        }
        riskFactors.push('HbA1c in diabetic range')
        
        if (hba1cValue >= 9.0) {
          riskLevel = 'uncontrolled'
          category = 'Uncontrolled diabetes (HbA1c ≥9.0%)'
          riskFactors.push('Poor long-term glucose control')
        }
      } else if (hba1cValue >= 5.7) {
        if (riskLevel === 'normal') {
          riskLevel = 'prediabetes'
          category = 'Prediabetes (HbA1c 5.7-6.4%)'
        }
        riskFactors.push('Elevated HbA1c indicating prediabetes')
      }
    }

    // Insulin Assessment (if available)
    if (insulin?.numeric_value && insulin.metric?.range_max) {
      const insulinValue = insulin.numeric_value
      const insulinMax = insulin.metric.range_max
      
      if (insulinValue > insulinMax * 2) {
        riskFactors.push('Significantly elevated insulin (possible insulin resistance)')
      } else if (insulinValue > insulinMax) {
        riskFactors.push('Elevated insulin levels')
      }
    }

    // Generate recommendations based on risk level
    switch (riskLevel) {
      case 'uncontrolled':
        recommendations.push('Immediate medical attention required')
        recommendations.push('Review diabetes medications with endocrinologist')
        recommendations.push('Intensive glucose monitoring and lifestyle modifications')
        recommendations.push('Screen for diabetes complications')
        nextSteps.push('Emergency medical evaluation if glucose >400 mg/dL')
        nextSteps.push('Endocrinology referral within 1-2 weeks')
        break
        
      case 'diabetes':
        recommendations.push('Confirm diagnosis with repeat testing')
        recommendations.push('Begin diabetes management plan')
        recommendations.push('Lifestyle modifications: diet and exercise')
        recommendations.push('Consider metformin or other diabetes medications')
        nextSteps.push('Follow up with primary care within 1 week')
        nextSteps.push('Diabetes education and nutritionist consultation')
        break
        
      case 'prediabetes':
        recommendations.push('Intensive lifestyle intervention program')
        recommendations.push('Weight loss of 5-10% if overweight')
        recommendations.push('150 minutes moderate exercise per week')
        recommendations.push('Low-carbohydrate or Mediterranean diet')
        nextSteps.push('Repeat testing in 3-6 months')
        nextSteps.push('Consider diabetes prevention program')
        break
        
      case 'normal':
        recommendations.push('Continue healthy lifestyle practices')
        recommendations.push('Maintain healthy weight and regular exercise')
        recommendations.push('Balanced diet with limited refined sugars')
        nextSteps.push('Routine screening every 1-3 years')
        nextSteps.push('Monitor if family history of diabetes')
        break
    }

    return { riskLevel, category, riskFactors, recommendations, nextSteps }
  }

  useEffect(() => {
    fetchDiabetesData()
  }, [collectedOn])

  const getRiskIcon = () => {
    if (!assessment) return <Zap className="h-5 w-5 text-gray-500" />
    
    switch (assessment.riskLevel) {
      case 'uncontrolled':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'diabetes':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'prediabetes':
        return <TrendingUp className="h-5 w-5 text-yellow-500" />
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Zap className="h-5 w-5 text-gray-500" />
    }
  }

  const getRiskColor = () => {
    if (!assessment) return '#6B7280'
    
    switch (assessment.riskLevel) {
      case 'uncontrolled': return '#DC2626'
      case 'diabetes': return '#EF4444'
      case 'prediabetes': return '#F59E0B'
      case 'normal': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getRiskBackground = () => {
    if (!assessment) return '#F9FAFB'
    
    switch (assessment.riskLevel) {
      case 'uncontrolled': return '#FEF2F2'
      case 'diabetes': return '#FEF2F2'
      case 'prediabetes': return '#FFFBEB'
      case 'normal': return '#ECFDF5'
      default: return '#F9FAFB'
    }
  }

  return (
    <LabBaseWidget
      title="Diabetes Watch"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchDiabetesData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={getRiskIcon()}
      headerActions={
        assessment && (
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium capitalize"
            style={{ 
              color: getRiskColor(), 
              backgroundColor: getRiskBackground() 
            }}
          >
            {assessment.riskLevel.replace('-', ' ')}
          </div>
        )
      }
    >
      {assessment && diabetesData.length > 0 && (
        <div className="space-y-4">
          {/* Status Summary */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              borderColor: getRiskColor(), 
              backgroundColor: getRiskBackground() 
            }}
          >
            <h4 className="font-semibold mb-1" style={{ color: getRiskColor() }}>
              {assessment.category}
            </h4>
            <div className="text-sm">
              Status: {assessment.riskLevel.toUpperCase()}
            </div>
          </div>

          {/* Lab Values */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Glucose Markers</h4>
            {diabetesData.map(result => (
              <div key={result.test_name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="font-medium">{result.test_name}</div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatLabValue(result.value, result.metric?.units)}
                  </div>
                  {result.metric?.range_min && result.metric?.range_max && (
                    <div className="text-xs text-gray-500">
                      Normal: {formatLabValue(result.metric.range_min, result.metric.units)} - {formatLabValue(result.metric.range_max, result.metric.units)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Risk Factors */}
          {assessment.riskFactors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-700">Risk Factors</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {assessment.riskFactors.map((factor, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">⚠</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Recommendations</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {assessment.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Next Steps</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {assessment.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">→</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </LabBaseWidget>
  )
}

export default DiabetesWatchWidget
