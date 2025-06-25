/**
 * Anemia Risk Widget - Issue #13 Widget #17
 * 
 * Anemia risk assessment based on Hemoglobin, Hematocrit, and RBC
 */

import React, { useState, useEffect } from 'react'
import { Heart, AlertTriangle, CheckCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, EnhancedLabResult, formatLabValue, getRiskLevelColor, getRiskLevelBackground } from './types'

interface AnemiaRiskWidgetProps extends LabWidgetProps {
  collectedOn?: string
}

const ANEMIA_TESTS = ['Hemoglobin', 'Hematocrit', 'RBC']

interface AnemiaAssessment {
  riskLevel: 'low' | 'moderate' | 'high' | 'severe'
  riskScore: number
  indicators: string[]
  recommendations: string[]
}

export const AnemiaRiskWidget: React.FC<AnemiaRiskWidgetProps> = ({
  collectedOn,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [anemiaData, setAnemiaData] = useState<EnhancedLabResult[]>([])
  const [assessment, setAssessment] = useState<AnemiaAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchAnemiaData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        enhanced: 'true',
        testNames: ANEMIA_TESTS.join(',')
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
        throw new Error(result.error || 'Failed to fetch anemia data')
      }

      setAnemiaData(result.data)
      
      // Calculate anemia risk assessment
      const anemiaAssessment = calculateAnemiaRisk(result.data)
      setAssessment(anemiaAssessment)
      
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate({ data: result.data, assessment: anemiaAssessment })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching anemia data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateAnemiaRisk = (data: EnhancedLabResult[]): AnemiaAssessment => {
    const hemoglobin = data.find(d => d.test_name === 'Hemoglobin')
    const hematocrit = data.find(d => d.test_name === 'Hematocrit')
    const rbc = data.find(d => d.test_name === 'RBC')

    let riskScore = 0
    const indicators: string[] = []
    const recommendations: string[] = []

    // Hemoglobin assessment
    if (hemoglobin?.numeric_value && hemoglobin.metric?.range_min) {
      const hgbValue = hemoglobin.numeric_value
      const hgbMin = hemoglobin.metric.range_min
      
      if (hgbValue < hgbMin * 0.7) {
        riskScore += 3
        indicators.push('Severely low hemoglobin')
      } else if (hgbValue < hgbMin * 0.85) {
        riskScore += 2
        indicators.push('Moderately low hemoglobin')
      } else if (hgbValue < hgbMin) {
        riskScore += 1
        indicators.push('Mildly low hemoglobin')
      }
    }

    // Hematocrit assessment
    if (hematocrit?.numeric_value && hematocrit.metric?.range_min) {
      const hctValue = hematocrit.numeric_value
      const hctMin = hematocrit.metric.range_min
      
      if (hctValue < hctMin * 0.7) {
        riskScore += 2
        indicators.push('Severely low hematocrit')
      } else if (hctValue < hctMin * 0.85) {
        riskScore += 1
        indicators.push('Low hematocrit')
      }
    }

    // RBC assessment
    if (rbc?.numeric_value && rbc.metric?.range_min) {
      const rbcValue = rbc.numeric_value
      const rbcMin = rbc.metric.range_min
      
      if (rbcValue < rbcMin * 0.8) {
        riskScore += 1
        indicators.push('Low red blood cell count')
      }
    }

    // Generate recommendations
    if (riskScore >= 4) {
      recommendations.push('Immediate medical evaluation recommended')
      recommendations.push('Consider iron studies and B12/folate levels')
      recommendations.push('Evaluate for underlying bleeding or chronic disease')
    } else if (riskScore >= 2) {
      recommendations.push('Follow up with healthcare provider')
      recommendations.push('Consider dietary iron supplementation')
      recommendations.push('Monitor symptoms of fatigue or weakness')
    } else if (riskScore >= 1) {
      recommendations.push('Monitor trends in future lab work')
      recommendations.push('Ensure adequate iron-rich foods in diet')
    } else {
      recommendations.push('Continue current health practices')
      recommendations.push('Regular monitoring as part of routine care')
    }

    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'severe'
    if (riskScore >= 4) riskLevel = 'severe'
    else if (riskScore >= 3) riskLevel = 'high'
    else if (riskScore >= 1) riskLevel = 'moderate'
    else riskLevel = 'low'

    return { riskLevel, riskScore, indicators, recommendations }
  }

  useEffect(() => {
    fetchAnemiaData()
  }, [collectedOn])

  const getRiskIcon = () => {
    if (!assessment) return <Heart className="h-5 w-5 text-gray-500" />
    
    switch (assessment.riskLevel) {
      case 'severe':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'moderate':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Heart className="h-5 w-5 text-gray-500" />
    }
  }

  const getRiskColor = () => {
    if (!assessment) return '#6B7280'
    
    switch (assessment.riskLevel) {
      case 'severe': return '#DC2626'
      case 'high': return '#EF4444'
      case 'moderate': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getRiskBackground = () => {
    if (!assessment) return '#F9FAFB'
    
    switch (assessment.riskLevel) {
      case 'severe': return '#FEF2F2'
      case 'high': return '#FEF2F2'
      case 'moderate': return '#FFFBEB'
      case 'low': return '#ECFDF5'
      default: return '#F9FAFB'
    }
  }

  return (
    <LabBaseWidget
      title="Anemia Risk Assessment"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchAnemiaData}
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
            {assessment.riskLevel} Risk
          </div>
        )
      }
    >
      {assessment && anemiaData.length > 0 && (
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
                Anemia Risk: {assessment.riskLevel.toUpperCase()}
              </h4>
              <div className="text-sm font-medium">
                Score: {assessment.riskScore}/6
              </div>
            </div>
            
            {assessment.indicators.length > 0 && (
              <div className="text-sm">
                <strong>Indicators:</strong>
                <ul className="list-disc list-inside mt-1">
                  {assessment.indicators.map((indicator, index) => (
                    <li key={index}>{indicator}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Lab Values */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Key Lab Values</h4>
            {anemiaData.map(result => (
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

          {/* Collection Date */}
          {anemiaData.length > 0 && anemiaData[0].collected_on && (
            <div className="text-sm text-gray-500 pt-2 border-t border-gray-100">
              Collected: {new Date(anemiaData[0].collected_on).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </LabBaseWidget>
  )
}

export default AnemiaRiskWidget
