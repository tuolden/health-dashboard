/**
 * Lab Personalized Recommendations Widget - Issue #13 Widget #51
 * 
 * AI-powered personalized recommendations based on individual health profile
 */

import React, { useState, useEffect } from 'react'
import { User, Lightbulb, Calendar, Star, CheckCircle, Clock } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps } from './types'

interface LabPersonalizedRecommendationsWidgetProps extends LabWidgetProps {
  profileData?: UserProfile
}

interface UserProfile {
  age: number
  gender: 'male' | 'female'
  weight: number
  height: number
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  healthGoals: string[]
  medicalHistory: string[]
  currentMedications: string[]
  allergies: string[]
}

interface PersonalizedRecommendation {
  id: string
  category: 'nutrition' | 'lifestyle' | 'supplementation' | 'medical' | 'monitoring'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  rationale: string
  personalizationFactors: string[]
  actionSteps: ActionStep[]
  expectedOutcomes: string[]
  timeframe: string
  difficulty: 'easy' | 'moderate' | 'challenging'
  confidence: number
  relatedTests: string[]
  contraindications?: string[]
}

interface ActionStep {
  step: number
  action: string
  timeline: string
  resources?: string[]
}

export const LabPersonalizedRecommendationsWidget: React.FC<LabPersonalizedRecommendationsWidgetProps> = ({
  profileData,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchPersonalizedRecommendations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/labs/personalized-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileData })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch personalized recommendations')
      }

      const processedRecommendations = processRecommendations(result.data, profileData)
      setRecommendations(processedRecommendations)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(processedRecommendations)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching personalized recommendations:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processRecommendations = (data: any, profile?: UserProfile): PersonalizedRecommendation[] => {
    // Mock personalized recommendations - in real implementation, this would use AI/ML
    const mockProfile: UserProfile = profile || {
      age: 35,
      gender: 'female',
      weight: 140,
      height: 165,
      activityLevel: 'moderate',
      healthGoals: ['weight_management', 'energy_optimization', 'longevity'],
      medicalHistory: ['hypothyroidism'],
      currentMedications: ['levothyroxine'],
      allergies: ['shellfish']
    }

    const mockRecommendations: PersonalizedRecommendation[] = [
      {
        id: 'rec-1',
        category: 'supplementation',
        priority: 'high',
        title: 'Optimize Vitamin D for Your Profile',
        description: 'Based on your age, location, and current levels, increase vitamin D3 supplementation with personalized dosing.',
        rationale: 'Women over 30 with moderate activity levels require higher vitamin D for bone health and immune function.',
        personalizationFactors: [
          'Age: 35 years (increased requirements)',
          'Gender: Female (higher osteoporosis risk)',
          'Activity level: Moderate (increased needs)',
          'Current level: 28 ng/mL (suboptimal)'
        ],
        actionSteps: [
          { step: 1, action: 'Increase vitamin D3 to 3000 IU daily', timeline: 'Start immediately' },
          { step: 2, action: 'Take with fat-containing meal for absorption', timeline: 'Daily with breakfast or lunch' },
          { step: 3, action: 'Retest 25(OH)D levels', timeline: 'In 8-10 weeks' },
          { step: 4, action: 'Adjust dose based on results', timeline: 'After retest' }
        ],
        expectedOutcomes: [
          'Target level: 50-70 ng/mL within 3 months',
          'Improved bone health markers',
          'Enhanced immune function',
          'Better mood and energy levels'
        ],
        timeframe: '3 months',
        difficulty: 'easy',
        confidence: 0.89,
        relatedTests: ['Vitamin D', 'Calcium', 'PTH'],
        contraindications: ['Hypercalcemia', 'Kidney stones']
      },
      {
        id: 'rec-2',
        category: 'nutrition',
        priority: 'high',
        title: 'Thyroid-Supporting Nutrition Protocol',
        description: 'Personalized nutrition plan to support thyroid function while on levothyroxine therapy.',
        rationale: 'Your hypothyroidism and medication require specific nutritional considerations for optimal thyroid function.',
        personalizationFactors: [
          'Medical history: Hypothyroidism',
          'Current medication: Levothyroxine',
          'Age and gender: Increased thyroid support needs',
          'Activity level: Moderate (affects metabolism)'
        ],
        actionSteps: [
          { step: 1, action: 'Increase selenium-rich foods (Brazil nuts, seafood)', timeline: 'Start this week' },
          { step: 2, action: 'Ensure adequate iodine from sea vegetables', timeline: 'Add to weekly meal plan' },
          { step: 3, action: 'Avoid goitrogenic foods 2 hours before/after medication', timeline: 'Daily timing adjustment' },
          { step: 4, action: 'Include tyrosine-rich proteins (lean meats, eggs)', timeline: 'Daily meal planning' }
        ],
        expectedOutcomes: [
          'Improved thyroid hormone conversion',
          'Better medication absorption',
          'Enhanced energy levels',
          'Optimized TSH and T3 levels'
        ],
        timeframe: '6-8 weeks',
        difficulty: 'moderate',
        confidence: 0.82,
        relatedTests: ['TSH', 'Free T3', 'Free T4', 'Reverse T3'],
        contraindications: ['Shellfish allergy (avoid iodine from seafood)']
      },
      {
        id: 'rec-3',
        category: 'lifestyle',
        priority: 'medium',
        title: 'Personalized Exercise Protocol for Metabolic Health',
        description: 'Tailored exercise plan based on your activity level and health goals for optimal lab improvements.',
        rationale: 'Your moderate activity level and weight management goals require specific exercise modifications.',
        personalizationFactors: [
          'Current activity: Moderate level',
          'Health goals: Weight management, energy optimization',
          'Age: 35 (metabolic considerations)',
          'Gender: Female (hormonal considerations)'
        ],
        actionSteps: [
          { step: 1, action: 'Add 2 resistance training sessions weekly', timeline: 'Start next week' },
          { step: 2, action: 'Incorporate HIIT 1-2x per week', timeline: 'Week 2-3' },
          { step: 3, action: 'Maintain current cardio but add variety', timeline: 'Ongoing' },
          { step: 4, action: 'Track heart rate zones during workouts', timeline: 'Use fitness tracker' }
        ],
        expectedOutcomes: [
          'Improved insulin sensitivity',
          'Better lipid profile',
          'Enhanced metabolic rate',
          'Optimized body composition'
        ],
        timeframe: '12 weeks',
        difficulty: 'moderate',
        confidence: 0.76,
        relatedTests: ['Glucose', 'Insulin', 'HDL Cholesterol', 'Triglycerides']
      },
      {
        id: 'rec-4',
        category: 'monitoring',
        priority: 'medium',
        title: 'Personalized Lab Testing Schedule',
        description: 'Customized testing frequency based on your health profile and risk factors.',
        rationale: 'Your thyroid condition and health goals require specific monitoring intervals.',
        personalizationFactors: [
          'Hypothyroidism: Requires regular thyroid monitoring',
          'Age 35: Baseline screening recommendations',
          'Health goals: Comprehensive tracking needed',
          'Medication: Levothyroxine monitoring required'
        ],
        actionSteps: [
          { step: 1, action: 'Thyroid panel every 6 months', timeline: 'Schedule next appointment' },
          { step: 2, action: 'Comprehensive metabolic panel quarterly', timeline: 'Every 3 months' },
          { step: 3, action: 'Lipid panel every 6 months', timeline: 'Coordinate with thyroid testing' },
          { step: 4, action: 'Vitamin D and B12 annually', timeline: 'Annual wellness visit' }
        ],
        expectedOutcomes: [
          'Early detection of changes',
          'Optimized medication dosing',
          'Proactive health management',
          'Better long-term outcomes'
        ],
        timeframe: 'Ongoing',
        difficulty: 'easy',
        confidence: 0.95,
        relatedTests: ['TSH', 'Free T4', 'Glucose', 'Lipid Panel', 'Vitamin D', 'B12']
      },
      {
        id: 'rec-5',
        category: 'medical',
        priority: 'low',
        title: 'Consider Advanced Thyroid Testing',
        description: 'Expanded thyroid panel to optimize treatment based on your specific profile.',
        rationale: 'Standard TSH monitoring may not capture full thyroid function picture for optimal health.',
        personalizationFactors: [
          'Current hypothyroidism treatment',
          'Age and gender: Higher risk for autoimmune thyroid',
          'Health goals: Energy optimization',
          'Family history considerations'
        ],
        actionSteps: [
          { step: 1, action: 'Discuss with endocrinologist', timeline: 'Next appointment' },
          { step: 2, action: 'Consider Free T3 and Reverse T3 testing', timeline: 'If symptoms persist' },
          { step: 3, action: 'Evaluate thyroid antibodies (TPO, TgAb)', timeline: 'Annual screening' },
          { step: 4, action: 'Assess need for T3 supplementation', timeline: 'Based on results' }
        ],
        expectedOutcomes: [
          'More precise thyroid management',
          'Improved energy and metabolism',
          'Better symptom control',
          'Optimized medication regimen'
        ],
        timeframe: '3-6 months',
        difficulty: 'moderate',
        confidence: 0.71,
        relatedTests: ['Free T3', 'Reverse T3', 'TPO Antibodies', 'Thyroglobulin Antibodies']
      }
    ]

    return mockRecommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) return bPriority - aPriority
      return b.confidence - a.confidence
    })
  }

  useEffect(() => {
    fetchPersonalizedRecommendations()
  }, [profileData])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#DC2626'
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'nutrition': return '🥗'
      case 'lifestyle': return '🏃‍♀️'
      case 'supplementation': return '💊'
      case 'medical': return '🩺'
      case 'monitoring': return '📊'
      default: return '💡'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981'
      case 'moderate': return '#F59E0B'
      case 'challenging': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const filteredRecommendations = filterCategory === 'all' ? 
    recommendations : 
    recommendations.filter(rec => rec.category === filterCategory)

  const renderRecommendationCard = (rec: PersonalizedRecommendation) => {
    const isSelected = selectedRecommendation === rec.id
    const priorityColor = getPriorityColor(rec.priority)
    const difficultyColor = getDifficultyColor(rec.difficulty)

    return (
      <div 
        key={rec.id}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedRecommendation(isSelected ? null : rec.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-2">
            <span className="text-lg">{getCategoryIcon(rec.category)}</span>
            <div>
              <h4 className="font-medium text-gray-900">{rec.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
            </div>
          </div>
          <div className="text-right">
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ 
                color: priorityColor,
                backgroundColor: `${priorityColor}20`
              }}
            >
              {rec.priority}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              {(rec.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-600">Category:</span>
            <span className="ml-1 font-medium capitalize">{rec.category}</span>
          </div>
          <div>
            <span className="text-gray-600">Timeframe:</span>
            <span className="ml-1 font-medium">{rec.timeframe}</span>
          </div>
          <div>
            <span className="text-gray-600">Difficulty:</span>
            <span 
              className="ml-1 font-medium capitalize"
              style={{ color: difficultyColor }}
            >
              {rec.difficulty}
            </span>
          </div>
        </div>

        {/* Rationale */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Why This is Personalized for You:</div>
          <div className="text-sm text-gray-700">{rec.rationale}</div>
        </div>

        {/* First Action Step Preview */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">First Step:</div>
          <div className="text-sm text-gray-700">
            {rec.actionSteps[0]?.action}
          </div>
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Personalization Factors */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Personalization Factors</h5>
                <ul className="space-y-1">
                  {rec.personalizationFactors.map((factor, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                      <User className="h-3 w-3 text-blue-500 mt-1" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Steps */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Step-by-Step Action Plan</h5>
                <div className="space-y-3">
                  {rec.actionSteps.map(step => (
                    <div key={step.step} className="flex items-start space-x-3 p-3 bg-blue-50 rounded">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">{step.action}</div>
                        <div className="text-sm text-blue-700 mt-1">Timeline: {step.timeline}</div>
                        {step.resources && (
                          <div className="text-xs text-blue-600 mt-1">
                            Resources: {step.resources.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Outcomes */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Expected Outcomes</h5>
                <ul className="space-y-1">
                  {rec.expectedOutcomes.map((outcome, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                      <Star className="h-3 w-3 text-yellow-500 mt-1" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related Tests */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Related Lab Tests</h5>
                <div className="flex flex-wrap gap-1">
                  {rec.relatedTests.map(test => (
                    <span key={test} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {test}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contraindications */}
              {rec.contraindications && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Important Considerations</h5>
                  <ul className="space-y-1">
                    {rec.contraindications.map((contraindication, index) => (
                      <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                        <span className="text-red-500 mt-1">⚠️</span>
                        <span>{contraindication}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const criticalCount = recommendations.filter(r => r.priority === 'critical').length
  const highCount = recommendations.filter(r => r.priority === 'high').length

  return (
    <LabBaseWidget
      title="Personalized Recommendations"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchPersonalizedRecommendations}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<User className="h-5 w-5 text-purple-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Categories</option>
            <option value="nutrition">Nutrition</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="supplementation">Supplements</option>
            <option value="medical">Medical</option>
            <option value="monitoring">Monitoring</option>
          </select>
          {recommendations.length > 0 && (
            <div className="flex items-center space-x-1">
              {criticalCount > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {criticalCount} critical
                </span>
              )}
              {highCount > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                  {highCount} high priority
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {filteredRecommendations.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-purple-900">Personalized for Your Profile</h4>
              </div>
              <div className="text-sm text-purple-700">
                {recommendations.length} AI-generated recommendations tailored to your health profile
                {criticalCount > 0 && (
                  <span className="block mt-1 text-red-700 font-medium">
                    {criticalCount} critical recommendations need immediate attention
                  </span>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              {filteredRecommendations.map(renderRecommendationCard)}
            </div>

            {/* Disclaimer */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-700">
                <strong>Personalized Recommendations:</strong> These recommendations are generated 
                based on your individual health profile, lab results, and goals. Always consult 
                with healthcare professionals before implementing significant changes to your 
                health regimen, especially regarding medications or medical conditions.
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Personalized Recommendations</h3>
            <p className="text-gray-500">
              Complete your health profile to receive personalized recommendations
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabPersonalizedRecommendationsWidget
