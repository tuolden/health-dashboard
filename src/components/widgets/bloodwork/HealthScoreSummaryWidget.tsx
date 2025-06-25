/**
 * Health Score Summary Widget - Issue #13 Widget #26
 * 
 * Overall health score based on all lab values with easy-to-understand breakdown
 */

import React, { useState, useEffect } from 'react'
import { Award, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, LabSummary } from './types'

interface HealthScoreSummaryWidgetProps extends LabWidgetProps {
  collectedOn?: string
}

interface HealthScore {
  overall: number
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  categories: {
    cardiovascular: number
    metabolic: number
    kidney: number
    liver: number
    blood: number
  }
  strengths: string[]
  improvements: string[]
  summary: string
}

export const HealthScoreSummaryWidget: React.FC<HealthScoreSummaryWidgetProps> = ({
  collectedOn,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [labSummary, setLabSummary] = useState<LabSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchHealthScore = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get lab summary for the date
      let targetDate = collectedOn
      if (!targetDate) {
        const datesResponse = await fetch('/api/labs/dates')
        if (!datesResponse.ok) throw new Error('Failed to fetch dates')
        const datesResult = await datesResponse.json()
        if (!datesResult.success || datesResult.data.length === 0) {
          throw new Error('No lab data available')
        }
        targetDate = datesResult.data[0]
      }

      const response = await fetch(`/api/labs/summary/${targetDate}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lab summary')
      }

      setLabSummary(result.data)
      
      // Calculate health score
      const calculatedScore = calculateHealthScore(result.data)
      setHealthScore(calculatedScore)
      
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate({ summary: result.data, score: calculatedScore })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching health score:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateHealthScore = (summary: LabSummary): HealthScore => {
    const panels = summary.panels
    
    // Calculate category scores
    const categories = {
      cardiovascular: calculateCategoryScore(['LIPID'], panels),
      metabolic: calculateCategoryScore(['CMP'], panels),
      kidney: calculateCategoryScore(['KIDNEY'], panels),
      liver: calculateCategoryScore(['LIVER'], panels),
      blood: calculateCategoryScore(['CBC'], panels)
    }

    // Calculate overall score (weighted average)
    const weights = {
      cardiovascular: 0.25,
      metabolic: 0.25,
      kidney: 0.2,
      liver: 0.15,
      blood: 0.15
    }

    const overall = Math.round(
      categories.cardiovascular * weights.cardiovascular +
      categories.metabolic * weights.metabolic +
      categories.kidney * weights.kidney +
      categories.liver * weights.liver +
      categories.blood * weights.blood
    )

    // Determine grade
    const grade = getGrade(overall)

    // Generate strengths and improvements
    const { strengths, improvements } = generateInsights(categories, panels)

    // Generate summary
    const summary = generateSummary(overall, grade, summary.critical_count, summary.out_of_range_count)

    return {
      overall,
      grade,
      categories,
      strengths,
      improvements,
      summary
    }
  }

  const calculateCategoryScore = (panelTypes: string[], panels: any[]): number => {
    const relevantPanels = panels.filter(panel => 
      panelTypes.some(type => panel.panel_name.toLowerCase().includes(type.toLowerCase()))
    )

    if (relevantPanels.length === 0) return 85 // Default score if no data

    const totalTests = relevantPanels.reduce((sum, panel) => sum + panel.total_count, 0)
    const inRangeTests = relevantPanels.reduce((sum, panel) => sum + (panel.total_count - panel.abnormal_count), 0)

    if (totalTests === 0) return 85

    const baseScore = (inRangeTests / totalTests) * 100

    // Adjust for critical values
    const hasCritical = relevantPanels.some(panel => panel.overall_status === 'critical')
    if (hasCritical) return Math.min(baseScore, 60)

    return Math.round(baseScore)
  }

  const getGrade = (score: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' => {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'B+'
    if (score >= 87) return 'B'
    if (score >= 83) return 'C+'
    if (score >= 80) return 'C'
    if (score >= 70) return 'D'
    return 'F'
  }

  const generateInsights = (categories: any, panels: any[]) => {
    const strengths: string[] = []
    const improvements: string[] = []

    // Analyze each category
    Object.entries(categories).forEach(([category, score]) => {
      if (score >= 90) {
        strengths.push(`Excellent ${category} health`)
      } else if (score < 80) {
        improvements.push(`Focus on improving ${category} markers`)
      }
    })

    // Add specific insights based on panels
    panels.forEach(panel => {
      if (panel.overall_status === 'normal') {
        strengths.push(`${panel.panel_name} values are all normal`)
      } else if (panel.abnormal_count > panel.total_count / 2) {
        improvements.push(`Multiple ${panel.panel_name} values need attention`)
      }
    })

    // Ensure we have at least some insights
    if (strengths.length === 0) {
      strengths.push('Some lab values are within normal ranges')
    }
    if (improvements.length === 0) {
      improvements.push('Continue maintaining healthy lifestyle habits')
    }

    return { 
      strengths: strengths.slice(0, 3), 
      improvements: improvements.slice(0, 3) 
    }
  }

  const generateSummary = (score: number, grade: string, criticalCount: number, outOfRangeCount: number): string => {
    if (criticalCount > 0) {
      return `Your health score is ${score}/100 (${grade}). You have ${criticalCount} critical value(s) that need immediate attention.`
    } else if (outOfRangeCount > 5) {
      return `Your health score is ${score}/100 (${grade}). Several lab values are outside normal ranges and may benefit from lifestyle changes.`
    } else if (score >= 90) {
      return `Excellent health score of ${score}/100 (${grade})! Your lab values indicate very good overall health.`
    } else if (score >= 80) {
      return `Good health score of ${score}/100 (${grade}). Most of your lab values are in healthy ranges with room for some improvement.`
    } else {
      return `Your health score is ${score}/100 (${grade}). There are several areas where improvements could benefit your overall health.`
    }
  }

  useEffect(() => {
    fetchHealthScore()
  }, [collectedOn])

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981' // green
    if (score >= 80) return '#3B82F6' // blue
    if (score >= 70) return '#F59E0B' // yellow
    return '#EF4444' // red
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Award className="h-8 w-8 text-green-500" />
    if (score >= 80) return <CheckCircle className="h-8 w-8 text-blue-500" />
    if (score >= 70) return <TrendingUp className="h-8 w-8 text-yellow-500" />
    return <AlertCircle className="h-8 w-8 text-red-500" />
  }

  return (
    <LabBaseWidget
      title="Health Score Summary"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchHealthScore}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Award className="h-5 w-5 text-blue-600" />}
      headerActions={
        healthScore && (
          <div 
            className="px-3 py-1 rounded-full text-lg font-bold"
            style={{ 
              color: getScoreColor(healthScore.overall),
              backgroundColor: `${getScoreColor(healthScore.overall)}20`
            }}
          >
            {healthScore.grade}
          </div>
        )
      }
    >
      {healthScore && labSummary && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              {getScoreIcon(healthScore.overall)}
            </div>
            <div 
              className="text-4xl font-bold mb-2"
              style={{ color: getScoreColor(healthScore.overall) }}
            >
              {healthScore.overall}/100
            </div>
            <div className="text-lg font-medium text-gray-700 mb-4">
              Grade: {healthScore.grade}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {healthScore.summary}
            </p>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Category Breakdown</h4>
            {Object.entries(healthScore.categories).map(([category, score]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm capitalize text-gray-700">{category}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${score}%`, 
                        backgroundColor: getScoreColor(score) 
                      }}
                    />
                  </div>
                  <span 
                    className="text-sm font-medium w-8"
                    style={{ color: getScoreColor(score) }}
                  >
                    {score}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Strengths */}
          {healthScore.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">Your Strengths</h4>
              <ul className="space-y-1">
                {healthScore.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {healthScore.improvements.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-blue-700">Areas for Improvement</h4>
              <ul className="space-y-1">
                {healthScore.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-blue-600">
                    <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {labSummary.in_range_count}
              </div>
              <div className="text-xs text-gray-500">In Range</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">
                {labSummary.out_of_range_count}
              </div>
              <div className="text-xs text-gray-500">Out of Range</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {labSummary.critical_count}
              </div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
          </div>
        </div>
      )}
    </LabBaseWidget>
  )
}

export default HealthScoreSummaryWidget
