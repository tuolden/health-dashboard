/**
 * Lab Hormone Balance Widget - Issue #13 Widget #47
 * 
 * Comprehensive hormone analysis with balance assessment and optimization recommendations
 */

import React, { useState, useEffect } from 'react'
import { Activity, Moon, Sun, Zap } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabHormoneBalanceWidgetProps extends LabWidgetProps {
  category?: 'thyroid' | 'reproductive' | 'adrenal' | 'metabolic' | 'all'
  gender?: 'male' | 'female'
}

interface HormoneCategory {
  name: string
  hormones: Hormone[]
  balanceScore: number
  interpretation: string
  recommendations: string[]
  icon: React.ReactNode
}

interface Hormone {
  name: string
  currentValue: number
  optimalRange: { min: number, max: number }
  units: string
  status: 'low' | 'optimal' | 'high'
  importance: 'critical' | 'important' | 'moderate'
  symptoms: string[]
  function: string
  balanceWith: string[]
  optimizationTips: string[]
}

export const LabHormoneBalanceWidget: React.FC<LabHormoneBalanceWidgetProps> = ({
  category = 'all',
  gender = 'female',
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [hormoneData, setHormoneData] = useState<HormoneCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchHormoneData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/labs/hormones?category=${category}&gender=${gender}&enhanced=true`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch hormone data')
      }

      const processedData = processHormoneData(result.data, gender)
      setHormoneData(processedData)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(processedData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching hormone data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processHormoneData = (data: any, gender: string): HormoneCategory[] => {
    // Mock hormone data - in real implementation, this would process actual lab data
    const mockCategories: HormoneCategory[] = [
      {
        name: 'Thyroid Hormones',
        balanceScore: 75,
        interpretation: 'Thyroid function is generally good with room for optimization',
        icon: <Activity className="h-5 w-5 text-blue-500" />,
        recommendations: [
          'Consider selenium supplementation for thyroid support',
          'Monitor iodine intake - avoid excess',
          'Manage stress to support thyroid function',
          'Regular exercise to boost metabolism'
        ],
        hormones: [
          {
            name: 'TSH',
            currentValue: 2.8,
            optimalRange: { min: 0.5, max: 2.0 },
            units: 'mIU/L',
            status: 'high',
            importance: 'critical',
            symptoms: ['Fatigue', 'Weight gain', 'Cold intolerance'],
            function: 'Stimulates thyroid hormone production',
            balanceWith: ['T3', 'T4', 'Reverse T3'],
            optimizationTips: ['Reduce stress', 'Support adrenals', 'Check for autoimmunity']
          },
          {
            name: 'Free T4',
            currentValue: 1.2,
            optimalRange: { min: 1.0, max: 1.8 },
            units: 'ng/dL',
            status: 'optimal',
            importance: 'critical',
            symptoms: [],
            function: 'Primary thyroid hormone, converts to T3',
            balanceWith: ['TSH', 'T3', 'Reverse T3'],
            optimizationTips: ['Support T4 to T3 conversion', 'Ensure adequate selenium']
          },
          {
            name: 'Free T3',
            currentValue: 2.8,
            optimalRange: { min: 3.0, max: 4.2 },
            units: 'pg/mL',
            status: 'low',
            importance: 'critical',
            symptoms: ['Low energy', 'Brain fog', 'Depression'],
            function: 'Active thyroid hormone, drives metabolism',
            balanceWith: ['T4', 'Reverse T3', 'Cortisol'],
            optimizationTips: ['Support T4 to T3 conversion', 'Address nutrient deficiencies']
          }
        ]
      },
      {
        name: 'Reproductive Hormones',
        balanceScore: 68,
        interpretation: gender === 'female' ? 'Hormonal imbalances affecting cycle and fertility' : 'Testosterone optimization needed',
        icon: gender === 'female' ? <Moon className="h-5 w-5 text-pink-500" /> : <Sun className="h-5 w-5 text-orange-500" />,
        recommendations: gender === 'female' ? [
          'Support progesterone production naturally',
          'Manage estrogen dominance through diet',
          'Consider seed cycling for hormone balance',
          'Stress management for cortisol balance'
        ] : [
          'Optimize testosterone through lifestyle',
          'Support natural testosterone production',
          'Address estrogen dominance in men',
          'Consider zinc and vitamin D supplementation'
        ],
        hormones: gender === 'female' ? [
          {
            name: 'Estradiol',
            currentValue: 180,
            optimalRange: { min: 50, max: 200 },
            units: 'pg/mL',
            status: 'optimal',
            importance: 'critical',
            symptoms: [],
            function: 'Primary estrogen, affects mood and cycle',
            balanceWith: ['Progesterone', 'Testosterone', 'SHBG'],
            optimizationTips: ['Support liver detoxification', 'Maintain healthy weight']
          },
          {
            name: 'Progesterone',
            currentValue: 8,
            optimalRange: { min: 15, max: 25 },
            units: 'ng/mL',
            status: 'low',
            importance: 'critical',
            symptoms: ['PMS', 'Irregular cycles', 'Anxiety', 'Sleep issues'],
            function: 'Balances estrogen, supports pregnancy',
            balanceWith: ['Estradiol', 'Cortisol', 'Insulin'],
            optimizationTips: ['Support ovulation', 'Manage stress', 'Adequate sleep']
          },
          {
            name: 'Testosterone',
            currentValue: 25,
            optimalRange: { min: 20, max: 80 },
            units: 'ng/dL',
            status: 'optimal',
            importance: 'important',
            symptoms: [],
            function: 'Supports libido, muscle, and mood',
            balanceWith: ['Estradiol', 'SHBG', 'DHEA'],
            optimizationTips: ['Strength training', 'Adequate protein', 'Healthy fats']
          }
        ] : [
          {
            name: 'Total Testosterone',
            currentValue: 450,
            optimalRange: { min: 600, max: 1000 },
            units: 'ng/dL',
            status: 'low',
            importance: 'critical',
            symptoms: ['Low libido', 'Fatigue', 'Muscle loss', 'Mood changes'],
            function: 'Primary male hormone for vitality',
            balanceWith: ['Estradiol', 'SHBG', 'DHT'],
            optimizationTips: ['Strength training', 'Optimize sleep', 'Manage stress']
          },
          {
            name: 'Free Testosterone',
            currentValue: 8.5,
            optimalRange: { min: 12, max: 25 },
            units: 'pg/mL',
            status: 'low',
            importance: 'critical',
            symptoms: ['Low energy', 'Poor recovery', 'Decreased motivation'],
            function: 'Bioavailable testosterone for cellular use',
            balanceWith: ['SHBG', 'Albumin', 'Estradiol'],
            optimizationTips: ['Lower SHBG naturally', 'Zinc supplementation']
          },
          {
            name: 'Estradiol',
            currentValue: 35,
            optimalRange: { min: 10, max: 30 },
            units: 'pg/mL',
            status: 'high',
            importance: 'important',
            symptoms: ['Gynecomastia', 'Water retention', 'Mood swings'],
            function: 'Estrogen in men, needs balance with testosterone',
            balanceWith: ['Testosterone', 'DHT', 'SHBG'],
            optimizationTips: ['Support estrogen metabolism', 'DIM supplementation']
          }
        ]
      },
      {
        name: 'Adrenal Hormones',
        balanceScore: 82,
        interpretation: 'Good adrenal function with healthy stress response',
        icon: <Zap className="h-5 w-5 text-yellow-500" />,
        recommendations: [
          'Maintain current stress management practices',
          'Continue regular sleep schedule',
          'Monitor cortisol rhythm periodically',
          'Support with adaptogenic herbs if needed'
        ],
        hormones: [
          {
            name: 'Cortisol (AM)',
            currentValue: 18,
            optimalRange: { min: 12, max: 25 },
            units: 'μg/dL',
            status: 'optimal',
            importance: 'critical',
            symptoms: [],
            function: 'Primary stress hormone, energy regulation',
            balanceWith: ['DHEA', 'Thyroid hormones', 'Insulin'],
            optimizationTips: ['Maintain healthy circadian rhythm', 'Stress management']
          },
          {
            name: 'DHEA-S',
            currentValue: 280,
            optimalRange: { min: 200, max: 500 },
            units: 'μg/dL',
            status: 'optimal',
            importance: 'important',
            symptoms: [],
            function: 'Anti-aging hormone, cortisol buffer',
            balanceWith: ['Cortisol', 'Testosterone', 'Estrogen'],
            optimizationTips: ['Regular exercise', 'Adequate sleep', 'Stress reduction']
          }
        ]
      }
    ]

    return category === 'all' ? mockCategories : mockCategories.filter(cat => 
      cat.name.toLowerCase().includes(category)
    )
  }

  useEffect(() => {
    fetchHormoneData()
  }, [category, gender])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return '#EF4444'
      case 'optimal': return '#10B981'
      case 'high': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  const renderRadarChart = (categoryData: HormoneCategory) => {
    const radarData = categoryData.hormones.map(hormone => {
      // Calculate score based on how close to optimal range
      const midOptimal = (hormone.optimalRange.min + hormone.optimalRange.max) / 2
      const range = hormone.optimalRange.max - hormone.optimalRange.min
      const distance = Math.abs(hormone.currentValue - midOptimal)
      const score = Math.max(0, 100 - (distance / range) * 100)

      return {
        hormone: hormone.name,
        score: Math.round(score),
        fullName: hormone.name
      }
    })

    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="hormone" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
            />
            <Radar
              name="Balance Score"
              dataKey="score"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderHormoneCard = (hormone: Hormone) => {
    const statusColor = getStatusColor(hormone.status)
    const isOptimal = hormone.status === 'optimal'

    return (
      <div key={hormone.name} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-900">{hormone.name}</h4>
            <p className="text-sm text-gray-600">{hormone.function}</p>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {formatLabValue(hormone.currentValue, hormone.units, 1)}
            </div>
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ 
                color: statusColor,
                backgroundColor: `${statusColor}20`
              }}
            >
              {hormone.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-600">Optimal Range:</span>
            <div className="font-medium">
              {formatLabValue(hormone.optimalRange.min, hormone.units, 1)} - {formatLabValue(hormone.optimalRange.max, hormone.units, 1)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Importance:</span>
            <span 
              className="ml-1 font-medium capitalize"
              style={{ 
                color: hormone.importance === 'critical' ? '#DC2626' : 
                       hormone.importance === 'important' ? '#F59E0B' : '#10B981'
              }}
            >
              {hormone.importance}
            </span>
          </div>
        </div>

        {/* Symptoms */}
        {hormone.symptoms.length > 0 && (
          <div className="mb-3">
            <div className="text-sm text-gray-600 mb-1">Associated Symptoms:</div>
            <div className="text-sm text-red-600">
              {hormone.symptoms.join(', ')}
            </div>
          </div>
        )}

        {/* Balance Relationships */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Balances With:</div>
          <div className="flex flex-wrap gap-1">
            {hormone.balanceWith.map(related => (
              <span key={related} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {related}
              </span>
            ))}
          </div>
        </div>

        {/* Optimization Tips */}
        {!isOptimal && (
          <div>
            <div className="text-sm text-gray-600 mb-1">Optimization Tips:</div>
            <ul className="space-y-1">
              {hormone.optimizationTips.slice(0, 2).map((tip, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const renderCategoryCard = (categoryData: HormoneCategory) => {
    const isSelected = selectedCategory === categoryData.name
    const scoreColor = categoryData.balanceScore >= 80 ? '#10B981' : 
                      categoryData.balanceScore >= 60 ? '#F59E0B' : '#EF4444'

    return (
      <div 
        key={categoryData.name}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedCategory(isSelected ? null : categoryData.name)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {categoryData.icon}
            <h3 className="font-medium text-gray-900">{categoryData.name}</h3>
          </div>
          <div 
            className="text-xl font-bold"
            style={{ color: scoreColor }}
          >
            {categoryData.balanceScore}/100
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">{categoryData.interpretation}</p>

        {/* Hormone Summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {categoryData.hormones.slice(0, 3).map(hormone => (
            <div key={hormone.name} className="text-center p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">{hormone.name}</div>
              <div 
                className="font-medium text-sm"
                style={{ color: getStatusColor(hormone.status) }}
              >
                {hormone.status}
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Radar Chart */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Hormone Balance Profile</h4>
                {renderRadarChart(categoryData)}
              </div>

              {/* Individual Hormones */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Individual Hormones</h4>
                <div className="space-y-3">
                  {categoryData.hormones.map(renderHormoneCard)}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Balance Optimization</h4>
                <ul className="space-y-2">
                  {categoryData.recommendations.map((rec, index) => (
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

  const overallScore = hormoneData.length > 0 ? 
    Math.round(hormoneData.reduce((sum, cat) => sum + cat.balanceScore, 0) / hormoneData.length) : 0

  return (
    <LabBaseWidget
      title="Hormone Balance Analysis"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchHormoneData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Activity className="h-5 w-5 text-purple-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Categories</option>
            <option value="thyroid">Thyroid</option>
            <option value="reproductive">Reproductive</option>
            <option value="adrenal">Adrenal</option>
            <option value="metabolic">Metabolic</option>
          </select>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          {hormoneData.length > 0 && (
            <div 
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ 
                color: overallScore >= 80 ? '#10B981' : 
                       overallScore >= 60 ? '#F59E0B' : '#EF4444',
                backgroundColor: overallScore >= 80 ? '#ECFDF5' : 
                                overallScore >= 60 ? '#FFFBEB' : '#FEF2F2'
              }}
            >
              {overallScore}/100
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {hormoneData.length > 0 ? (
          <>
            {/* Overall Summary */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-900">Hormone Balance Summary</h4>
              </div>
              <div className="text-sm text-purple-700">
                Overall hormone balance score: <strong>{overallScore}/100</strong>
                <span className="block mt-1">
                  Analyzed {hormoneData.reduce((sum, cat) => sum + cat.hormones.length, 0)} hormones across {hormoneData.length} categories
                </span>
              </div>
            </div>

            {/* Category Cards */}
            <div className="space-y-4">
              {hormoneData.map(renderCategoryCard)}
            </div>

            {/* Hormone Education */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Hormone Balance Principles</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Hormones work in complex networks and ratios, not isolation</li>
                <li>• Timing of testing matters - consider menstrual cycle and circadian rhythms</li>
                <li>• Lifestyle factors (sleep, stress, diet, exercise) profoundly affect hormones</li>
                <li>• Small changes can have cascading effects throughout the system</li>
                <li>• Bioidentical hormone therapy should be considered carefully with providers</li>
                <li>• Regular monitoring helps track progress and adjust interventions</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Hormone Data</h3>
            <p className="text-gray-500">
              Hormone analysis will appear when hormone lab data is available
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabHormoneBalanceWidget
