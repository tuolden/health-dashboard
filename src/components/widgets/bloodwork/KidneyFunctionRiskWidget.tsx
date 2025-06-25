/**
 * Kidney Function Risk Widget - Issue #13 Widget #22
 * 
 * Kidney function risk assessment based on creatinine, eGFR, and BUN
 */

import React, { useState, useEffect } from 'react'
import { Droplets, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue } from './types'

interface KidneyFunctionRiskWidgetProps extends LabWidgetProps {
  collectedOn?: string
}

const KIDNEY_TESTS = ['Creatinine', 'eGFR', 'BUN', 'BUN/Creatinine Ratio']

interface KidneyAssessment {
  riskLevel: 'normal' | 'mild' | 'moderate' | 'severe' | 'kidney-failure'
  stage: string
  riskFactors: string[]
  recommendations: string[]
  egfrValue?: number
}

export const KidneyFunctionRiskWidget: React.FC<KidneyFunctionRiskWidgetProps> = ({
  collectedOn,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [kidneyData, setKidneyData] = useState<EnhancedLabResult[]>([])
  const [assessment, setAssessment] = useState<KidneyAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchKidneyData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        enhanced: 'true',
        testNames: KIDNEY_TESTS.join(',')
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
        throw new Error(result.error || 'Failed to fetch kidney data')
      }

      setKidneyData(result.data)
      
      // Calculate kidney function assessment
      const kidneyAssessment = calculateKidneyRisk(result.data)
      setAssessment(kidneyAssessment)
      
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate({ data: result.data, assessment: kidneyAssessment })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching kidney data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateKidneyRisk = (data: EnhancedLabResult[]): KidneyAssessment => {
    const creatinine = data.find(d => d.test_name === 'Creatinine')
    const egfr = data.find(d => d.test_name === 'eGFR')
    const bun = data.find(d => d.test_name === 'BUN')
    const bunCreatRatio = data.find(d => d.test_name === 'BUN/Creatinine Ratio')

    const riskFactors: string[] = []
    const recommendations: string[] = []
    let riskLevel: 'normal' | 'mild' | 'moderate' | 'severe' | 'kidney-failure' = 'normal'
    let stage = 'Normal kidney function'
    let egfrValue: number | undefined

    // eGFR Assessment (primary indicator)
    if (egfr?.numeric_value) {
      egfrValue = egfr.numeric_value
      
      if (egfrValue < 15) {
        riskLevel = 'kidney-failure'
        stage = 'Stage 5 CKD (Kidney Failure)'
        riskFactors.push('Severe kidney failure (eGFR <15)')
      } else if (egfrValue < 30) {
        riskLevel = 'severe'
        stage = 'Stage 4 CKD (Severe)'
        riskFactors.push('Severely decreased kidney function (eGFR 15-29)')
      } else if (egfrValue < 45) {
        riskLevel = 'moderate'
        stage = 'Stage 3b CKD (Moderate-Severe)'
        riskFactors.push('Moderately to severely decreased function (eGFR 30-44)')
      } else if (egfrValue < 60) {
        riskLevel = 'mild'
        stage = 'Stage 3a CKD (Mild-Moderate)'
        riskFactors.push('Mildly to moderately decreased function (eGFR 45-59)')
      } else if (egfrValue < 90) {
        stage = 'Stage 2 CKD (Mild with damage) or Normal'
        // Only concerning if other markers present
      } else {
        stage = 'Stage 1 (Normal or High)'
      }
    }

    // Creatinine Assessment
    if (creatinine?.numeric_value && creatinine.metric?.range_max) {
      const creatValue = creatinine.numeric_value
      const creatMax = creatinine.metric.range_max
      
      if (creatValue > creatMax * 3) {
        riskFactors.push('Severely elevated creatinine (>3x normal)')
        if (riskLevel === 'normal') riskLevel = 'severe'
      } else if (creatValue > creatMax * 2) {
        riskFactors.push('Significantly elevated creatinine (2-3x normal)')
        if (riskLevel === 'normal') riskLevel = 'moderate'
      } else if (creatValue > creatMax) {
        riskFactors.push('Elevated creatinine')
        if (riskLevel === 'normal') riskLevel = 'mild'
      }
    }

    // BUN Assessment
    if (bun?.numeric_value && bun.metric?.range_max) {
      const bunValue = bun.numeric_value
      const bunMax = bun.metric.range_max
      
      if (bunValue > bunMax * 2) {
        riskFactors.push('Significantly elevated BUN')
      } else if (bunValue > bunMax) {
        riskFactors.push('Elevated BUN')
      }
    }

    // BUN/Creatinine Ratio Assessment
    if (bunCreatRatio?.numeric_value) {
      const ratioValue = bunCreatRatio.numeric_value
      
      if (ratioValue > 25) {
        riskFactors.push('High BUN/Creatinine ratio (suggests dehydration or prerenal cause)')
      } else if (ratioValue < 10) {
        riskFactors.push('Low BUN/Creatinine ratio (suggests liver disease or malnutrition)')
      }
    }

    // Generate recommendations based on risk level
    switch (riskLevel) {
      case 'kidney-failure':
        recommendations.push('Immediate nephrology consultation required')
        recommendations.push('Prepare for renal replacement therapy (dialysis/transplant)')
        recommendations.push('Strict dietary restrictions and medication adjustments')
        recommendations.push('Monitor for uremic complications')
        break
        
      case 'severe':
        recommendations.push('Urgent nephrology referral within 1-2 weeks')
        recommendations.push('Avoid nephrotoxic medications (NSAIDs, contrast)')
        recommendations.push('Monitor electrolytes and bone metabolism')
        recommendations.push('Consider cardiovascular risk reduction')
        break
        
      case 'moderate':
        recommendations.push('Nephrology consultation within 1 month')
        recommendations.push('Blood pressure control (<130/80)')
        recommendations.push('Diabetes management if present')
        recommendations.push('Monitor progression every 3-6 months')
        break
        
      case 'mild':
        recommendations.push('Follow up with primary care provider')
        recommendations.push('Address modifiable risk factors')
        recommendations.push('Annual monitoring of kidney function')
        recommendations.push('Maintain adequate hydration')
        break
        
      case 'normal':
        recommendations.push('Continue healthy lifestyle practices')
        recommendations.push('Stay well hydrated')
        recommendations.push('Routine monitoring as part of regular care')
        recommendations.push('Avoid excessive protein intake')
        break
    }

    return { 
      riskLevel, 
      stage, 
      riskFactors, 
      recommendations, 
      egfrValue 
    }
  }

  useEffect(() => {
    fetchKidneyData()
  }, [collectedOn])

  const getRiskIcon = () => {
    if (!assessment) return <Droplets className="h-5 w-5 text-gray-500" />
    
    switch (assessment.riskLevel) {
      case 'kidney-failure':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'severe':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'moderate':
        return <TrendingDown className="h-5 w-5 text-yellow-500" />
      case 'mild':
        return <TrendingDown className="h-5 w-5 text-yellow-400" />
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Droplets className="h-5 w-5 text-gray-500" />
    }
  }

  const getRiskColor = () => {
    if (!assessment) return '#6B7280'
    
    switch (assessment.riskLevel) {
      case 'kidney-failure': return '#DC2626'
      case 'severe': return '#EF4444'
      case 'moderate': return '#F59E0B'
      case 'mild': return '#FCD34D'
      case 'normal': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getRiskBackground = () => {
    if (!assessment) return '#F9FAFB'
    
    switch (assessment.riskLevel) {
      case 'kidney-failure': return '#FEF2F2'
      case 'severe': return '#FEF2F2'
      case 'moderate': return '#FFFBEB'
      case 'mild': return '#FFFBEB'
      case 'normal': return '#ECFDF5'
      default: return '#F9FAFB'
    }
  }

  return (
    <LabBaseWidget
      title="Kidney Function Risk"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchKidneyData}
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
            {assessment.riskLevel.replace('-', ' ').toUpperCase()}
          </div>
        )
      }
    >
      {assessment && kidneyData.length > 0 && (
        <div className="space-y-4">
          {/* Risk Summary */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              borderColor: getRiskColor(), 
              backgroundColor: getRiskBackground() 
            }}
          >
            <h4 className="font-semibold mb-1" style={{ color: getRiskColor() }}>
              {assessment.stage}
            </h4>
            {assessment.egfrValue && (
              <div className="text-sm">
                eGFR: {assessment.egfrValue} mL/min/1.73m²
              </div>
            )}
          </div>

          {/* Lab Values */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Kidney Function Tests</h4>
            {kidneyData.map(result => (
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

          {/* CKD Stages Reference */}
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              <strong>CKD Stages:</strong> Stage 1 (≥90), Stage 2 (60-89), Stage 3a (45-59), Stage 3b (30-44), Stage 4 (15-29), Stage 5 (&lt;15) eGFR mL/min/1.73m²
            </div>
          </div>
        </div>
      )}
    </LabBaseWidget>
  )
}

export default KidneyFunctionRiskWidget
