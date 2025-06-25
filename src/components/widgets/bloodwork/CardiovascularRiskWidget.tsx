/**
 * Cardiovascular Risk Widget - Issue #13 Widget #18
 * 
 * Cardiovascular risk assessment based on lipid panel and other markers
 */

import React, { useState, useEffect } from 'react'
import { Heart, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue } from './types'

interface CardiovascularRiskWidgetProps extends LabWidgetProps {
  collectedOn?: string
}

const CV_RISK_TESTS = [
  'Total Cholesterol',
  'LDL Cholesterol', 
  'HDL Cholesterol',
  'Triglycerides',
  'Cholesterol/HDL Ratio'
]

interface CVRiskAssessment {
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high'
  riskScore: number
  riskFactors: string[]
  protectiveFactors: string[]
  recommendations: string[]
  estimatedRisk: string
}

export const CardiovascularRiskWidget: React.FC<CardiovascularRiskWidgetProps> = ({
  collectedOn,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [cvData, setCvData] = useState<EnhancedLabResult[]>([])
  const [assessment, setAssessment] = useState<CVRiskAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchCVData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        enhanced: 'true',
        testNames: CV_RISK_TESTS.join(',')
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
        throw new Error(result.error || 'Failed to fetch cardiovascular data')
      }

      setCvData(result.data)
      
      // Calculate CV risk assessment
      const cvAssessment = calculateCVRisk(result.data)
      setAssessment(cvAssessment)
      
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate({ data: result.data, assessment: cvAssessment })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching CV data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCVRisk = (data: EnhancedLabResult[]): CVRiskAssessment => {
    const totalChol = data.find(d => d.test_name === 'Total Cholesterol')
    const ldl = data.find(d => d.test_name === 'LDL Cholesterol')
    const hdl = data.find(d => d.test_name === 'HDL Cholesterol')
    const triglycerides = data.find(d => d.test_name === 'Triglycerides')
    const cholHdlRatio = data.find(d => d.test_name === 'Cholesterol/HDL Ratio')

    let riskScore = 0
    const riskFactors: string[] = []
    const protectiveFactors: string[] = []
    const recommendations: string[] = []

    // LDL Cholesterol assessment (primary risk factor)
    if (ldl?.numeric_value) {
      const ldlValue = ldl.numeric_value
      if (ldlValue >= 190) {
        riskScore += 4
        riskFactors.push('Very high LDL cholesterol (≥190 mg/dL)')
      } else if (ldlValue >= 160) {
        riskScore += 3
        riskFactors.push('High LDL cholesterol (160-189 mg/dL)')
      } else if (ldlValue >= 130) {
        riskScore += 2
        riskFactors.push('Borderline high LDL cholesterol (130-159 mg/dL)')
      } else if (ldlValue >= 100) {
        riskScore += 1
        riskFactors.push('Near optimal LDL cholesterol (100-129 mg/dL)')
      } else {
        protectiveFactors.push('Optimal LDL cholesterol (<100 mg/dL)')
      }
    }

    // HDL Cholesterol assessment (protective factor)
    if (hdl?.numeric_value) {
      const hdlValue = hdl.numeric_value
      if (hdlValue < 40) {
        riskScore += 2
        riskFactors.push('Low HDL cholesterol (<40 mg/dL)')
      } else if (hdlValue >= 60) {
        riskScore -= 1
        protectiveFactors.push('High HDL cholesterol (≥60 mg/dL)')
      } else {
        protectiveFactors.push('Normal HDL cholesterol (40-59 mg/dL)')
      }
    }

    // Triglycerides assessment
    if (triglycerides?.numeric_value) {
      const trigValue = triglycerides.numeric_value
      if (trigValue >= 500) {
        riskScore += 3
        riskFactors.push('Very high triglycerides (≥500 mg/dL)')
      } else if (trigValue >= 200) {
        riskScore += 2
        riskFactors.push('High triglycerides (200-499 mg/dL)')
      } else if (trigValue >= 150) {
        riskScore += 1
        riskFactors.push('Borderline high triglycerides (150-199 mg/dL)')
      } else {
        protectiveFactors.push('Normal triglycerides (<150 mg/dL)')
      }
    }

    // Total Cholesterol/HDL Ratio
    if (cholHdlRatio?.numeric_value) {
      const ratioValue = cholHdlRatio.numeric_value
      if (ratioValue >= 5.0) {
        riskScore += 2
        riskFactors.push('High cholesterol/HDL ratio (≥5.0)')
      } else if (ratioValue >= 4.0) {
        riskScore += 1
        riskFactors.push('Elevated cholesterol/HDL ratio (4.0-4.9)')
      } else {
        protectiveFactors.push('Good cholesterol/HDL ratio (<4.0)')
      }
    }

    // Generate recommendations based on risk score
    if (riskScore >= 6) {
      recommendations.push('Immediate cardiology consultation recommended')
      recommendations.push('Consider statin therapy and lifestyle modifications')
      recommendations.push('Aggressive dietary changes and exercise program')
      recommendations.push('Monitor blood pressure and diabetes risk')
    } else if (riskScore >= 4) {
      recommendations.push('Discuss with healthcare provider about statin therapy')
      recommendations.push('Implement heart-healthy diet (Mediterranean or DASH)')
      recommendations.push('Regular aerobic exercise (150 min/week)')
      recommendations.push('Consider additional cardiac risk factors')
    } else if (riskScore >= 2) {
      recommendations.push('Focus on lifestyle modifications')
      recommendations.push('Reduce saturated fat and trans fat intake')
      recommendations.push('Increase physical activity and maintain healthy weight')
      recommendations.push('Monitor lipid levels every 6-12 months')
    } else {
      recommendations.push('Continue current healthy lifestyle practices')
      recommendations.push('Maintain regular exercise and balanced diet')
      recommendations.push('Routine lipid monitoring every 1-2 years')
    }

    // Determine risk level and estimated risk
    let riskLevel: 'low' | 'moderate' | 'high' | 'very-high'
    let estimatedRisk: string

    if (riskScore >= 6) {
      riskLevel = 'very-high'
      estimatedRisk = '>20% 10-year risk'
    } else if (riskScore >= 4) {
      riskLevel = 'high'
      estimatedRisk = '10-20% 10-year risk'
    } else if (riskScore >= 2) {
      riskLevel = 'moderate'
      estimatedRisk = '5-10% 10-year risk'
    } else {
      riskLevel = 'low'
      estimatedRisk = '<5% 10-year risk'
    }

    return { 
      riskLevel, 
      riskScore: Math.max(0, riskScore), 
      riskFactors, 
      protectiveFactors, 
      recommendations, 
      estimatedRisk 
    }
  }

  useEffect(() => {
    fetchCVData()
  }, [collectedOn])

  const getRiskIcon = () => {
    if (!assessment) return <Heart className="h-5 w-5 text-gray-500" />
    
    switch (assessment.riskLevel) {
      case 'very-high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'moderate':
        return <TrendingUp className="h-5 w-5 text-yellow-500" />
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Heart className="h-5 w-5 text-gray-500" />
    }
  }

  const getRiskColor = () => {
    if (!assessment) return '#6B7280'
    
    switch (assessment.riskLevel) {
      case 'very-high': return '#DC2626'
      case 'high': return '#EF4444'
      case 'moderate': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getRiskBackground = () => {
    if (!assessment) return '#F9FAFB'
    
    switch (assessment.riskLevel) {
      case 'very-high': return '#FEF2F2'
      case 'high': return '#FEF2F2'
      case 'moderate': return '#FFFBEB'
      case 'low': return '#ECFDF5'
      default: return '#F9FAFB'
    }
  }

  return (
    <LabBaseWidget
      title="Cardiovascular Risk"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchCVData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={getRiskIcon()}
      headerActions={
        assessment && (
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ 
              color: getRiskColor(), 
              backgroundColor: getRiskBackground() 
            }}
          >
            {assessment.riskLevel.replace('-', ' ').toUpperCase()} RISK
          </div>
        )
      }
    >
      {assessment && cvData.length > 0 && (
        <div className="space-y-4">
          {/* Risk Summary */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              borderColor: getRiskColor(), 
              backgroundColor: getRiskBackground() 
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold" style={{ color: getRiskColor() }}>
                CV Risk: {assessment.riskLevel.replace('-', ' ').toUpperCase()}
              </h4>
              <div className="text-sm font-medium">
                {assessment.estimatedRisk}
              </div>
            </div>
            <div className="text-sm">
              Risk Score: {assessment.riskScore}/10
            </div>
          </div>

          {/* Lab Values */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Lipid Panel</h4>
            {cvData.map(result => (
              <div key={result.test_name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="font-medium">{result.test_name}</div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatLabValue(result.value, result.metric?.units)}
                  </div>
                  {result.metric?.range_min && result.metric?.range_max && (
                    <div className="text-xs text-gray-500">
                      Target: {formatLabValue(result.metric.range_min, result.metric.units)} - {formatLabValue(result.metric.range_max, result.metric.units)}
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

          {/* Protective Factors */}
          {assessment.protectiveFactors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">Protective Factors</h4>
              <ul className="text-sm text-green-600 space-y-1">
                {assessment.protectiveFactors.map((factor, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
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
        </div>
      )}
    </LabBaseWidget>
  )
}

export default CardiovascularRiskWidget
