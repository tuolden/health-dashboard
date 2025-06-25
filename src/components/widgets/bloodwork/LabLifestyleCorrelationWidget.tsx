/**
 * Lab Lifestyle Correlation Widget - Issue #13 Widget #48
 * 
 * Analyzes correlations between lifestyle factors and lab values
 */

import React, { useState, useEffect } from 'react'
import { Activity, Moon, Utensils, Dumbbell, Heart } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabLifestyleCorrelationWidgetProps extends LabWidgetProps {
  timeframe?: number
}

interface LifestyleCorrelation {
  factor: string
  labTest: string
  correlation: number
  significance: 'high' | 'medium' | 'low'
  direction: 'positive' | 'negative'
  confidence: number
  dataPoints: number
  insights: string[]
  recommendations: string[]
  scatterData: ScatterPoint[]
}

interface ScatterPoint {
  x: number
  y: number
  date: string
  labValue: number
  lifestyleValue: number
}

interface LifestyleFactor {
  name: string
  icon: React.ReactNode
  unit: string
  description: string
}

export const LabLifestyleCorrelationWidget: React.FC<LabLifestyleCorrelationWidgetProps> = ({
  timeframe = 180,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [correlations, setCorrelations] = useState<LifestyleCorrelation[]>([])
  const [selectedCorrelation, setSelectedCorrelation] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const lifestyleFactors: LifestyleFactor[] = [
    { name: 'Sleep Duration', icon: <Moon className="h-4 w-4" />, unit: 'hours', description: 'Average nightly sleep duration' },
    { name: 'Exercise Minutes', icon: <Dumbbell className="h-4 w-4" />, unit: 'minutes', description: 'Daily exercise duration' },
    { name: 'Steps', icon: <Activity className="h-4 w-4" />, unit: 'steps', description: 'Daily step count' },
    { name: 'Stress Level', icon: <Heart className="h-4 w-4" />, unit: 'scale 1-10', description: 'Self-reported stress level' },
    { name: 'Alcohol Intake', icon: <Utensils className="h-4 w-4" />, unit: 'drinks/week', description: 'Weekly alcohol consumption' }
  ]

  const fetchLifestyleCorrelations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/labs/lifestyle-correlations?startDate=${startDate}&endDate=${endDate}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lifestyle correlations')
      }

      const processedData = processCorrelationData(result.data)
      setCorrelations(processedData)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(processedData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching lifestyle correlations:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processCorrelationData = (data: any): LifestyleCorrelation[] => {
    // Mock correlation data - in real implementation, this would process actual data
    const mockCorrelations: LifestyleCorrelation[] = [
      {
        factor: 'Sleep Duration',
        labTest: 'Cortisol',
        correlation: -0.72,
        significance: 'high',
        direction: 'negative',
        confidence: 0.89,
        dataPoints: 45,
        insights: [
          'Strong negative correlation between sleep duration and morning cortisol',
          'Each additional hour of sleep associated with 15% lower cortisol',
          'Most significant correlation in the past 6 months'
        ],
        recommendations: [
          'Aim for 7-9 hours of sleep nightly',
          'Maintain consistent sleep schedule',
          'Consider sleep hygiene improvements',
          'Monitor cortisol levels with sleep changes'
        ],
        scatterData: generateScatterData(45, -0.72, 'sleep', 'cortisol')
      },
      {
        factor: 'Exercise Minutes',
        labTest: 'HDL Cholesterol',
        correlation: 0.68,
        significance: 'high',
        direction: 'positive',
        confidence: 0.85,
        dataPoints: 38,
        insights: [
          'Strong positive correlation between exercise and HDL cholesterol',
          'Each 30 minutes of daily exercise linked to 8% higher HDL',
          'Cardiovascular exercise shows strongest correlation'
        ],
        recommendations: [
          'Maintain at least 150 minutes weekly exercise',
          'Include both cardio and strength training',
          'Track HDL improvements with exercise increases',
          'Consider high-intensity interval training'
        ],
        scatterData: generateScatterData(38, 0.68, 'exercise', 'hdl')
      },
      {
        factor: 'Steps',
        labTest: 'Glucose',
        correlation: -0.54,
        significance: 'medium',
        direction: 'negative',
        confidence: 0.76,
        dataPoints: 52,
        insights: [
          'Moderate negative correlation between daily steps and glucose',
          'Higher step counts associated with better glucose control',
          'Effect most pronounced in post-meal glucose levels'
        ],
        recommendations: [
          'Aim for 8,000-10,000 steps daily',
          'Take walks after meals to improve glucose response',
          'Use step tracking to monitor activity levels',
          'Increase steps gradually if currently sedentary'
        ],
        scatterData: generateScatterData(52, -0.54, 'steps', 'glucose')
      },
      {
        factor: 'Stress Level',
        labTest: 'CRP',
        correlation: 0.61,
        significance: 'medium',
        direction: 'positive',
        confidence: 0.78,
        dataPoints: 29,
        insights: [
          'Moderate positive correlation between stress and inflammation',
          'Higher stress levels linked to elevated CRP',
          'Chronic stress shows stronger correlation than acute stress'
        ],
        recommendations: [
          'Implement stress management techniques',
          'Consider meditation or mindfulness practices',
          'Monitor CRP levels during stressful periods',
          'Address chronic stressors when possible'
        ],
        scatterData: generateScatterData(29, 0.61, 'stress', 'crp')
      },
      {
        factor: 'Alcohol Intake',
        labTest: 'Liver Enzymes',
        correlation: 0.43,
        significance: 'low',
        direction: 'positive',
        confidence: 0.65,
        dataPoints: 31,
        insights: [
          'Weak positive correlation between alcohol and liver enzymes',
          'Even moderate drinking shows measurable impact',
          'ALT more sensitive than AST to alcohol intake'
        ],
        recommendations: [
          'Limit alcohol to recommended guidelines',
          'Consider alcohol-free days weekly',
          'Monitor liver enzymes if drinking regularly',
          'Discuss alcohol intake with healthcare provider'
        ],
        scatterData: generateScatterData(31, 0.43, 'alcohol', 'liver')
      }
    ]

    return mockCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
  }

  const generateScatterData = (points: number, correlation: number, factorType: string, labType: string): ScatterPoint[] => {
    const data: ScatterPoint[] = []
    const baseDate = new Date()
    
    for (let i = 0; i < points; i++) {
      const date = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000)
      
      // Generate correlated data points
      const x = Math.random() * 100 + 50 // Lifestyle factor value
      const noise = (Math.random() - 0.5) * 20
      const y = 50 + correlation * (x - 75) + noise // Lab value with correlation
      
      data.push({
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        date: date.toISOString().split('T')[0],
        lifestyleValue: x,
        labValue: y
      })
    }
    
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  useEffect(() => {
    fetchLifestyleCorrelations()
  }, [timeframe])

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation)
    if (abs >= 0.7) return '#DC2626' // Strong
    if (abs >= 0.5) return '#F59E0B' // Moderate
    if (abs >= 0.3) return '#10B981' // Weak
    return '#6B7280' // Very weak
  }

  const getCorrelationStrength = (correlation: number) => {
    const abs = Math.abs(correlation)
    if (abs >= 0.7) return 'Strong'
    if (abs >= 0.5) return 'Moderate'
    if (abs >= 0.3) return 'Weak'
    return 'Very Weak'
  }

  const renderCorrelationCard = (corr: LifestyleCorrelation) => {
    const isSelected = selectedCorrelation === `${corr.factor}-${corr.labTest}`
    const correlationColor = getCorrelationColor(corr.correlation)
    const strength = getCorrelationStrength(corr.correlation)

    const lifestyleFactor = lifestyleFactors.find(f => f.name === corr.factor)

    return (
      <div 
        key={`${corr.factor}-${corr.labTest}`}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedCorrelation(isSelected ? null : `${corr.factor}-${corr.labTest}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {lifestyleFactor?.icon}
            <div>
              <h4 className="font-medium text-gray-900">{corr.factor} → {corr.labTest}</h4>
              <p className="text-sm text-gray-600">{lifestyleFactor?.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div 
              className="text-lg font-bold"
              style={{ color: correlationColor }}
            >
              r = {corr.correlation.toFixed(2)}
            </div>
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                color: correlationColor,
                backgroundColor: `${correlationColor}20`
              }}
            >
              {strength}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-600">Significance:</span>
            <span 
              className="ml-1 font-medium capitalize"
              style={{ 
                color: corr.significance === 'high' ? '#DC2626' : 
                       corr.significance === 'medium' ? '#F59E0B' : '#10B981'
              }}
            >
              {corr.significance}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Confidence:</span>
            <span className="ml-1 font-medium">{(corr.confidence * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-gray-600">Data Points:</span>
            <span className="ml-1 font-medium">{corr.dataPoints}</span>
          </div>
        </div>

        {/* Key Insights Preview */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Key Insight:</div>
          <div className="text-sm text-gray-700">
            {corr.insights[0]}
          </div>
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Scatter Plot */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Correlation Visualization</h5>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={corr.scatterData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="x" 
                        name={corr.factor}
                        unit={lifestyleFactor?.unit}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        dataKey="y" 
                        name={corr.labTest}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toFixed(2) : value,
                          name === 'x' ? corr.factor : corr.labTest
                        ]}
                        labelFormatter={() => ''}
                      />
                      <Scatter 
                        dataKey="y" 
                        fill={correlationColor}
                        fillOpacity={0.6}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* All Insights */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Detailed Insights</h5>
                <ul className="space-y-2">
                  {corr.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Actionable Recommendations</h5>
                <ul className="space-y-2">
                  {corr.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
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

  const renderOverviewChart = () => {
    const chartData = correlations.map(corr => ({
      name: `${corr.factor.split(' ')[0]} → ${corr.labTest.split(' ')[0]}`,
      correlation: Math.abs(corr.correlation),
      direction: corr.correlation > 0 ? 'Positive' : 'Negative',
      significance: corr.significance
    }))

    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              domain={[0, 1]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value, name) => [
                typeof value === 'number' ? value.toFixed(2) : value,
                'Correlation Strength'
              ]}
            />
            <Bar 
              dataKey="correlation" 
              fill="#3B82F6"
              name="Correlation"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const strongCorrelations = correlations.filter(c => Math.abs(c.correlation) >= 0.7).length
  const moderateCorrelations = correlations.filter(c => Math.abs(c.correlation) >= 0.5 && Math.abs(c.correlation) < 0.7).length

  return (
    <LabBaseWidget
      title="Lifestyle-Lab Correlations"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchLifestyleCorrelations}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Activity className="h-5 w-5 text-purple-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
          </select>
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-2 py-1 text-xs ${viewMode === 'overview' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-2 py-1 text-xs ${viewMode === 'detailed' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Detailed
            </button>
          </div>
          {correlations.length > 0 && (
            <div className="flex items-center space-x-1">
              {strongCorrelations > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {strongCorrelations} strong
                </span>
              )}
              {moderateCorrelations > 0 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  {moderateCorrelations} moderate
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {correlations.length > 0 ? (
          <>
            {/* Summary */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-purple-900">Lifestyle Correlation Analysis</h4>
              </div>
              <div className="text-sm text-purple-700">
                Found {correlations.length} lifestyle-lab correlations over {timeframe} days
                {strongCorrelations > 0 && (
                  <span className="block mt-1 font-medium">
                    {strongCorrelations} strong correlations identified for optimization
                  </span>
                )}
              </div>
            </div>

            {/* Overview Chart */}
            {viewMode === 'overview' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Correlation Strength Overview</h4>
                {renderOverviewChart()}
              </div>
            )}

            {/* Correlation Cards */}
            <div className="space-y-3">
              {correlations.map(renderCorrelationCard)}
            </div>

            {/* Educational Info */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Understanding Correlations</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Strong (|r| ≥ 0.7):</strong> Highly predictive relationship</li>
                <li>• <strong>Moderate (|r| ≥ 0.5):</strong> Meaningful association</li>
                <li>• <strong>Weak (|r| ≥ 0.3):</strong> Some relationship present</li>
                <li>• <strong>Positive:</strong> Both factors increase together</li>
                <li>• <strong>Negative:</strong> One increases as other decreases</li>
                <li>• Correlation does not imply causation - consult healthcare providers</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Correlation Data</h3>
            <p className="text-gray-500">
              Lifestyle correlations will appear when both lifestyle and lab data are available
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabLifestyleCorrelationWidget
