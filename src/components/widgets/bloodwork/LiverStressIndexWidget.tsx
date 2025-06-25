/**
 * Liver Stress Index Widget - Issue #13 Widget #20
 * 
 * Liver stress assessment based on enzyme levels and ratios
 */

import React, { useState, useEffect } from 'react'
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue } from './types'

interface LiverStressIndexWidgetProps extends LabWidgetProps {
  collectedOn?: string
}

const LIVER_TESTS = ['AST', 'ALT', 'Alkaline Phosphatase', 'Bilirubin Total', 'GGT']

interface LiverAssessment {
  stressLevel: 'normal' | 'mild' | 'moderate' | 'severe'
  stressScore: number
  indicators: string[]
  possibleCauses: string[]
  recommendations: string[]
  astAltRatio?: number
}

export const LiverStressIndexWidget: React.FC<LiverStressIndexWidgetProps> = ({
  collectedOn,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [liverData, setLiverData] = useState<EnhancedLabResult[]>([])
  const [assessment, setAssessment] = useState<LiverAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchLiverData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        enhanced: 'true',
        testNames: LIVER_TESTS.join(',')
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
        throw new Error(result.error || 'Failed to fetch liver data')
      }

      setLiverData(result.data)
      
      // Calculate liver stress assessment
      const liverAssessment = calculateLiverStress(result.data)
      setAssessment(liverAssessment)
      
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate({ data: result.data, assessment: liverAssessment })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching liver data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateLiverStress = (data: EnhancedLabResult[]): LiverAssessment => {
    const ast = data.find(d => d.test_name === 'AST')
    const alt = data.find(d => d.test_name === 'ALT')
    const alkPhos = data.find(d => d.test_name === 'Alkaline Phosphatase')
    const bilirubin = data.find(d => d.test_name === 'Bilirubin Total')
    const ggt = data.find(d => d.test_name === 'GGT')

    let stressScore = 0
    const indicators: string[] = []
    const possibleCauses: string[] = []
    const recommendations: string[] = []
    let astAltRatio: number | undefined

    // AST Assessment
    if (ast?.numeric_value && ast.metric?.range_max) {
      const astValue = ast.numeric_value
      const astMax = ast.metric.range_max
      const astRatio = astValue / astMax
      
      if (astRatio >= 3) {
        stressScore += 3
        indicators.push('Severely elevated AST (>3x normal)')
      } else if (astRatio >= 2) {
        stressScore += 2
        indicators.push('Moderately elevated AST (2-3x normal)')
      } else if (astRatio > 1) {
        stressScore += 1
        indicators.push('Mildly elevated AST')
      }
    }

    // ALT Assessment
    if (alt?.numeric_value && alt.metric?.range_max) {
      const altValue = alt.numeric_value
      const altMax = alt.metric.range_max
      const altRatio = altValue / altMax
      
      if (altRatio >= 3) {
        stressScore += 3
        indicators.push('Severely elevated ALT (>3x normal)')
      } else if (altRatio >= 2) {
        stressScore += 2
        indicators.push('Moderately elevated ALT (2-3x normal)')
      } else if (altRatio > 1) {
        stressScore += 1
        indicators.push('Mildly elevated ALT')
      }
    }

    // AST/ALT Ratio Analysis
    if (ast?.numeric_value && alt?.numeric_value) {
      astAltRatio = ast.numeric_value / alt.numeric_value
      
      if (astAltRatio >= 2) {
        indicators.push('High AST/ALT ratio (≥2.0) - suggests alcohol-related liver injury')
        possibleCauses.push('Alcohol-related liver damage')
        possibleCauses.push('Cirrhosis or advanced liver disease')
      } else if (astAltRatio < 1) {
        indicators.push('Low AST/ALT ratio (<1.0) - suggests viral or drug-induced hepatitis')
        possibleCauses.push('Viral hepatitis')
        possibleCauses.push('Drug-induced liver injury')
        possibleCauses.push('Non-alcoholic fatty liver disease')
      }
    }

    // Alkaline Phosphatase Assessment
    if (alkPhos?.numeric_value && alkPhos.metric?.range_max) {
      const alkPhosValue = alkPhos.numeric_value
      const alkPhosMax = alkPhos.metric.range_max
      const alkPhosRatio = alkPhosValue / alkPhosMax
      
      if (alkPhosRatio >= 2) {
        stressScore += 2
        indicators.push('Significantly elevated alkaline phosphatase')
        possibleCauses.push('Bile duct obstruction')
        possibleCauses.push('Cholestatic liver disease')
      } else if (alkPhosRatio > 1) {
        stressScore += 1
        indicators.push('Elevated alkaline phosphatase')
      }
    }

    // Bilirubin Assessment
    if (bilirubin?.numeric_value && bilirubin.metric?.range_max) {
      const bilirubinValue = bilirubin.numeric_value
      const bilirubinMax = bilirubin.metric.range_max
      const bilirubinRatio = bilirubinValue / bilirubinMax
      
      if (bilirubinRatio >= 3) {
        stressScore += 3
        indicators.push('Severely elevated bilirubin (jaundice likely)')
        possibleCauses.push('Severe liver dysfunction')
        possibleCauses.push('Bile duct obstruction')
      } else if (bilirubinRatio >= 2) {
        stressScore += 2
        indicators.push('Moderately elevated bilirubin')
      } else if (bilirubinRatio > 1) {
        stressScore += 1
        indicators.push('Mildly elevated bilirubin')
      }
    }

    // GGT Assessment
    if (ggt?.numeric_value && ggt.metric?.range_max) {
      const ggtValue = ggt.numeric_value
      const ggtMax = ggt.metric.range_max
      const ggtRatio = ggtValue / ggtMax
      
      if (ggtRatio >= 3) {
        stressScore += 2
        indicators.push('Significantly elevated GGT')
        possibleCauses.push('Alcohol use')
        possibleCauses.push('Medication-induced liver injury')
      } else if (ggtRatio > 1) {
        stressScore += 1
        indicators.push('Elevated GGT')
      }
    }

    // Add common possible causes if no specific pattern identified
    if (possibleCauses.length === 0 && stressScore > 0) {
      possibleCauses.push('Medication side effects')
      possibleCauses.push('Fatty liver disease')
      possibleCauses.push('Viral hepatitis')
      possibleCauses.push('Autoimmune liver disease')
    }

    // Generate recommendations based on stress level
    let stressLevel: 'normal' | 'mild' | 'moderate' | 'severe'
    
    if (stressScore >= 6) {
      stressLevel = 'severe'
      recommendations.push('Immediate hepatology consultation required')
      recommendations.push('Discontinue potentially hepatotoxic medications')
      recommendations.push('Complete hepatitis panel and autoimmune markers')
      recommendations.push('Consider liver imaging (ultrasound or CT)')
    } else if (stressScore >= 4) {
      stressLevel = 'moderate'
      recommendations.push('Gastroenterology or hepatology referral')
      recommendations.push('Review all medications and supplements')
      recommendations.push('Hepatitis B and C screening')
      recommendations.push('Repeat liver function tests in 2-4 weeks')
    } else if (stressScore >= 2) {
      stressLevel = 'mild'
      recommendations.push('Follow up with primary care provider')
      recommendations.push('Review alcohol consumption and medications')
      recommendations.push('Consider weight loss if overweight')
      recommendations.push('Repeat tests in 4-8 weeks')
    } else {
      stressLevel = 'normal'
      recommendations.push('Continue healthy lifestyle practices')
      recommendations.push('Limit alcohol consumption')
      recommendations.push('Maintain healthy weight')
      recommendations.push('Routine monitoring as part of regular care')
    }

    return { 
      stressLevel, 
      stressScore, 
      indicators, 
      possibleCauses, 
      recommendations, 
      astAltRatio 
    }
  }

  useEffect(() => {
    fetchLiverData()
  }, [collectedOn])

  const getStressIcon = () => {
    if (!assessment) return <Activity className="h-5 w-5 text-gray-500" />
    
    switch (assessment.stressLevel) {
      case 'severe':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'moderate':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'mild':
        return <TrendingUp className="h-5 w-5 text-yellow-500" />
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStressColor = () => {
    if (!assessment) return '#6B7280'
    
    switch (assessment.stressLevel) {
      case 'severe': return '#DC2626'
      case 'moderate': return '#EF4444'
      case 'mild': return '#F59E0B'
      case 'normal': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getStressBackground = () => {
    if (!assessment) return '#F9FAFB'
    
    switch (assessment.stressLevel) {
      case 'severe': return '#FEF2F2'
      case 'moderate': return '#FEF2F2'
      case 'mild': return '#FFFBEB'
      case 'normal': return '#ECFDF5'
      default: return '#F9FAFB'
    }
  }

  return (
    <LabBaseWidget
      title="Liver Stress Index"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchLiverData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={getStressIcon()}
      headerActions={
        assessment && (
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium capitalize"
            style={{ 
              color: getStressColor(), 
              backgroundColor: getStressBackground() 
            }}
          >
            {assessment.stressLevel} Stress
          </div>
        )
      }
    >
      {assessment && liverData.length > 0 && (
        <div className="space-y-4">
          {/* Stress Summary */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              borderColor: getStressColor(), 
              backgroundColor: getStressBackground() 
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold" style={{ color: getStressColor() }}>
                Liver Stress: {assessment.stressLevel.toUpperCase()}
              </h4>
              <div className="text-sm font-medium">
                Score: {assessment.stressScore}/12
              </div>
            </div>
            
            {assessment.astAltRatio && (
              <div className="text-sm">
                AST/ALT Ratio: {assessment.astAltRatio.toFixed(2)}
              </div>
            )}
          </div>

          {/* Lab Values */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Liver Function Tests</h4>
            {liverData.map(result => (
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

          {/* Indicators */}
          {assessment.indicators.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-700">Stress Indicators</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {assessment.indicators.map((indicator, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">⚠</span>
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Possible Causes */}
          {assessment.possibleCauses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Possible Causes</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {assessment.possibleCauses.map((cause, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-yellow-500 mt-1">?</span>
                    <span>{cause}</span>
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

export default LiverStressIndexWidget
