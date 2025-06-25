/**
 * Lab Genetic Risk Widget - Issue #13 Widget #45
 * 
 * Genetic risk assessment based on lab values and known genetic markers
 */

import React, { useState, useEffect } from 'react'
import { Dna, AlertTriangle, Shield, Info } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps } from './types'

interface LabGeneticRiskWidgetProps extends LabWidgetProps {
  includePolygenic?: boolean
}

interface GeneticRisk {
  condition: string
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high'
  riskScore: number // 0-100
  populationPercentile: number
  associatedMarkers: GeneticMarker[]
  labIndicators: LabIndicator[]
  recommendations: string[]
  confidence: number
}

interface GeneticMarker {
  gene: string
  variant: string
  effect: string
  frequency: number
  impact: 'high' | 'moderate' | 'low'
}

interface LabIndicator {
  testName: string
  currentValue: number
  riskThreshold: number
  units: string
  contribution: number // percentage contribution to risk
}

export const LabGeneticRiskWidget: React.FC<LabGeneticRiskWidgetProps> = ({
  includePolygenic = true,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [geneticRisks, setGeneticRisks] = useState<GeneticRisk[]>([])
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchGeneticRisks = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/labs/genetic-risk?includePolygenic=${includePolygenic}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch genetic risk data')
      }

      const processedRisks = processGeneticRiskData(result.data)
      setGeneticRisks(processedRisks)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(processedRisks)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching genetic risks:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processGeneticRiskData = (data: any): GeneticRisk[] => {
    // Mock genetic risk data - in real implementation, this would process actual genetic and lab data
    const mockRisks: GeneticRisk[] = [
      {
        condition: 'Type 2 Diabetes',
        riskLevel: 'moderate',
        riskScore: 65,
        populationPercentile: 75,
        confidence: 0.85,
        associatedMarkers: [
          {
            gene: 'TCF7L2',
            variant: 'rs7903146',
            effect: 'Increased insulin resistance',
            frequency: 0.28,
            impact: 'high'
          },
          {
            gene: 'PPARG',
            variant: 'rs1801282',
            effect: 'Altered glucose metabolism',
            frequency: 0.12,
            impact: 'moderate'
          }
        ],
        labIndicators: [
          {
            testName: 'Fasting Glucose',
            currentValue: 98,
            riskThreshold: 100,
            units: 'mg/dL',
            contribution: 35
          },
          {
            testName: 'HbA1c',
            currentValue: 5.8,
            riskThreshold: 5.7,
            units: '%',
            contribution: 40
          },
          {
            testName: 'HOMA-IR',
            currentValue: 2.1,
            riskThreshold: 2.5,
            units: 'index',
            contribution: 25
          }
        ],
        recommendations: [
          'Maintain healthy weight and regular exercise',
          'Follow low glycemic index diet',
          'Monitor blood glucose quarterly',
          'Consider metformin if pre-diabetic',
          'Regular cardiovascular screening'
        ]
      },
      {
        condition: 'Cardiovascular Disease',
        riskLevel: 'high',
        riskScore: 78,
        populationPercentile: 85,
        confidence: 0.92,
        associatedMarkers: [
          {
            gene: 'APOE',
            variant: 'ε4/ε4',
            effect: 'Increased cholesterol levels',
            frequency: 0.02,
            impact: 'high'
          },
          {
            gene: 'LPA',
            variant: 'rs10455872',
            effect: 'Elevated Lp(a) levels',
            frequency: 0.20,
            impact: 'high'
          }
        ],
        labIndicators: [
          {
            testName: 'LDL Cholesterol',
            currentValue: 145,
            riskThreshold: 130,
            units: 'mg/dL',
            contribution: 30
          },
          {
            testName: 'Lipoprotein(a)',
            currentValue: 85,
            riskThreshold: 50,
            units: 'mg/dL',
            contribution: 35
          },
          {
            testName: 'CRP',
            currentValue: 2.8,
            riskThreshold: 3.0,
            units: 'mg/L',
            contribution: 20
          },
          {
            testName: 'Homocysteine',
            currentValue: 12,
            riskThreshold: 10,
            units: 'μmol/L',
            contribution: 15
          }
        ],
        recommendations: [
          'Aggressive lipid management with statins',
          'Consider PCSK9 inhibitors for Lp(a)',
          'Mediterranean diet with omega-3 supplementation',
          'Regular cardio exercise 5x/week',
          'Blood pressure monitoring',
          'Aspirin therapy (consult physician)'
        ]
      },
      {
        condition: 'Alzheimer\'s Disease',
        riskLevel: 'moderate',
        riskScore: 58,
        populationPercentile: 68,
        confidence: 0.78,
        associatedMarkers: [
          {
            gene: 'APOE',
            variant: 'ε3/ε4',
            effect: 'Increased amyloid accumulation',
            frequency: 0.25,
            impact: 'high'
          },
          {
            gene: 'TREM2',
            variant: 'rs75932628',
            effect: 'Altered microglial function',
            frequency: 0.005,
            impact: 'moderate'
          }
        ],
        labIndicators: [
          {
            testName: 'Homocysteine',
            currentValue: 11,
            riskThreshold: 10,
            units: 'μmol/L',
            contribution: 25
          },
          {
            testName: 'Vitamin B12',
            currentValue: 350,
            riskThreshold: 400,
            units: 'pg/mL',
            contribution: 20
          },
          {
            testName: 'Folate',
            currentValue: 8,
            riskThreshold: 10,
            units: 'ng/mL',
            contribution: 15
          },
          {
            testName: 'Insulin',
            currentValue: 12,
            riskThreshold: 10,
            units: 'μU/mL',
            contribution: 40
          }
        ],
        recommendations: [
          'B-vitamin supplementation (B12, folate)',
          'Omega-3 fatty acids (DHA/EPA)',
          'Regular cognitive training exercises',
          'Mediterranean or MIND diet',
          'Regular physical exercise',
          'Social engagement and stress management'
        ]
      },
      {
        condition: 'Osteoporosis',
        riskLevel: 'low',
        riskScore: 32,
        populationPercentile: 25,
        confidence: 0.72,
        associatedMarkers: [
          {
            gene: 'COL1A1',
            variant: 'rs1800012',
            effect: 'Altered collagen structure',
            frequency: 0.15,
            impact: 'moderate'
          },
          {
            gene: 'VDR',
            variant: 'rs2228570',
            effect: 'Vitamin D receptor function',
            frequency: 0.40,
            impact: 'low'
          }
        ],
        labIndicators: [
          {
            testName: 'Vitamin D',
            currentValue: 45,
            riskThreshold: 30,
            units: 'ng/mL',
            contribution: 40
          },
          {
            testName: 'Calcium',
            currentValue: 9.8,
            riskThreshold: 9.0,
            units: 'mg/dL',
            contribution: 25
          },
          {
            testName: 'Phosphorus',
            currentValue: 3.2,
            riskThreshold: 2.5,
            units: 'mg/dL',
            contribution: 20
          },
          {
            testName: 'PTH',
            currentValue: 35,
            riskThreshold: 65,
            units: 'pg/mL',
            contribution: 15
          }
        ],
        recommendations: [
          'Maintain adequate vitamin D levels',
          'Calcium and magnesium supplementation',
          'Weight-bearing exercise routine',
          'Limit alcohol and caffeine',
          'Bone density screening every 2 years'
        ]
      }
    ]

    return mockRisks.sort((a, b) => b.riskScore - a.riskScore)
  }

  useEffect(() => {
    fetchGeneticRisks()
  }, [includePolygenic])

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very_high': return '#DC2626'
      case 'high': return '#EF4444'
      case 'moderate': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very_high': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'high': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'moderate': return <Info className="h-5 w-5 text-yellow-500" />
      case 'low': return <Shield className="h-5 w-5 text-green-500" />
      default: return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const renderRiskCard = (risk: GeneticRisk) => {
    const isSelected = selectedRisk === risk.condition
    const riskColor = getRiskColor(risk.riskLevel)

    return (
      <div 
        key={risk.condition}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedRisk(isSelected ? null : risk.condition)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getRiskIcon(risk.riskLevel)}
            <h4 className="font-medium text-gray-900">{risk.condition}</h4>
          </div>
          <div className="text-right">
            <div 
              className="text-lg font-bold"
              style={{ color: riskColor }}
            >
              {risk.riskScore}/100
            </div>
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ 
                color: riskColor,
                backgroundColor: `${riskColor}20`
              }}
            >
              {risk.riskLevel.replace('_', ' ')} risk
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-600">Population Percentile:</span>
            <span className="ml-1 font-medium">{risk.populationPercentile}th</span>
          </div>
          <div>
            <span className="text-gray-600">Confidence:</span>
            <span className="ml-1 font-medium">{(risk.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Risk Indicators Summary */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-2">Key Risk Factors:</div>
          <div className="space-y-1">
            {risk.labIndicators.slice(0, isSelected ? undefined : 2).map(indicator => (
              <div key={indicator.testName} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{indicator.testName}</span>
                <span 
                  className={`font-medium ${
                    indicator.currentValue > indicator.riskThreshold ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {indicator.currentValue} {indicator.units}
                </span>
              </div>
            ))}
            {!isSelected && risk.labIndicators.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{risk.labIndicators.length - 2} more indicators
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Genetic Markers */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Associated Genetic Markers</h5>
                <div className="space-y-2">
                  {risk.associatedMarkers.map((marker, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{marker.gene} ({marker.variant})</span>
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            color: marker.impact === 'high' ? '#DC2626' : 
                                   marker.impact === 'moderate' ? '#F59E0B' : '#10B981',
                            backgroundColor: marker.impact === 'high' ? '#FEF2F2' : 
                                            marker.impact === 'moderate' ? '#FFFBEB' : '#ECFDF5'
                          }}
                        >
                          {marker.impact} impact
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{marker.effect}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Population frequency: {(marker.frequency * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Indicators Detail */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Lab Value Risk Contributions</h5>
                <div className="space-y-2">
                  {risk.labIndicators.map(indicator => (
                    <div key={indicator.testName} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{indicator.testName}</span>
                        <span className="text-sm text-gray-600">{indicator.contribution}% of risk</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Current:</span>
                          <span 
                            className={`ml-1 font-medium ${
                              indicator.currentValue > indicator.riskThreshold ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {indicator.currentValue} {indicator.units}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Risk Threshold:</span>
                          <span className="ml-1 font-medium">{indicator.riskThreshold} {indicator.units}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Risk Reduction Strategies</h5>
                <ul className="space-y-2">
                  {risk.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const highRiskCount = geneticRisks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'very_high').length
  const moderateRiskCount = geneticRisks.filter(r => r.riskLevel === 'moderate').length

  return (
    <LabBaseWidget
      title="Genetic Risk Assessment"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchGeneticRisks}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Dna className="h-5 w-5 text-indigo-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-1 text-xs">
            <input
              type="checkbox"
              checked={includePolygenic}
              onChange={(e) => setIncludePolygenic(e.target.checked)}
              className="rounded"
            />
            <span>Polygenic scores</span>
          </label>
          {geneticRisks.length > 0 && (
            <div className="flex items-center space-x-1">
              {highRiskCount > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {highRiskCount} high risk
                </span>
              )}
              {moderateRiskCount > 0 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  {moderateRiskCount} moderate
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {geneticRisks.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center space-x-2 mb-2">
                <Dna className="h-4 w-4 text-indigo-600" />
                <h4 className="font-medium text-indigo-900">Genetic Risk Summary</h4>
              </div>
              <div className="text-sm text-indigo-700">
                Analyzed {geneticRisks.length} conditions based on genetic markers and lab values
                {highRiskCount > 0 && (
                  <span className="block mt-1 text-red-700 font-medium">
                    {highRiskCount} condition(s) show elevated genetic risk
                  </span>
                )}
              </div>
            </div>

            {/* Risk Cards */}
            <div className="space-y-3">
              {geneticRisks.map(renderRiskCard)}
            </div>

            {/* Disclaimer */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <strong>Important:</strong> Genetic risk assessments are probabilistic and based on current research. 
                  Having genetic risk factors does not guarantee disease development. Lifestyle factors, 
                  environment, and other genes also play important roles. Always consult with a genetic 
                  counselor or healthcare provider for personalized interpretation.
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Dna className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Genetic Data</h3>
            <p className="text-gray-500">
              Genetic risk assessment requires both genetic testing and lab data
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabGeneticRiskWidget
