/**
 * Lab AI Insights Widget - Issue #13 Widget #49
 * 
 * AI-powered insights and recommendations based on comprehensive lab analysis
 */

import React, { useState, useEffect } from 'react'
import { Brain, Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps } from './types'

interface LabAIInsightsWidgetProps extends LabWidgetProps {
  analysisDepth?: 'basic' | 'comprehensive' | 'advanced'
}

interface AIInsight {
  id: string
  type: 'pattern' | 'risk' | 'optimization' | 'prediction' | 'correlation'
  priority: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  title: string
  description: string
  evidence: string[]
  recommendations: Recommendation[]
  affectedTests: string[]
  timeframe: string
  impact: 'immediate' | 'short_term' | 'long_term'
}

interface Recommendation {
  action: string
  rationale: string
  timeline: string
  difficulty: 'easy' | 'moderate' | 'challenging'
  expectedOutcome: string
}

export const LabAIInsightsWidget: React.FC<LabAIInsightsWidgetProps> = ({
  analysisDepth = 'comprehensive',
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchAIInsights = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/labs/ai-insights?depth=${analysisDepth}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch AI insights')
      }

      const processedInsights = processAIInsights(result.data)
      setInsights(processedInsights)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(processedInsights)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching AI insights:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processAIInsights = (data: any): AIInsight[] => {
    // Mock AI insights - in real implementation, this would process actual AI analysis
    const mockInsights: AIInsight[] = [
      {
        id: 'insight-1',
        type: 'pattern',
        priority: 'high',
        confidence: 0.89,
        title: 'Emerging Metabolic Syndrome Pattern',
        description: 'AI analysis detected early signs of metabolic syndrome based on converging lab trends over the past 6 months.',
        evidence: [
          'Fasting glucose trending upward (85→98 mg/dL)',
          'HDL cholesterol declining (65→52 mg/dL)',
          'Triglycerides increasing (120→165 mg/dL)',
          'Waist-to-hip ratio correlation with insulin resistance markers'
        ],
        recommendations: [
          {
            action: 'Implement intermittent fasting protocol',
            rationale: 'Can improve insulin sensitivity by 20-30% within 8 weeks',
            timeline: 'Start within 2 weeks',
            difficulty: 'moderate',
            expectedOutcome: 'Improved glucose control and lipid profile'
          },
          {
            action: 'Increase resistance training frequency',
            rationale: 'Muscle building improves glucose uptake and metabolic rate',
            timeline: 'Begin immediately',
            difficulty: 'moderate',
            expectedOutcome: 'Better insulin sensitivity within 6 weeks'
          }
        ],
        affectedTests: ['Glucose', 'HDL Cholesterol', 'Triglycerides', 'Insulin'],
        timeframe: '6 months',
        impact: 'long_term'
      },
      {
        id: 'insight-2',
        type: 'optimization',
        priority: 'medium',
        confidence: 0.76,
        title: 'Vitamin D Optimization Opportunity',
        description: 'Current vitamin D levels are suboptimal for immune function and bone health. AI models predict 40% improvement potential.',
        evidence: [
          'Current 25(OH)D level: 28 ng/mL (suboptimal)',
          'Seasonal pattern shows 35% decline in winter months',
          'Correlation with increased inflammatory markers',
          'Genetic variants suggest higher vitamin D requirements'
        ],
        recommendations: [
          {
            action: 'Increase vitamin D3 supplementation to 4000 IU daily',
            rationale: 'Based on body weight and current levels, higher dose needed',
            timeline: 'Start immediately',
            difficulty: 'easy',
            expectedOutcome: 'Target level 50-70 ng/mL within 3 months'
          },
          {
            action: 'Add vitamin K2 (MK-7) supplementation',
            rationale: 'Synergistic with vitamin D for bone and cardiovascular health',
            timeline: 'Start with vitamin D',
            difficulty: 'easy',
            expectedOutcome: 'Enhanced vitamin D utilization'
          }
        ],
        affectedTests: ['Vitamin D', 'Calcium', 'PTH', 'CRP'],
        timeframe: '3 months',
        impact: 'short_term'
      },
      {
        id: 'insight-3',
        type: 'prediction',
        priority: 'critical',
        confidence: 0.82,
        title: 'Cardiovascular Risk Trajectory',
        description: 'AI predictive models indicate 65% increased cardiovascular risk within 5 years based on current lab trends.',
        evidence: [
          'LDL cholesterol above optimal despite normal range',
          'Lp(a) levels in 90th percentile for population',
          'CRP indicating chronic low-grade inflammation',
          'Family history and genetic risk factors'
        ],
        recommendations: [
          {
            action: 'Initiate aggressive lipid management',
            rationale: 'Early intervention can reduce risk by 40-50%',
            timeline: 'Consult physician within 2 weeks',
            difficulty: 'moderate',
            expectedOutcome: 'LDL <70 mg/dL, reduced inflammation'
          },
          {
            action: 'Implement Mediterranean diet protocol',
            rationale: 'Proven to reduce cardiovascular events by 30%',
            timeline: 'Start immediately',
            difficulty: 'moderate',
            expectedOutcome: 'Improved lipid profile and inflammation'
          }
        ],
        affectedTests: ['LDL Cholesterol', 'Lp(a)', 'CRP', 'Homocysteine'],
        timeframe: '5 years',
        impact: 'long_term'
      },
      {
        id: 'insight-4',
        type: 'correlation',
        priority: 'medium',
        confidence: 0.71,
        title: 'Sleep-Hormone Disruption Pattern',
        description: 'AI detected strong correlation between poor sleep quality and hormonal imbalances affecting metabolism.',
        evidence: [
          'Cortisol rhythm disruption correlates with sleep data',
          'Testosterone levels 25% below optimal for age',
          'Growth hormone markers suggest poor sleep quality',
          'Melatonin production appears compromised'
        ],
        recommendations: [
          {
            action: 'Implement sleep hygiene protocol',
            rationale: 'Can improve hormone production by 15-25%',
            timeline: 'Start this week',
            difficulty: 'easy',
            expectedOutcome: 'Better hormone balance within 4 weeks'
          },
          {
            action: 'Consider magnesium glycinate supplementation',
            rationale: 'Supports sleep quality and hormone production',
            timeline: 'Start immediately',
            difficulty: 'easy',
            expectedOutcome: 'Improved sleep depth and recovery'
          }
        ],
        affectedTests: ['Cortisol', 'Testosterone', 'Growth Hormone', 'Melatonin'],
        timeframe: '2 months',
        impact: 'short_term'
      },
      {
        id: 'insight-5',
        type: 'risk',
        priority: 'high',
        confidence: 0.85,
        title: 'Thyroid Function Decline Risk',
        description: 'AI analysis suggests 70% probability of developing subclinical hypothyroidism within 18 months.',
        evidence: [
          'TSH trending upward over 12 months (1.8→2.6 mIU/L)',
          'Free T3 at lower end of normal range',
          'Reverse T3 elevated suggesting conversion issues',
          'Symptoms align with early thyroid dysfunction'
        ],
        recommendations: [
          {
            action: 'Comprehensive thyroid panel including antibodies',
            rationale: 'Rule out autoimmune thyroid disease early',
            timeline: 'Schedule within 4 weeks',
            difficulty: 'easy',
            expectedOutcome: 'Early detection and intervention if needed'
          },
          {
            action: 'Support thyroid function with selenium and iodine',
            rationale: 'Key nutrients for thyroid hormone production',
            timeline: 'Start after comprehensive testing',
            difficulty: 'easy',
            expectedOutcome: 'Optimized thyroid function'
          }
        ],
        affectedTests: ['TSH', 'Free T3', 'Free T4', 'Reverse T3', 'TPO Antibodies'],
        timeframe: '18 months',
        impact: 'long_term'
      }
    ]

    return mockInsights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) return bPriority - aPriority
      return b.confidence - a.confidence
    })
  }

  useEffect(() => {
    fetchAIInsights()
  }, [analysisDepth])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#DC2626'
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <TrendingUp className="h-4 w-4" />
      case 'risk': return <AlertTriangle className="h-4 w-4" />
      case 'optimization': return <Lightbulb className="h-4 w-4" />
      case 'prediction': return <Brain className="h-4 w-4" />
      case 'correlation': return <CheckCircle className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const filteredInsights = filterType === 'all' ? insights : insights.filter(insight => insight.type === filterType)

  const renderInsightCard = (insight: AIInsight) => {
    const isSelected = selectedInsight === insight.id
    const priorityColor = getPriorityColor(insight.priority)

    return (
      <div 
        key={insight.id}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedInsight(isSelected ? null : insight.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-2">
            <div className="mt-1" style={{ color: priorityColor }}>
              {getTypeIcon(insight.type)}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{insight.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
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
              {insight.priority}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              {(insight.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-1 font-medium capitalize">{insight.type}</span>
          </div>
          <div>
            <span className="text-gray-600">Timeframe:</span>
            <span className="ml-1 font-medium">{insight.timeframe}</span>
          </div>
          <div>
            <span className="text-gray-600">Impact:</span>
            <span className="ml-1 font-medium capitalize">{insight.impact.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Affected Tests */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Affected Tests:</div>
          <div className="flex flex-wrap gap-1">
            {insight.affectedTests.slice(0, isSelected ? undefined : 3).map(test => (
              <span key={test} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {test}
              </span>
            ))}
            {!isSelected && insight.affectedTests.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                +{insight.affectedTests.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Top Recommendation Preview */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Primary Recommendation:</div>
          <div className="text-sm text-gray-700">
            {insight.recommendations[0]?.action}
          </div>
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Evidence */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Supporting Evidence</h5>
                <ul className="space-y-2">
                  {insight.evidence.map((evidence, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{evidence}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* All Recommendations */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">AI Recommendations</h5>
                <div className="space-y-3">
                  {insight.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded border border-green-200">
                      <div className="flex items-start justify-between mb-2">
                        <h6 className="font-medium text-green-900">{rec.action}</h6>
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            color: rec.difficulty === 'easy' ? '#10B981' : 
                                   rec.difficulty === 'moderate' ? '#F59E0B' : '#EF4444',
                            backgroundColor: rec.difficulty === 'easy' ? '#ECFDF5' : 
                                            rec.difficulty === 'moderate' ? '#FFFBEB' : '#FEF2F2'
                          }}
                        >
                          {rec.difficulty}
                        </span>
                      </div>
                      <div className="text-sm text-green-700 mb-2">{rec.rationale}</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-green-600 font-medium">Timeline:</span>
                          <div className="text-green-700">{rec.timeline}</div>
                        </div>
                        <div>
                          <span className="text-green-600 font-medium">Expected Outcome:</span>
                          <div className="text-green-700">{rec.expectedOutcome}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const criticalCount = insights.filter(i => i.priority === 'critical').length
  const highCount = insights.filter(i => i.priority === 'high').length

  return (
    <LabBaseWidget
      title="AI Health Insights"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchAIInsights}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Brain className="h-5 w-5 text-indigo-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <select
            value={analysisDepth}
            onChange={(e) => setAnalysisDepth(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="basic">Basic Analysis</option>
            <option value="comprehensive">Comprehensive</option>
            <option value="advanced">Advanced AI</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Types</option>
            <option value="pattern">Patterns</option>
            <option value="risk">Risks</option>
            <option value="optimization">Optimization</option>
            <option value="prediction">Predictions</option>
            <option value="correlation">Correlations</option>
          </select>
          {insights.length > 0 && (
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
        {filteredInsights.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="h-4 w-4 text-indigo-600" />
                <h4 className="font-medium text-indigo-900">AI Analysis Summary</h4>
              </div>
              <div className="text-sm text-indigo-700">
                Generated {insights.length} AI-powered insights from comprehensive lab analysis
                {criticalCount > 0 && (
                  <span className="block mt-1 text-red-700 font-medium">
                    {criticalCount} critical insights require immediate attention
                  </span>
                )}
              </div>
            </div>

            {/* Insights Cards */}
            <div className="space-y-3">
              {filteredInsights.map(renderInsightCard)}
            </div>

            {/* AI Disclaimer */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <strong>AI Insights Disclaimer:</strong> These insights are generated by AI analysis 
                  of your lab data and should be used as supplementary information only. Always consult 
                  with qualified healthcare professionals before making medical decisions or changes to 
                  your health regimen. AI predictions are probabilistic and not guaranteed outcomes.
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No AI Insights Available</h3>
            <p className="text-gray-500">
              AI insights will be generated when sufficient lab data is available for analysis
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabAIInsightsWidget
