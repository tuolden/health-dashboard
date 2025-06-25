/**
 * Lab Reference Ranges Widget - Issue #13 Widget #40
 * 
 * Displays and manages reference ranges for lab tests with age/gender adjustments
 */

import React, { useState, useEffect } from 'react'
import { Target, User, Calendar, Settings } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabReferenceRangesWidgetProps extends LabWidgetProps {
  testNames?: string[]
  showPersonalized?: boolean
}

interface ReferenceRange {
  testName: string
  standardRange: { min: number, max: number }
  personalizedRange?: { min: number, max: number }
  units: string
  ageGroup: string
  gender: string
  source: string
  lastUpdated: string
  notes?: string
}

interface PatientProfile {
  age: number
  gender: 'male' | 'female'
  ethnicity?: string
  conditions?: string[]
}

export const LabReferenceRangesWidget: React.FC<LabReferenceRangesWidgetProps> = ({
  testNames = ['Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol', 'Glucose', 'Hemoglobin', 'TSH'],
  showPersonalized = true,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [referenceRanges, setReferenceRanges] = useState<ReferenceRange[]>([])
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null)
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchReferenceRanges = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch patient profile for personalized ranges
      const profileResponse = await fetch('/api/patient/profile')
      let profile: PatientProfile | null = null
      
      if (profileResponse.ok) {
        const profileResult = await profileResponse.json()
        if (profileResult.success) {
          profile = profileResult.data
          setPatientProfile(profile)
        }
      }

      // Fetch reference ranges for each test
      const rangePromises = testNames.map(async (testName) => {
        try {
          const params = new URLSearchParams({
            testName,
            ...(profile && {
              age: profile.age.toString(),
              gender: profile.gender,
              ...(profile.ethnicity && { ethnicity: profile.ethnicity })
            })
          })

          const response = await fetch(`/api/labs/reference-ranges?${params}`)
          if (!response.ok) return createDefaultRange(testName)

          const result = await response.json()
          if (!result.success) return createDefaultRange(testName)

          return result.data
        } catch {
          return createDefaultRange(testName)
        }
      })

      const ranges = await Promise.all(rangePromises)
      setReferenceRanges(ranges.filter(r => r !== null))
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate({ ranges, profile })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching reference ranges:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultRange = (testName: string): ReferenceRange => {
    // Default reference ranges based on common lab standards
    const defaults: { [key: string]: { min: number, max: number, units: string } } = {
      'Total Cholesterol': { min: 125, max: 200, units: 'mg/dL' },
      'LDL Cholesterol': { min: 0, max: 100, units: 'mg/dL' },
      'HDL Cholesterol': { min: 40, max: 100, units: 'mg/dL' },
      'Glucose': { min: 70, max: 100, units: 'mg/dL' },
      'Hemoglobin': { min: 12, max: 16, units: 'g/dL' },
      'TSH': { min: 0.4, max: 4.0, units: 'mIU/L' },
      'Creatinine': { min: 0.6, max: 1.2, units: 'mg/dL' },
      'ALT': { min: 7, max: 35, units: 'U/L' },
      'AST': { min: 8, max: 40, units: 'U/L' }
    }

    const defaultRange = defaults[testName] || { min: 0, max: 100, units: 'units' }

    return {
      testName,
      standardRange: defaultRange,
      units: defaultRange.units,
      ageGroup: 'Adult',
      gender: 'All',
      source: 'Standard Reference',
      lastUpdated: new Date().toISOString(),
      notes: 'Default reference range - consult healthcare provider for personalized ranges'
    }
  }

  useEffect(() => {
    fetchReferenceRanges()
  }, [testNames, showPersonalized])

  const renderRangeCard = (range: ReferenceRange) => {
    const isSelected = selectedTest === range.testName

    return (
      <div 
        key={range.testName}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedTest(isSelected ? null : range.testName)}
      >
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-gray-900">{range.testName}</h4>
          <div className="flex items-center space-x-2">
            {range.personalizedRange && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Personalized
              </span>
            )}
            <span className="text-xs text-gray-500">{range.units}</span>
          </div>
        </div>

        {/* Standard Range */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Standard Range</span>
            <span className="text-sm font-medium">
              {formatLabValue(range.standardRange.min, range.units, 1)} - {formatLabValue(range.standardRange.max, range.units, 1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full w-full" />
          </div>
        </div>

        {/* Personalized Range */}
        {range.personalizedRange && showPersonalized && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-blue-600">Your Optimal Range</span>
              <span className="text-sm font-medium text-blue-600">
                {formatLabValue(range.personalizedRange.min, range.units, 1)} - {formatLabValue(range.personalizedRange.max, range.units, 1)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full w-3/4" />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{range.ageGroup} • {range.gender}</span>
          <span>{range.source}</span>
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Range Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Age Group:</span>
                    <span className="ml-2 font-medium">{range.ageGroup}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Gender:</span>
                    <span className="ml-2 font-medium">{range.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Source:</span>
                    <span className="ml-2 font-medium">{range.source}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Updated:</span>
                    <span className="ml-2 font-medium">
                      {new Date(range.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {range.notes && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Notes</h5>
                  <p className="text-sm text-gray-600">{range.notes}</p>
                </div>
              )}

              {/* Range Interpretation */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Interpretation Guide</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span>Normal: Within reference range</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span>Borderline: Near range limits</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span>Abnormal: Outside reference range</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <LabBaseWidget
      title="Reference Ranges"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchReferenceRanges}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Target className="h-5 w-5 text-green-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          {patientProfile && (
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <User className="h-3 w-3" />
              <span>{patientProfile.age}y {patientProfile.gender}</span>
            </div>
          )}
          <button
            onClick={() => setShowPersonalized(!showPersonalized)}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            {showPersonalized ? 'Hide' : 'Show'} Personalized
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {referenceRanges.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-900">Reference Range Summary</h4>
              </div>
              <div className="text-sm text-green-700">
                Showing {referenceRanges.length} lab test reference ranges
                {patientProfile && (
                  <span className="block mt-1">
                    Personalized for {patientProfile.age}-year-old {patientProfile.gender}
                  </span>
                )}
              </div>
            </div>

            {/* Patient Profile */}
            {patientProfile && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Patient Profile</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-blue-600">Age:</span>
                    <span className="ml-1 font-medium">{patientProfile.age} years</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Gender:</span>
                    <span className="ml-1 font-medium capitalize">{patientProfile.gender}</span>
                  </div>
                  {patientProfile.ethnicity && (
                    <div>
                      <span className="text-blue-600">Ethnicity:</span>
                      <span className="ml-1 font-medium">{patientProfile.ethnicity}</span>
                    </div>
                  )}
                  {patientProfile.conditions && patientProfile.conditions.length > 0 && (
                    <div>
                      <span className="text-blue-600">Conditions:</span>
                      <span className="ml-1 font-medium">{patientProfile.conditions.length}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reference Ranges */}
            <div className="space-y-3">
              {referenceRanges.map(renderRangeCard)}
            </div>

            {/* Information */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Important Information</h4>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Reference ranges may vary between laboratories</li>
                <li>• Personalized ranges consider age, gender, and medical history</li>
                <li>• Values outside ranges don't always indicate disease</li>
                <li>• Always consult healthcare providers for interpretation</li>
                <li>• Ranges are updated based on latest clinical guidelines</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Reference Ranges</h3>
            <p className="text-gray-500">
              Reference ranges will appear here for your lab tests
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabReferenceRangesWidget
