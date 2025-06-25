/**
 * Lab Medication Impact Widget - Issue #13 Widget #41
 * 
 * Analyzes the impact of medications on lab values with before/after comparisons
 */

import React, { useState, useEffect } from 'react'
import { Pill, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabMedicationImpactWidgetProps extends LabWidgetProps {
  timeframe?: number
}

interface MedicationImpact {
  medicationName: string
  startDate: string
  endDate?: string
  affectedTests: TestImpact[]
  overallImpact: 'positive' | 'negative' | 'neutral' | 'mixed'
  confidence: number
  notes?: string
}

interface TestImpact {
  testName: string
  beforeValue: number
  afterValue: number
  changePercent: number
  changeDirection: 'improved' | 'worsened' | 'stable'
  clinicalSignificance: 'high' | 'medium' | 'low'
  units: string
  expectedEffect?: string
}

export const LabMedicationImpactWidget: React.FC<LabMedicationImpactWidgetProps> = ({
  timeframe = 365,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [medicationImpacts, setMedicationImpacts] = useState<MedicationImpact[]>([])
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchMedicationImpacts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Fetch medication history
      const medicationResponse = await fetch(`/api/medications/history?startDate=${startDate}&endDate=${endDate}`)
      if (!medicationResponse.ok) {
        throw new Error('Failed to fetch medication history')
      }

      const medicationResult = await medicationResponse.json()
      if (!medicationResult.success) {
        throw new Error(medicationResult.error || 'Failed to fetch medication data')
      }

      // Fetch lab results for the same period
      const labResponse = await fetch(`/api/labs/results?enhanced=true&startDate=${startDate}&endDate=${endDate}&limit=1000`)
      if (!labResponse.ok) {
        throw new Error('Failed to fetch lab results')
      }

      const labResult = await labResponse.json()
      if (!labResult.success) {
        throw new Error(labResult.error || 'Failed to fetch lab data')
      }

      // Analyze medication impacts
      const impacts = analyzeMedicationImpacts(medicationResult.data, labResult.data)
      setMedicationImpacts(impacts)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(impacts)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching medication impacts:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeMedicationImpacts = (medications: any[], labResults: any[]): MedicationImpact[] => {
    const impacts: MedicationImpact[] = []

    medications.forEach(medication => {
      const startDate = new Date(medication.start_date)
      const endDate = medication.end_date ? new Date(medication.end_date) : new Date()

      // Find lab results before and after medication start
      const beforeResults = labResults.filter(result => {
        const resultDate = new Date(result.collected_on)
        return resultDate >= new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000) && 
               resultDate < startDate
      })

      const afterResults = labResults.filter(result => {
        const resultDate = new Date(result.collected_on)
        return resultDate >= new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) && 
               resultDate <= endDate
      })

      if (beforeResults.length === 0 || afterResults.length === 0) return

      // Group by test name and analyze impact
      const testImpacts = analyzeTestImpacts(beforeResults, afterResults, medication.name)
      
      if (testImpacts.length === 0) return

      // Determine overall impact
      const overallImpact = determineOverallImpact(testImpacts)
      
      // Calculate confidence based on data quality and known effects
      const confidence = calculateConfidence(testImpacts, medication.name)

      impacts.push({
        medicationName: medication.name,
        startDate: medication.start_date,
        endDate: medication.end_date,
        affectedTests: testImpacts,
        overallImpact,
        confidence,
        notes: generateMedicationNotes(medication.name, testImpacts)
      })
    })

    return impacts.sort((a, b) => b.confidence - a.confidence)
  }

  const analyzeTestImpacts = (beforeResults: any[], afterResults: any[], medicationName: string): TestImpact[] => {
    const testImpacts: TestImpact[] = []

    // Group results by test name
    const beforeByTest: { [testName: string]: any[] } = {}
    const afterByTest: { [testName: string]: any[] } = {}

    beforeResults.forEach(result => {
      if (!beforeByTest[result.test_name]) beforeByTest[result.test_name] = []
      beforeByTest[result.test_name].push(result)
    })

    afterResults.forEach(result => {
      if (!afterByTest[result.test_name]) afterByTest[result.test_name] = []
      afterByTest[result.test_name].push(result)
    })

    // Analyze each test
    Object.keys(beforeByTest).forEach(testName => {
      if (!afterByTest[testName]) return

      const beforeValues = beforeByTest[testName].map(r => r.numeric_value).filter(v => v !== null)
      const afterValues = afterByTest[testName].map(r => r.numeric_value).filter(v => v !== null)

      if (beforeValues.length === 0 || afterValues.length === 0) return

      const beforeAvg = beforeValues.reduce((sum, v) => sum + v, 0) / beforeValues.length
      const afterAvg = afterValues.reduce((sum, v) => sum + v, 0) / afterValues.length

      const changePercent = ((afterAvg - beforeAvg) / beforeAvg) * 100
      const changeDirection = determineChangeDirection(testName, changePercent, medicationName)
      const clinicalSignificance = determineClinicalSignificance(testName, Math.abs(changePercent))

      testImpacts.push({
        testName,
        beforeValue: beforeAvg,
        afterValue: afterAvg,
        changePercent,
        changeDirection,
        clinicalSignificance,
        units: beforeByTest[testName][0].metric?.units || '',
        expectedEffect: getExpectedEffect(medicationName, testName)
      })
    })

    return testImpacts.filter(impact => impact.clinicalSignificance !== 'low' || Math.abs(impact.changePercent) >= 10)
  }

  const determineChangeDirection = (testName: string, changePercent: number, medicationName: string): 'improved' | 'worsened' | 'stable' => {
    if (Math.abs(changePercent) < 5) return 'stable'

    // Define which direction is "improvement" for each test
    const improvementDirection: { [testName: string]: 'decrease' | 'increase' } = {
      'LDL Cholesterol': 'decrease',
      'Total Cholesterol': 'decrease',
      'Glucose': 'decrease',
      'HbA1c': 'decrease',
      'Blood Pressure': 'decrease',
      'HDL Cholesterol': 'increase',
      'Hemoglobin': 'increase'
    }

    const expectedDirection = improvementDirection[testName]
    if (!expectedDirection) return 'stable'

    const actualDirection = changePercent > 0 ? 'increase' : 'decrease'
    return actualDirection === expectedDirection ? 'improved' : 'worsened'
  }

  const determineClinicalSignificance = (testName: string, changePercent: number): 'high' | 'medium' | 'low' => {
    // Clinical significance thresholds by test type
    const thresholds: { [testName: string]: { high: number, medium: number } } = {
      'LDL Cholesterol': { high: 20, medium: 10 },
      'HDL Cholesterol': { high: 15, medium: 8 },
      'Total Cholesterol': { high: 15, medium: 8 },
      'Glucose': { high: 20, medium: 10 },
      'HbA1c': { high: 10, medium: 5 },
      'Blood Pressure': { high: 10, medium: 5 }
    }

    const threshold = thresholds[testName] || { high: 25, medium: 15 }
    
    if (changePercent >= threshold.high) return 'high'
    if (changePercent >= threshold.medium) return 'medium'
    return 'low'
  }

  const determineOverallImpact = (testImpacts: TestImpact[]): 'positive' | 'negative' | 'neutral' | 'mixed' => {
    const improved = testImpacts.filter(t => t.changeDirection === 'improved').length
    const worsened = testImpacts.filter(t => t.changeDirection === 'worsened').length
    const stable = testImpacts.filter(t => t.changeDirection === 'stable').length

    if (improved > worsened && improved > 0) return 'positive'
    if (worsened > improved && worsened > 0) return 'negative'
    if (improved > 0 && worsened > 0) return 'mixed'
    return 'neutral'
  }

  const calculateConfidence = (testImpacts: TestImpact[], medicationName: string): number => {
    let confidence = 0.5

    // Higher confidence with more affected tests
    confidence += Math.min(testImpacts.length * 0.1, 0.3)

    // Higher confidence with high clinical significance
    const highSignificance = testImpacts.filter(t => t.clinicalSignificance === 'high').length
    confidence += highSignificance * 0.1

    // Higher confidence for known medication effects
    const knownEffects = testImpacts.filter(t => t.expectedEffect).length
    confidence += knownEffects * 0.05

    return Math.min(confidence, 0.95)
  }

  const getExpectedEffect = (medicationName: string, testName: string): string | undefined => {
    // Known medication effects on lab values
    const medicationEffects: { [medication: string]: { [test: string]: string } } = {
      'Statin': {
        'LDL Cholesterol': 'Decrease 25-50%',
        'Total Cholesterol': 'Decrease 20-40%',
        'HDL Cholesterol': 'Increase 5-15%'
      },
      'Metformin': {
        'Glucose': 'Decrease 10-20%',
        'HbA1c': 'Decrease 0.5-1.5%'
      },
      'ACE Inhibitor': {
        'Blood Pressure': 'Decrease 10-15%',
        'Creatinine': 'Slight increase initially'
      }
    }

    // Find medication by partial name match
    const matchedMed = Object.keys(medicationEffects).find(med => 
      medicationName.toLowerCase().includes(med.toLowerCase())
    )

    return matchedMed ? medicationEffects[matchedMed][testName] : undefined
  }

  const generateMedicationNotes = (medicationName: string, testImpacts: TestImpact[]): string => {
    const significantChanges = testImpacts.filter(t => t.clinicalSignificance === 'high')
    
    if (significantChanges.length === 0) {
      return `${medicationName} shows minimal impact on monitored lab values.`
    }

    const improved = significantChanges.filter(t => t.changeDirection === 'improved')
    const worsened = significantChanges.filter(t => t.changeDirection === 'worsened')

    let notes = `${medicationName} shows significant effects: `
    
    if (improved.length > 0) {
      notes += `improved ${improved.map(t => t.testName).join(', ')}`
    }
    
    if (worsened.length > 0) {
      if (improved.length > 0) notes += '; '
      notes += `worsened ${worsened.map(t => t.testName).join(', ')}`
    }

    return notes + '. Monitor trends and consult healthcare provider.'
  }

  useEffect(() => {
    fetchMedicationImpacts()
  }, [timeframe])

  const renderMedicationCard = (impact: MedicationImpact) => {
    const impactColors = {
      positive: '#10B981',
      negative: '#EF4444',
      mixed: '#F59E0B',
      neutral: '#6B7280'
    }

    const color = impactColors[impact.overallImpact]
    const isSelected = selectedMedication === impact.medicationName

    return (
      <div 
        key={impact.medicationName}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedMedication(isSelected ? null : impact.medicationName)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Pill className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">{impact.medicationName}</h4>
          </div>
          <div className="flex items-center space-x-2">
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ color, backgroundColor: `${color}20` }}
            >
              {impact.overallImpact}
            </span>
            <span className="text-xs text-gray-500">
              {(impact.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-600">Started:</span>
            <span className="ml-1 font-medium">
              {new Date(impact.startDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Affected Tests:</span>
            <span className="ml-1 font-medium">{impact.affectedTests.length}</span>
          </div>
        </div>

        {/* Test Impacts Summary */}
        <div className="space-y-2">
          {impact.affectedTests.slice(0, isSelected ? undefined : 3).map(test => (
            <div key={test.testName} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{test.testName}</span>
              <div className="flex items-center space-x-2">
                {test.changeDirection === 'improved' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : test.changeDirection === 'worsened' ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span 
                  className="font-medium"
                  style={{ 
                    color: test.changeDirection === 'improved' ? '#10B981' : 
                           test.changeDirection === 'worsened' ? '#EF4444' : '#6B7280'
                  }}
                >
                  {test.changePercent > 0 ? '+' : ''}{test.changePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
          
          {!isSelected && impact.affectedTests.length > 3 && (
            <div className="text-xs text-gray-500 text-center">
              +{impact.affectedTests.length - 3} more tests
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Detailed Test Results */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Detailed Impact Analysis</h5>
                <div className="space-y-3">
                  {impact.affectedTests.map(test => (
                    <div key={test.testName} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{test.testName}</span>
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            color: test.clinicalSignificance === 'high' ? '#DC2626' : 
                                   test.clinicalSignificance === 'medium' ? '#F59E0B' : '#10B981',
                            backgroundColor: test.clinicalSignificance === 'high' ? '#FEF2F2' : 
                                            test.clinicalSignificance === 'medium' ? '#FFFBEB' : '#ECFDF5'
                          }}
                        >
                          {test.clinicalSignificance} significance
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Before:</span>
                          <span className="ml-1 font-medium">
                            {formatLabValue(test.beforeValue, test.units, 1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">After:</span>
                          <span className="ml-1 font-medium">
                            {formatLabValue(test.afterValue, test.units, 1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Change:</span>
                          <span 
                            className="ml-1 font-medium"
                            style={{ 
                              color: test.changeDirection === 'improved' ? '#10B981' : 
                                     test.changeDirection === 'worsened' ? '#EF4444' : '#6B7280'
                            }}
                          >
                            {test.changePercent > 0 ? '+' : ''}{test.changePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      {test.expectedEffect && (
                        <div className="mt-2 text-xs text-blue-600">
                          Expected: {test.expectedEffect}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {impact.notes && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Clinical Notes</h5>
                  <p className="text-sm text-gray-600">{impact.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const positiveCount = medicationImpacts.filter(m => m.overallImpact === 'positive').length
  const negativeCount = medicationImpacts.filter(m => m.overallImpact === 'negative').length

  return (
    <LabBaseWidget
      title="Medication Impact Analysis"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchMedicationImpacts}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Pill className="h-5 w-5 text-purple-600" />}
      headerActions={
        medicationImpacts.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            {positiveCount > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {positiveCount} positive
              </span>
            )}
            {negativeCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                {negativeCount} negative
              </span>
            )}
          </div>
        )
      }
    >
      <div className="space-y-4">
        {medicationImpacts.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Pill className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-purple-900">Impact Summary</h4>
              </div>
              <div className="text-sm text-purple-700">
                Analyzed {medicationImpacts.length} medications and their effects on lab values
                <span className="block mt-1">
                  {positiveCount} showing positive effects, {negativeCount} showing negative effects
                </span>
              </div>
            </div>

            {/* Medications List */}
            <div className="space-y-3">
              {medicationImpacts.map(renderMedicationCard)}
            </div>

            {/* Disclaimer */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <strong>Important:</strong> This analysis is for informational purposes only. 
                  Correlation does not imply causation. Always consult your healthcare provider 
                  before making medication changes.
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Medication Data</h3>
            <p className="text-gray-500">
              Medication impact analysis will appear when both medication and lab data are available
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabMedicationImpactWidget
