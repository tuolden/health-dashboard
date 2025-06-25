/**
 * Lab Data Quality Widget - Issue #13 Widget #39
 * 
 * Assesses the quality and reliability of lab data
 */

import React, { useState, useEffect } from 'react'
import { Shield, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps } from './types'

interface LabDataQualityWidgetProps extends LabWidgetProps {
  timeframe?: number
}

interface QualityMetrics {
  completeness: number
  consistency: number
  accuracy: number
  timeliness: number
  overall: number
  issues: QualityIssue[]
  recommendations: string[]
}

interface QualityIssue {
  type: 'missing_data' | 'inconsistent_values' | 'outliers' | 'timing_gaps' | 'duplicate_entries'
  severity: 'low' | 'medium' | 'high'
  description: string
  affectedTests: string[]
  count: number
}

export const LabDataQualityWidget: React.FC<LabDataQualityWidgetProps> = ({
  timeframe = 365,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchQualityMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/labs/results?enhanced=true&startDate=${startDate}&endDate=${endDate}&limit=1000`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lab data')
      }

      const metrics = assessDataQuality(result.data)
      setQualityMetrics(metrics)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(metrics)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching quality metrics:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const assessDataQuality = (data: any[]): QualityMetrics => {
    const issues: QualityIssue[] = []
    
    // Assess completeness
    const completeness = assessCompleteness(data, issues)
    
    // Assess consistency
    const consistency = assessConsistency(data, issues)
    
    // Assess accuracy
    const accuracy = assessAccuracy(data, issues)
    
    // Assess timeliness
    const timeliness = assessTimeliness(data, issues)
    
    // Calculate overall score
    const overall = (completeness + consistency + accuracy + timeliness) / 4
    
    // Generate recommendations
    const recommendations = generateRecommendations(issues, overall)
    
    return {
      completeness,
      consistency,
      accuracy,
      timeliness,
      overall,
      issues,
      recommendations
    }
  }

  const assessCompleteness = (data: any[], issues: QualityIssue[]): number => {
    const totalResults = data.length
    const completeResults = data.filter(r => 
      r.value !== null && 
      r.value !== undefined && 
      r.value !== '' &&
      r.test_name &&
      r.collected_on
    ).length
    
    const completenessScore = totalResults > 0 ? (completeResults / totalResults) * 100 : 100
    
    if (completenessScore < 95) {
      issues.push({
        type: 'missing_data',
        severity: completenessScore < 80 ? 'high' : completenessScore < 90 ? 'medium' : 'low',
        description: `${(100 - completenessScore).toFixed(1)}% of lab results have missing or incomplete data`,
        affectedTests: [...new Set(data.filter(r => !r.value).map(r => r.test_name))],
        count: totalResults - completeResults
      })
    }
    
    return completenessScore
  }

  const assessConsistency = (data: any[], issues: QualityIssue[]): number => {
    // Group by test name
    const testGroups: { [testName: string]: any[] } = {}
    data.forEach(result => {
      if (!testGroups[result.test_name]) {
        testGroups[result.test_name] = []
      }
      testGroups[result.test_name].push(result)
    })
    
    let consistencyScore = 100
    const inconsistentTests: string[] = []
    
    Object.entries(testGroups).forEach(([testName, results]) => {
      if (results.length < 2) return
      
      // Check for unit consistency
      const units = [...new Set(results.map(r => r.metric?.units).filter(u => u))]
      if (units.length > 1) {
        inconsistentTests.push(testName)
        consistencyScore -= 5
      }
      
      // Check for extreme variations (coefficient of variation > 50%)
      const numericResults = results.filter(r => r.numeric_value).map(r => r.numeric_value)
      if (numericResults.length >= 3) {
        const mean = numericResults.reduce((sum, v) => sum + v, 0) / numericResults.length
        const stdDev = Math.sqrt(numericResults.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / numericResults.length)
        const cv = (stdDev / mean) * 100
        
        if (cv > 50) {
          inconsistentTests.push(testName)
          consistencyScore -= 3
        }
      }
    })
    
    if (inconsistentTests.length > 0) {
      issues.push({
        type: 'inconsistent_values',
        severity: inconsistentTests.length > 5 ? 'high' : inconsistentTests.length > 2 ? 'medium' : 'low',
        description: `${inconsistentTests.length} tests show inconsistent units or extreme variations`,
        affectedTests: inconsistentTests,
        count: inconsistentTests.length
      })
    }
    
    return Math.max(0, consistencyScore)
  }

  const assessAccuracy = (data: any[], issues: QualityIssue[]): number => {
    let accuracyScore = 100
    const outlierTests: string[] = []
    
    // Group by test name and detect outliers
    const testGroups: { [testName: string]: any[] } = {}
    data.forEach(result => {
      if (result.numeric_value) {
        if (!testGroups[result.test_name]) {
          testGroups[result.test_name] = []
        }
        testGroups[result.test_name].push(result)
      }
    })
    
    Object.entries(testGroups).forEach(([testName, results]) => {
      if (results.length < 5) return
      
      const values = results.map(r => r.numeric_value)
      const sorted = [...values].sort((a, b) => a - b)
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]
      const iqr = q3 - q1
      const lowerBound = q1 - 1.5 * iqr
      const upperBound = q3 + 1.5 * iqr
      
      const outliers = values.filter(v => v < lowerBound || v > upperBound)
      const outlierPercentage = (outliers.length / values.length) * 100
      
      if (outlierPercentage > 10) {
        outlierTests.push(testName)
        accuracyScore -= outlierPercentage * 0.5
      }
    })
    
    if (outlierTests.length > 0) {
      issues.push({
        type: 'outliers',
        severity: outlierTests.length > 3 ? 'high' : outlierTests.length > 1 ? 'medium' : 'low',
        description: `${outlierTests.length} tests have excessive outlier values`,
        affectedTests: outlierTests,
        count: outlierTests.length
      })
    }
    
    return Math.max(0, accuracyScore)
  }

  const assessTimeliness = (data: any[], issues: QualityIssue[]): number => {
    if (data.length === 0) return 100
    
    // Sort by date
    const sortedData = data.sort((a, b) => 
      new Date(a.collected_on).getTime() - new Date(b.collected_on).getTime()
    )
    
    let timelinessScore = 100
    const gaps: number[] = []
    
    // Check for timing gaps
    for (let i = 1; i < sortedData.length; i++) {
      const currentDate = new Date(sortedData[i].collected_on)
      const previousDate = new Date(sortedData[i - 1].collected_on)
      const daysDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff > 180) { // More than 6 months gap
        gaps.push(daysDiff)
        timelinessScore -= 10
      }
    }
    
    if (gaps.length > 0) {
      issues.push({
        type: 'timing_gaps',
        severity: gaps.some(g => g > 365) ? 'high' : gaps.some(g => g > 270) ? 'medium' : 'low',
        description: `${gaps.length} significant timing gaps detected in lab history`,
        affectedTests: ['Multiple tests'],
        count: gaps.length
      })
    }
    
    // Check for duplicate entries (same test, same date)
    const duplicates = new Map<string, number>()
    data.forEach(result => {
      const key = `${result.test_name}-${result.collected_on}`
      duplicates.set(key, (duplicates.get(key) || 0) + 1)
    })
    
    const duplicateCount = Array.from(duplicates.values()).filter(count => count > 1).length
    if (duplicateCount > 0) {
      timelinessScore -= duplicateCount * 2
      issues.push({
        type: 'duplicate_entries',
        severity: duplicateCount > 5 ? 'high' : duplicateCount > 2 ? 'medium' : 'low',
        description: `${duplicateCount} duplicate lab entries detected`,
        affectedTests: ['Multiple tests'],
        count: duplicateCount
      })
    }
    
    return Math.max(0, timelinessScore)
  }

  const generateRecommendations = (issues: QualityIssue[], overallScore: number): string[] => {
    const recommendations: string[] = []
    
    if (overallScore < 70) {
      recommendations.push('Consider reviewing lab data collection and entry processes')
    }
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'missing_data':
          recommendations.push('Ensure all lab results are properly recorded and imported')
          break
        case 'inconsistent_values':
          recommendations.push('Standardize units and verify data entry accuracy')
          break
        case 'outliers':
          recommendations.push('Review outlier values for potential data entry errors')
          break
        case 'timing_gaps':
          recommendations.push('Maintain regular lab testing schedule for better trend analysis')
          break
        case 'duplicate_entries':
          recommendations.push('Implement duplicate detection in data import process')
          break
      }
    })
    
    if (recommendations.length === 0) {
      recommendations.push('Data quality is excellent - continue current practices')
    }
    
    return [...new Set(recommendations)] // Remove duplicates
  }

  useEffect(() => {
    fetchQualityMetrics()
  }, [timeframe])

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'
    if (score >= 75) return '#3B82F6'
    if (score >= 60) return '#F59E0B'
    return '#EF4444'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (score >= 75) return <Shield className="h-5 w-5 text-blue-500" />
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  return (
    <LabBaseWidget
      title="Data Quality Assessment"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchQualityMetrics}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Shield className="h-5 w-5 text-blue-600" />}
      headerActions={
        qualityMetrics && (
          <div 
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{ 
              color: getScoreColor(qualityMetrics.overall),
              backgroundColor: `${getScoreColor(qualityMetrics.overall)}20`
            }}
          >
            {qualityMetrics.overall.toFixed(0)}%
          </div>
        )
      }
    >
      {qualityMetrics && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              {getScoreIcon(qualityMetrics.overall)}
            </div>
            <div 
              className="text-3xl font-bold mb-2"
              style={{ color: getScoreColor(qualityMetrics.overall) }}
            >
              {qualityMetrics.overall.toFixed(0)}%
            </div>
            <div className="text-lg font-medium text-gray-700">
              Data Quality Score
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Completeness', score: qualityMetrics.completeness },
              { name: 'Consistency', score: qualityMetrics.consistency },
              { name: 'Accuracy', score: qualityMetrics.accuracy },
              { name: 'Timeliness', score: qualityMetrics.timeliness }
            ].map(metric => (
              <div key={metric.name} className="text-center p-3 bg-gray-50 rounded-lg">
                <div 
                  className="text-xl font-bold mb-1"
                  style={{ color: getScoreColor(metric.score) }}
                >
                  {metric.score.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">{metric.name}</div>
              </div>
            ))}
          </div>

          {/* Issues */}
          {qualityMetrics.issues.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Quality Issues</h4>
              <div className="space-y-2">
                {qualityMetrics.issues.map((issue, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-gray-900 capitalize">
                        {issue.type.replace('_', ' ')}
                      </h5>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                        style={{ 
                          color: issue.severity === 'high' ? '#DC2626' : 
                                 issue.severity === 'medium' ? '#F59E0B' : '#10B981',
                          backgroundColor: issue.severity === 'high' ? '#FEF2F2' : 
                                          issue.severity === 'medium' ? '#FFFBEB' : '#ECFDF5'
                        }}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                    <div className="text-xs text-gray-500">
                      Affected: {issue.affectedTests.slice(0, 3).join(', ')}
                      {issue.affectedTests.length > 3 && ` +${issue.affectedTests.length - 3} more`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
            <ul className="space-y-1">
              {qualityMetrics.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quality Standards */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Quality Standards</h5>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Excellent (90-100%):</strong> High-quality, reliable data</p>
              <p>• <strong>Good (75-89%):</strong> Generally reliable with minor issues</p>
              <p>• <strong>Fair (60-74%):</strong> Usable but requires attention</p>
              <p>• <strong>Poor (&lt;60%):</strong> Significant quality concerns</p>
            </div>
          </div>
        </div>
      )}
    </LabBaseWidget>
  )
}

export default LabDataQualityWidget
