/**
 * Lab Nutrient Deficiency Widget - Issue #13 Widget #46
 * 
 * Comprehensive nutrient deficiency analysis with supplementation recommendations
 */

import React, { useState, useEffect } from 'react'
import { Apple, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabNutrientDeficiencyWidgetProps extends LabWidgetProps {
  includeSubclinical?: boolean
}

interface NutrientStatus {
  nutrient: string
  currentValue: number
  optimalRange: { min: number, max: number }
  deficiencyRange: { min: number, max: number }
  units: string
  status: 'deficient' | 'insufficient' | 'adequate' | 'optimal' | 'excess'
  severity: 'mild' | 'moderate' | 'severe'
  symptoms: string[]
  foodSources: string[]
  supplementRecommendation: SupplementRecommendation
  interactions: string[]
  testingFrequency: string
}

interface SupplementRecommendation {
  form: string
  dosage: string
  timing: string
  duration: string
  monitoring: string
  contraindications?: string[]
}

export const LabNutrientDeficiencyWidget: React.FC<LabNutrientDeficiencyWidgetProps> = ({
  includeSubclinical = true,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [nutrientStatus, setNutrientStatus] = useState<NutrientStatus[]>([])
  const [selectedNutrient, setSelectedNutrient] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'deficient' | 'all'>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchNutrientStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/labs/nutrients?includeSubclinical=${includeSubclinical}&enhanced=true`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch nutrient data')
      }

      const processedData = processNutrientData(result.data)
      setNutrientStatus(processedData)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(processedData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching nutrient status:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processNutrientData = (data: any): NutrientStatus[] => {
    // Mock nutrient data - in real implementation, this would process actual lab data
    const mockNutrients: NutrientStatus[] = [
      {
        nutrient: 'Vitamin D',
        currentValue: 22,
        optimalRange: { min: 40, max: 80 },
        deficiencyRange: { min: 0, max: 20 },
        units: 'ng/mL',
        status: 'insufficient',
        severity: 'moderate',
        symptoms: ['Fatigue', 'Bone pain', 'Muscle weakness', 'Mood changes'],
        foodSources: ['Fatty fish', 'Egg yolks', 'Fortified foods', 'Mushrooms'],
        supplementRecommendation: {
          form: 'Vitamin D3 (cholecalciferol)',
          dosage: '2000-4000 IU daily',
          timing: 'With fat-containing meal',
          duration: '3-6 months, then retest',
          monitoring: 'Recheck 25(OH)D in 3 months',
          contraindications: ['Hypercalcemia', 'Kidney stones']
        },
        interactions: ['Increases calcium absorption', 'May affect warfarin'],
        testingFrequency: 'Every 6 months'
      },
      {
        nutrient: 'Vitamin B12',
        currentValue: 180,
        optimalRange: { min: 400, max: 1000 },
        deficiencyRange: { min: 0, max: 200 },
        units: 'pg/mL',
        status: 'deficient',
        severity: 'severe',
        symptoms: ['Fatigue', 'Neurological symptoms', 'Anemia', 'Memory issues'],
        foodSources: ['Meat', 'Fish', 'Dairy', 'Nutritional yeast'],
        supplementRecommendation: {
          form: 'Methylcobalamin or cyanocobalamin',
          dosage: '1000-2000 mcg daily',
          timing: 'Morning, empty stomach',
          duration: '6-12 months',
          monitoring: 'Recheck B12 and MMA in 3 months',
          contraindications: ['Leber\'s disease']
        },
        interactions: ['Metformin reduces absorption', 'PPI medications'],
        testingFrequency: 'Every 6-12 months'
      },
      {
        nutrient: 'Iron',
        currentValue: 45,
        optimalRange: { min: 60, max: 170 },
        deficiencyRange: { min: 0, max: 50 },
        units: 'μg/dL',
        status: 'insufficient',
        severity: 'mild',
        symptoms: ['Fatigue', 'Pale skin', 'Cold hands/feet', 'Brittle nails'],
        foodSources: ['Red meat', 'Spinach', 'Lentils', 'Dark chocolate'],
        supplementRecommendation: {
          form: 'Ferrous sulfate or bisglycinate',
          dosage: '18-25 mg elemental iron daily',
          timing: 'Empty stomach with vitamin C',
          duration: '3-6 months',
          monitoring: 'Recheck iron panel in 3 months',
          contraindications: ['Hemochromatosis', 'Thalassemia']
        },
        interactions: ['Calcium reduces absorption', 'Coffee/tea inhibit'],
        testingFrequency: 'Every 3-6 months'
      },
      {
        nutrient: 'Folate',
        currentValue: 3.2,
        optimalRange: { min: 6, max: 20 },
        deficiencyRange: { min: 0, max: 3 },
        units: 'ng/mL',
        status: 'deficient',
        severity: 'moderate',
        symptoms: ['Anemia', 'Fatigue', 'Mood changes', 'Poor concentration'],
        foodSources: ['Leafy greens', 'Legumes', 'Fortified grains', 'Citrus'],
        supplementRecommendation: {
          form: 'L-methylfolate or folic acid',
          dosage: '400-800 mcg daily',
          timing: 'With or without food',
          duration: '3-6 months',
          monitoring: 'Recheck folate and B12 in 3 months',
          contraindications: ['Undiagnosed B12 deficiency']
        },
        interactions: ['Methotrexate antagonist', 'Phenytoin reduces levels'],
        testingFrequency: 'Every 6-12 months'
      },
      {
        nutrient: 'Magnesium',
        currentValue: 1.6,
        optimalRange: { min: 1.8, max: 2.6 },
        deficiencyRange: { min: 0, max: 1.5 },
        units: 'mg/dL',
        status: 'insufficient',
        severity: 'mild',
        symptoms: ['Muscle cramps', 'Insomnia', 'Anxiety', 'Headaches'],
        foodSources: ['Nuts', 'Seeds', 'Dark chocolate', 'Leafy greens'],
        supplementRecommendation: {
          form: 'Magnesium glycinate or citrate',
          dosage: '200-400 mg daily',
          timing: 'Evening with food',
          duration: '2-3 months',
          monitoring: 'Recheck serum magnesium in 2 months',
          contraindications: ['Kidney disease', 'Heart block']
        },
        interactions: ['May enhance muscle relaxants', 'Reduces antibiotic absorption'],
        testingFrequency: 'Every 6-12 months'
      },
      {
        nutrient: 'Zinc',
        currentValue: 65,
        optimalRange: { min: 70, max: 120 },
        deficiencyRange: { min: 0, max: 60 },
        units: 'μg/dL',
        status: 'insufficient',
        severity: 'mild',
        symptoms: ['Poor wound healing', 'Hair loss', 'Taste changes', 'Immune issues'],
        foodSources: ['Oysters', 'Beef', 'Pumpkin seeds', 'Chickpeas'],
        supplementRecommendation: {
          form: 'Zinc picolinate or gluconate',
          dosage: '8-15 mg daily',
          timing: 'Empty stomach or with food if upset',
          duration: '2-3 months',
          monitoring: 'Recheck zinc and copper in 2 months',
          contraindications: ['Wilson\'s disease']
        },
        interactions: ['Copper antagonist', 'Reduces antibiotic absorption'],
        testingFrequency: 'Every 6-12 months'
      }
    ]

    return mockNutrients.sort((a, b) => {
      const severityOrder = { severe: 3, moderate: 2, mild: 1 }
      const statusOrder = { deficient: 3, insufficient: 2, adequate: 1, optimal: 0, excess: 1 }
      
      const aSeverity = severityOrder[a.severity]
      const bSeverity = severityOrder[b.severity]
      const aStatus = statusOrder[a.status]
      const bStatus = statusOrder[b.status]
      
      if (aStatus !== bStatus) return bStatus - aStatus
      return bSeverity - aSeverity
    })
  }

  useEffect(() => {
    fetchNutrientStatus()
  }, [includeSubclinical])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deficient': return '#DC2626'
      case 'insufficient': return '#F59E0B'
      case 'adequate': return '#10B981'
      case 'optimal': return '#059669'
      case 'excess': return '#7C3AED'
      default: return '#6B7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deficient': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'insufficient': return <TrendingDown className="h-4 w-4 text-yellow-500" />
      case 'adequate': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'optimal': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'excess': return <AlertCircle className="h-4 w-4 text-purple-500" />
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredNutrients = nutrientStatus.filter(nutrient => {
    if (viewMode === 'deficient') {
      return nutrient.status === 'deficient' || nutrient.status === 'insufficient'
    }
    return true
  })

  const renderNutrientCard = (nutrient: NutrientStatus) => {
    const isSelected = selectedNutrient === nutrient.nutrient
    const statusColor = getStatusColor(nutrient.status)

    return (
      <div 
        key={nutrient.nutrient}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedNutrient(isSelected ? null : nutrient.nutrient)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(nutrient.status)}
            <h4 className="font-medium text-gray-900">{nutrient.nutrient}</h4>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {formatLabValue(nutrient.currentValue, nutrient.units, 1)}
            </div>
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ 
                color: statusColor,
                backgroundColor: `${statusColor}20`
              }}
            >
              {nutrient.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-600">Optimal Range:</span>
            <div className="font-medium">
              {formatLabValue(nutrient.optimalRange.min, nutrient.units, 1)} - {formatLabValue(nutrient.optimalRange.max, nutrient.units, 1)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Severity:</span>
            <span 
              className="ml-1 font-medium capitalize"
              style={{ 
                color: nutrient.severity === 'severe' ? '#DC2626' : 
                       nutrient.severity === 'moderate' ? '#F59E0B' : '#10B981'
              }}
            >
              {nutrient.severity}
            </span>
          </div>
        </div>

        {/* Symptoms Preview */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Common Symptoms:</div>
          <div className="text-sm text-gray-700">
            {nutrient.symptoms.slice(0, isSelected ? undefined : 3).join(', ')}
            {!isSelected && nutrient.symptoms.length > 3 && '...'}
          </div>
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Supplementation */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Supplementation Recommendation</h5>
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Form:</span>
                      <div className="text-green-600">{nutrient.supplementRecommendation.form}</div>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Dosage:</span>
                      <div className="text-green-600">{nutrient.supplementRecommendation.dosage}</div>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Timing:</span>
                      <div className="text-green-600">{nutrient.supplementRecommendation.timing}</div>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Duration:</span>
                      <div className="text-green-600">{nutrient.supplementRecommendation.duration}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-green-700 font-medium">Monitoring:</span>
                    <div className="text-green-600">{nutrient.supplementRecommendation.monitoring}</div>
                  </div>
                  {nutrient.supplementRecommendation.contraindications && (
                    <div className="mt-2 text-sm">
                      <span className="text-red-700 font-medium">Contraindications:</span>
                      <div className="text-red-600">{nutrient.supplementRecommendation.contraindications.join(', ')}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Food Sources */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Food Sources</h5>
                <div className="flex flex-wrap gap-2">
                  {nutrient.foodSources.map(food => (
                    <span key={food} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {food}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interactions */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Drug/Nutrient Interactions</h5>
                <ul className="space-y-1">
                  {nutrient.interactions.map((interaction, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                      <span className="text-yellow-500 mt-1">⚠️</span>
                      <span>{interaction}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Testing */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Testing Frequency</h5>
                <div className="text-sm text-gray-700">{nutrient.testingFrequency}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderOverviewChart = () => {
    const chartData = nutrientStatus.map(nutrient => ({
      name: nutrient.nutrient,
      current: nutrient.currentValue,
      optimal: (nutrient.optimalRange.min + nutrient.optimalRange.max) / 2,
      status: nutrient.status
    }))

    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [value, name === 'current' ? 'Current' : 'Optimal']}
            />
            <Bar dataKey="current" fill="#3B82F6" name="Current" />
            <Bar dataKey="optimal" fill="#10B981" name="Optimal" opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const deficientCount = nutrientStatus.filter(n => n.status === 'deficient').length
  const insufficientCount = nutrientStatus.filter(n => n.status === 'insufficient').length

  return (
    <LabBaseWidget
      title="Nutrient Deficiency Analysis"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchNutrientStatus}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Apple className="h-5 w-5 text-green-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="overview">Overview</option>
            <option value="deficient">Deficient Only</option>
            <option value="all">All Nutrients</option>
          </select>
          <label className="flex items-center space-x-1 text-xs">
            <input
              type="checkbox"
              checked={includeSubclinical}
              onChange={(e) => setIncludeSubclinical(e.target.checked)}
              className="rounded"
            />
            <span>Subclinical</span>
          </label>
          {nutrientStatus.length > 0 && (
            <div className="flex items-center space-x-1">
              {deficientCount > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {deficientCount} deficient
                </span>
              )}
              {insufficientCount > 0 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  {insufficientCount} insufficient
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {nutrientStatus.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Apple className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-900">Nutrient Status Summary</h4>
              </div>
              <div className="text-sm text-green-700">
                Analyzed {nutrientStatus.length} essential nutrients
                {(deficientCount > 0 || insufficientCount > 0) && (
                  <span className="block mt-1">
                    {deficientCount} deficient, {insufficientCount} insufficient levels detected
                  </span>
                )}
              </div>
            </div>

            {/* Overview Chart */}
            {viewMode === 'overview' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Nutrient Levels Overview</h4>
                {renderOverviewChart()}
              </div>
            )}

            {/* Nutrient Cards */}
            <div className="space-y-3">
              {filteredNutrients.map(renderNutrientCard)}
            </div>

            {/* Educational Info */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Nutrient Optimization Tips</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Take supplements with appropriate meals for better absorption</li>
                <li>• Some nutrients compete for absorption - space them apart</li>
                <li>• Regular testing helps monitor progress and adjust dosing</li>
                <li>• Food sources are generally better absorbed than supplements</li>
                <li>• Consider genetic factors that may affect nutrient metabolism</li>
                <li>• Always consult healthcare providers before starting supplements</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Apple className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Nutrient Data</h3>
            <p className="text-gray-500">
              Nutrient analysis will appear when vitamin and mineral lab data is available
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabNutrientDeficiencyWidget
