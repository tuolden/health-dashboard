/**
 * Lab Biomarkers Widget - Issue #13 Widget #44
 * 
 * Advanced biomarker analysis with aging, longevity, and performance metrics
 */

import React, { useState, useEffect } from 'react'
import { Activity, Heart, Brain, Zap } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabBiomarkersWidgetProps extends LabWidgetProps {
  category?: 'longevity' | 'performance' | 'cognitive' | 'metabolic' | 'all'
}

interface BiomarkerCategory {
  name: string
  biomarkers: Biomarker[]
  score: number
  interpretation: string
  recommendations: string[]
}

interface Biomarker {
  name: string
  value: number
  optimalRange: { min: number, max: number }
  units: string
  score: number // 0-100
  importance: 'high' | 'medium' | 'low'
  category: string
  description: string
  trend?: 'improving' | 'stable' | 'declining'
}

export const LabBiomarkersWidget: React.FC<LabBiomarkersWidgetProps> = ({
  category = 'all',
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [biomarkerData, setBiomarkerData] = useState<BiomarkerCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchBiomarkers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/labs/biomarkers?category=${category}&enhanced=true`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch biomarker data')
      }

      const processedData = processBiomarkerData(result.data)
      setBiomarkerData(processedData)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(processedData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching biomarkers:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processBiomarkerData = (data: any): BiomarkerCategory[] => {
    // Mock biomarker data - in real implementation, this would process actual lab data
    const mockCategories: BiomarkerCategory[] = [
      {
        name: 'Longevity Markers',
        score: 78,
        interpretation: 'Good longevity potential with room for improvement',
        recommendations: [
          'Optimize vitamin D levels through supplementation',
          'Consider intermittent fasting to improve metabolic markers',
          'Increase omega-3 intake for cardiovascular health'
        ],
        biomarkers: [
          {
            name: 'Telomere Length',
            value: 7.2,
            optimalRange: { min: 6.5, max: 8.5 },
            units: 'kb',
            score: 85,
            importance: 'high',
            category: 'longevity',
            description: 'Cellular aging marker',
            trend: 'stable'
          },
          {
            name: 'IGF-1',
            value: 180,
            optimalRange: { min: 150, max: 250 },
            units: 'ng/mL',
            score: 75,
            importance: 'high',
            category: 'longevity',
            description: 'Growth hormone pathway marker',
            trend: 'improving'
          },
          {
            name: 'NAD+',
            value: 45,
            optimalRange: { min: 40, max: 80 },
            units: 'μM',
            score: 60,
            importance: 'medium',
            category: 'longevity',
            description: 'Cellular energy metabolism',
            trend: 'declining'
          }
        ]
      },
      {
        name: 'Performance Markers',
        score: 82,
        interpretation: 'Excellent athletic performance potential',
        recommendations: [
          'Maintain current training regimen',
          'Monitor lactate threshold during intense training',
          'Consider creatine supplementation for power sports'
        ],
        biomarkers: [
          {
            name: 'VO2 Max Estimate',
            value: 52,
            optimalRange: { min: 45, max: 65 },
            units: 'mL/kg/min',
            score: 85,
            importance: 'high',
            category: 'performance',
            description: 'Cardiovascular fitness marker',
            trend: 'improving'
          },
          {
            name: 'Lactate Threshold',
            value: 4.2,
            optimalRange: { min: 3.5, max: 5.0 },
            units: 'mmol/L',
            score: 80,
            importance: 'high',
            category: 'performance',
            description: 'Anaerobic capacity marker',
            trend: 'stable'
          },
          {
            name: 'Creatine Kinase',
            value: 180,
            optimalRange: { min: 50, max: 200 },
            units: 'U/L',
            score: 85,
            importance: 'medium',
            category: 'performance',
            description: 'Muscle damage/recovery marker',
            trend: 'stable'
          }
        ]
      },
      {
        name: 'Cognitive Markers',
        score: 74,
        interpretation: 'Good cognitive health with optimization opportunities',
        recommendations: [
          'Increase omega-3 fatty acids for brain health',
          'Consider B-vitamin complex supplementation',
          'Optimize sleep quality for cognitive recovery'
        ],
        biomarkers: [
          {
            name: 'BDNF',
            value: 28,
            optimalRange: { min: 25, max: 40 },
            units: 'ng/mL',
            score: 70,
            importance: 'high',
            category: 'cognitive',
            description: 'Brain-derived neurotrophic factor',
            trend: 'stable'
          },
          {
            name: 'Homocysteine',
            value: 8.5,
            optimalRange: { min: 5, max: 10 },
            units: 'μmol/L',
            score: 75,
            importance: 'medium',
            category: 'cognitive',
            description: 'Neuroinflammation marker',
            trend: 'improving'
          },
          {
            name: 'Omega-3 Index',
            value: 6.2,
            optimalRange: { min: 8, max: 12 },
            units: '%',
            score: 65,
            importance: 'high',
            category: 'cognitive',
            description: 'Brain health fatty acid marker',
            trend: 'declining'
          }
        ]
      },
      {
        name: 'Metabolic Markers',
        score: 88,
        interpretation: 'Excellent metabolic health',
        recommendations: [
          'Maintain current dietary patterns',
          'Continue regular exercise routine',
          'Monitor insulin sensitivity quarterly'
        ],
        biomarkers: [
          {
            name: 'HOMA-IR',
            value: 1.2,
            optimalRange: { min: 0.5, max: 1.5 },
            units: 'index',
            score: 90,
            importance: 'high',
            category: 'metabolic',
            description: 'Insulin resistance marker',
            trend: 'stable'
          },
          {
            name: 'Adiponectin',
            value: 12.5,
            optimalRange: { min: 10, max: 20 },
            units: 'μg/mL',
            score: 85,
            importance: 'medium',
            category: 'metabolic',
            description: 'Fat metabolism hormone',
            trend: 'improving'
          },
          {
            name: 'Leptin',
            value: 8.2,
            optimalRange: { min: 5, max: 15 },
            units: 'ng/mL',
            score: 90,
            importance: 'medium',
            category: 'metabolic',
            description: 'Satiety hormone',
            trend: 'stable'
          }
        ]
      }
    ]

    return category === 'all' ? mockCategories : mockCategories.filter(cat => 
      cat.name.toLowerCase().includes(category)
    )
  }

  useEffect(() => {
    fetchBiomarkers()
  }, [category])

  const renderRadarChart = (categoryData: BiomarkerCategory) => {
    const radarData = categoryData.biomarkers.map(biomarker => ({
      biomarker: biomarker.name.split(' ')[0], // Shortened name for chart
      score: biomarker.score,
      fullName: biomarker.name
    }))

    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="biomarker" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
            />
            <Radar
              name="Score"
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

  const renderBiomarkerCard = (biomarker: Biomarker) => {
    const scoreColor = biomarker.score >= 80 ? '#10B981' : 
                      biomarker.score >= 60 ? '#F59E0B' : '#EF4444'

    const trendIcons = {
      improving: '↗️',
      stable: '→',
      declining: '↘️'
    }

    const isOptimal = biomarker.value >= biomarker.optimalRange.min && 
                     biomarker.value <= biomarker.optimalRange.max

    return (
      <div key={biomarker.name} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-900">{biomarker.name}</h4>
            <p className="text-sm text-gray-600">{biomarker.description}</p>
          </div>
          <div className="text-right">
            <div 
              className="text-lg font-bold"
              style={{ color: scoreColor }}
            >
              {biomarker.score}/100
            </div>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <span>{biomarker.importance}</span>
              {biomarker.trend && <span>{trendIcons[biomarker.trend]}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-500">Current Value</div>
            <div className="font-semibold">
              {formatLabValue(biomarker.value, biomarker.units, 1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Optimal Range</div>
            <div className="font-semibold">
              {formatLabValue(biomarker.optimalRange.min, biomarker.units, 1)} - {formatLabValue(biomarker.optimalRange.max, biomarker.units, 1)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Optimization Score</span>
            <span className="text-xs font-medium" style={{ color: scoreColor }}>
              {biomarker.score}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${biomarker.score}%`, 
                backgroundColor: scoreColor 
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-xs">
          <span 
            className={`px-2 py-1 rounded-full font-medium ${
              isOptimal ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {isOptimal ? 'Optimal' : 'Needs Optimization'}
          </span>
          {biomarker.trend && (
            <span className="text-gray-500 capitalize">
              {biomarker.trend}
            </span>
          )}
        </div>
      </div>
    )
  }

  const renderCategoryCard = (categoryData: BiomarkerCategory) => {
    const scoreColor = categoryData.score >= 80 ? '#10B981' : 
                      categoryData.score >= 60 ? '#F59E0B' : '#EF4444'

    const isSelected = selectedCategory === categoryData.name

    return (
      <div 
        key={categoryData.name}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedCategory(isSelected ? null : categoryData.name)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">{categoryData.name}</h3>
          <div 
            className="text-xl font-bold"
            style={{ color: scoreColor }}
          >
            {categoryData.score}/100
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">{categoryData.interpretation}</p>

        {/* Biomarker Summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {categoryData.biomarkers.slice(0, 3).map(biomarker => (
            <div key={biomarker.name} className="text-center p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">{biomarker.name.split(' ')[0]}</div>
              <div 
                className="font-medium text-sm"
                style={{ 
                  color: biomarker.score >= 80 ? '#10B981' : 
                         biomarker.score >= 60 ? '#F59E0B' : '#EF4444'
                }}
              >
                {biomarker.score}
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
                <h4 className="font-medium text-gray-900 mb-3">Biomarker Profile</h4>
                {renderRadarChart(categoryData)}
              </div>

              {/* Individual Biomarkers */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Individual Biomarkers</h4>
                <div className="space-y-3">
                  {categoryData.biomarkers.map(renderBiomarkerCard)}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Optimization Recommendations</h4>
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

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.includes('Longevity')) return <Heart className="h-5 w-5 text-red-500" />
    if (categoryName.includes('Performance')) return <Zap className="h-5 w-5 text-yellow-500" />
    if (categoryName.includes('Cognitive')) return <Brain className="h-5 w-5 text-purple-500" />
    if (categoryName.includes('Metabolic')) return <Activity className="h-5 w-5 text-green-500" />
    return <Activity className="h-5 w-5 text-blue-500" />
  }

  const overallScore = biomarkerData.length > 0 ? 
    Math.round(biomarkerData.reduce((sum, cat) => sum + cat.score, 0) / biomarkerData.length) : 0

  return (
    <LabBaseWidget
      title="Advanced Biomarkers"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchBiomarkers}
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
            <option value="longevity">Longevity</option>
            <option value="performance">Performance</option>
            <option value="cognitive">Cognitive</option>
            <option value="metabolic">Metabolic</option>
          </select>
          {biomarkerData.length > 0 && (
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
        {biomarkerData.length > 0 ? (
          <>
            {/* Overall Summary */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-900">Biomarker Analysis Summary</h4>
              </div>
              <div className="text-sm text-purple-700">
                Overall optimization score: <strong>{overallScore}/100</strong>
                <span className="block mt-1">
                  Analyzed {biomarkerData.reduce((sum, cat) => sum + cat.biomarkers.length, 0)} advanced biomarkers across {biomarkerData.length} categories
                </span>
              </div>
            </div>

            {/* Category Cards */}
            <div className="space-y-4">
              {biomarkerData.map(renderCategoryCard)}
            </div>

            {/* Biomarker Education */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">About Advanced Biomarkers</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Advanced biomarkers provide insights beyond standard lab tests</li>
                <li>• Longevity markers help assess biological aging and lifespan potential</li>
                <li>• Performance markers optimize athletic and physical capabilities</li>
                <li>• Cognitive markers support brain health and mental performance</li>
                <li>• Metabolic markers reveal deep metabolic health insights</li>
                <li>• Regular monitoring enables precision health optimization</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Biomarker Data</h3>
            <p className="text-gray-500">
              Advanced biomarker analysis will appear when specialized lab data is available
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabBiomarkersWidget
