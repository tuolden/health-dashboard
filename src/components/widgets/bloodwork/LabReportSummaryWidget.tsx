/**
 * Lab Report Summary Widget - Issue #13 Widget #32
 * 
 * Comprehensive lab report with executive summary and key insights
 */

import React, { useState, useEffect } from 'react'
import { FileText, Download, Share, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, LabSummary, formatLabValue } from './types'

interface LabReportSummaryWidgetProps extends LabWidgetProps {
  collectedOn?: string
  includeComparisons?: boolean
  includeRecommendations?: boolean
}

interface ReportData {
  summary: LabSummary
  executiveSummary: string
  keyFindings: string[]
  recommendations: string[]
  riskFactors: string[]
  positiveIndicators: string[]
  trendAnalysis: string[]
  nextSteps: string[]
  reportDate: string
  patientInfo: {
    totalTests: number
    normalResults: number
    abnormalResults: number
    criticalResults: number
    overallRisk: 'low' | 'moderate' | 'high' | 'critical'
  }
}

export const LabReportSummaryWidget: React.FC<LabReportSummaryWidgetProps> = ({
  collectedOn,
  includeComparisons = true,
  includeRecommendations = true,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchReportData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get target date
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

      // Get lab summary
      const summaryResponse = await fetch(`/api/labs/summary/${targetDate}`)
      if (!summaryResponse.ok) {
        throw new Error(`HTTP error! status: ${summaryResponse.status}`)
      }

      const summaryResult = await summaryResponse.json()
      if (!summaryResult.success) {
        throw new Error(summaryResult.error || 'Failed to fetch lab summary')
      }

      // Get detailed results for analysis
      const resultsResponse = await fetch(`/api/labs/results?enhanced=true&startDate=${targetDate}&endDate=${targetDate}`)
      if (!resultsResponse.ok) {
        throw new Error('Failed to fetch detailed results')
      }

      const resultsResult = await resultsResponse.json()
      if (!resultsResult.success) {
        throw new Error('Failed to parse detailed results')
      }

      // Generate comprehensive report
      const report = generateComprehensiveReport(summaryResult.data, resultsResult.data, targetDate)
      setReportData(report)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(report)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching report data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateComprehensiveReport = (summary: LabSummary, detailedResults: any[], reportDate: string): ReportData => {
    const criticalResults = detailedResults.filter(r => r.risk_level === 'critical')
    const highRiskResults = detailedResults.filter(r => r.risk_level === 'high')
    const abnormalResults = detailedResults.filter(r => !r.is_in_range)
    const normalResults = detailedResults.filter(r => r.is_in_range)

    // Determine overall risk
    let overallRisk: 'low' | 'moderate' | 'high' | 'critical'
    if (criticalResults.length > 0) overallRisk = 'critical'
    else if (highRiskResults.length > 2) overallRisk = 'high'
    else if (abnormalResults.length > summary.total_tests * 0.3) overallRisk = 'moderate'
    else overallRisk = 'low'

    // Generate executive summary
    const executiveSummary = generateExecutiveSummary(summary, overallRisk, reportDate)

    // Generate key findings
    const keyFindings = generateKeyFindings(detailedResults, summary)

    // Generate recommendations
    const recommendations = generateRecommendations(detailedResults, overallRisk)

    // Identify risk factors
    const riskFactors = identifyRiskFactors(detailedResults)

    // Identify positive indicators
    const positiveIndicators = identifyPositiveIndicators(detailedResults, normalResults)

    // Generate trend analysis
    const trendAnalysis = generateTrendAnalysis(detailedResults)

    // Generate next steps
    const nextSteps = generateNextSteps(overallRisk, criticalResults.length, abnormalResults.length)

    return {
      summary,
      executiveSummary,
      keyFindings,
      recommendations,
      riskFactors,
      positiveIndicators,
      trendAnalysis,
      nextSteps,
      reportDate,
      patientInfo: {
        totalTests: summary.total_tests,
        normalResults: summary.in_range_count,
        abnormalResults: summary.out_of_range_count,
        criticalResults: summary.critical_count,
        overallRisk
      }
    }
  }

  const generateExecutiveSummary = (summary: LabSummary, overallRisk: string, reportDate: string): string => {
    const date = new Date(reportDate).toLocaleDateString()
    const normalPercent = Math.round((summary.in_range_count / summary.total_tests) * 100)
    
    if (overallRisk === 'critical') {
      return `Lab results from ${date} show ${summary.critical_count} critical value(s) requiring immediate medical attention. Of ${summary.total_tests} tests performed, ${normalPercent}% are within normal ranges. Urgent follow-up recommended.`
    } else if (overallRisk === 'high') {
      return `Lab results from ${date} indicate elevated health risks with ${summary.out_of_range_count} abnormal values. Of ${summary.total_tests} tests performed, ${normalPercent}% are within normal ranges. Medical consultation recommended within 1-2 weeks.`
    } else if (overallRisk === 'moderate') {
      return `Lab results from ${date} show some areas for improvement with ${summary.out_of_range_count} values outside normal ranges. Of ${summary.total_tests} tests performed, ${normalPercent}% are normal. Follow-up with healthcare provider recommended.`
    } else {
      return `Lab results from ${date} are largely reassuring with ${normalPercent}% of ${summary.total_tests} tests within normal ranges. Continue current health practices with routine monitoring.`
    }
  }

  const generateKeyFindings = (results: any[], summary: LabSummary): string[] => {
    const findings: string[] = []
    
    // Critical findings
    const critical = results.filter(r => r.risk_level === 'critical')
    critical.forEach(r => {
      findings.push(`🔴 CRITICAL: ${r.test_name} is ${formatLabValue(r.value, r.metric?.units)} (severely abnormal)`)
    })

    // High risk findings
    const highRisk = results.filter(r => r.risk_level === 'high').slice(0, 3)
    highRisk.forEach(r => {
      findings.push(`🟠 HIGH RISK: ${r.test_name} is ${formatLabValue(r.value, r.metric?.units)} (significantly abnormal)`)
    })

    // Panel summaries
    summary.panels.forEach(panel => {
      if (panel.overall_status === 'critical') {
        findings.push(`🔴 ${panel.panel_name}: Critical abnormalities detected`)
      } else if (panel.overall_status === 'abnormal' && panel.abnormal_count > panel.total_count / 2) {
        findings.push(`🟡 ${panel.panel_name}: Multiple values outside normal range`)
      } else if (panel.overall_status === 'normal') {
        findings.push(`✅ ${panel.panel_name}: All values within normal limits`)
      }
    })

    return findings.slice(0, 8) // Limit to top 8 findings
  }

  const generateRecommendations = (results: any[], overallRisk: string): string[] => {
    const recommendations: string[] = []

    if (overallRisk === 'critical') {
      recommendations.push('Seek immediate medical attention for critical lab values')
      recommendations.push('Bring this report to emergency department or urgent care')
      recommendations.push('Do not delay medical evaluation')
    } else if (overallRisk === 'high') {
      recommendations.push('Schedule appointment with primary care physician within 1-2 weeks')
      recommendations.push('Consider specialist referral based on abnormal values')
      recommendations.push('Implement immediate lifestyle modifications')
    } else if (overallRisk === 'moderate') {
      recommendations.push('Follow up with healthcare provider within 1 month')
      recommendations.push('Focus on diet and exercise improvements')
      recommendations.push('Consider repeat testing in 3-6 months')
    } else {
      recommendations.push('Continue current healthy lifestyle practices')
      recommendations.push('Maintain regular exercise and balanced nutrition')
      recommendations.push('Schedule routine follow-up as recommended by physician')
    }

    // Add specific recommendations based on abnormal values
    const lipidAbnormal = results.some(r => r.test_name.includes('Cholesterol') && !r.is_in_range)
    if (lipidAbnormal) {
      recommendations.push('Consider cardiology consultation for lipid management')
      recommendations.push('Implement heart-healthy diet (Mediterranean or DASH)')
    }

    const glucoseAbnormal = results.some(r => r.test_name.includes('Glucose') && !r.is_in_range)
    if (glucoseAbnormal) {
      recommendations.push('Monitor blood sugar levels closely')
      recommendations.push('Consider diabetes screening and nutritionist consultation')
    }

    return recommendations.slice(0, 6)
  }

  const identifyRiskFactors = (results: any[]): string[] => {
    const riskFactors: string[] = []
    
    results.filter(r => !r.is_in_range).forEach(r => {
      if (r.test_name.includes('LDL') && r.numeric_value > 130) {
        riskFactors.push('Elevated LDL cholesterol increases cardiovascular risk')
      } else if (r.test_name.includes('Glucose') && r.numeric_value > 100) {
        riskFactors.push('Elevated glucose indicates diabetes risk')
      } else if (r.test_name.includes('Creatinine') && r.numeric_value > 1.2) {
        riskFactors.push('Elevated creatinine suggests kidney function decline')
      } else if (r.test_name.includes('Hemoglobin') && r.numeric_value < 12) {
        riskFactors.push('Low hemoglobin indicates possible anemia')
      }
    })

    return [...new Set(riskFactors)].slice(0, 5)
  }

  const identifyPositiveIndicators = (results: any[], normalResults: any[]): string[] => {
    const positives: string[] = []
    
    if (normalResults.length > results.length * 0.8) {
      positives.push('Majority of lab values are within healthy ranges')
    }

    normalResults.forEach(r => {
      if (r.test_name.includes('HDL') && r.numeric_value >= 60) {
        positives.push('HDL cholesterol is in protective range')
      } else if (r.test_name.includes('Glucose') && r.numeric_value < 90) {
        positives.push('Glucose levels indicate good metabolic health')
      }
    })

    return [...new Set(positives)].slice(0, 4)
  }

  const generateTrendAnalysis = (results: any[]): string[] => {
    const trends: string[] = []
    
    results.forEach(r => {
      if (r.trend_direction === 'improving') {
        trends.push(`${r.test_name} is trending in a positive direction`)
      } else if (r.trend_direction === 'declining') {
        trends.push(`${r.test_name} shows concerning downward trend`)
      }
    })

    return trends.slice(0, 4)
  }

  const generateNextSteps = (overallRisk: string, criticalCount: number, abnormalCount: number): string[] => {
    const steps: string[] = []

    if (criticalCount > 0) {
      steps.push('1. Seek immediate medical evaluation')
      steps.push('2. Bring this report to healthcare provider')
      steps.push('3. Follow emergency protocols if symptoms present')
    } else if (overallRisk === 'high') {
      steps.push('1. Schedule medical appointment within 1-2 weeks')
      steps.push('2. Implement immediate lifestyle changes')
      steps.push('3. Monitor symptoms and seek care if worsening')
    } else {
      steps.push('1. Review results with healthcare provider')
      steps.push('2. Continue healthy lifestyle practices')
      steps.push('3. Schedule follow-up testing as recommended')
    }

    steps.push('4. Keep this report for medical records')
    
    return steps
  }

  useEffect(() => {
    fetchReportData()
  }, [collectedOn])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return '#DC2626'
      case 'high': return '#EA580C'
      case 'moderate': return '#D97706'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const handleDownload = () => {
    if (!reportData) return
    
    // Generate downloadable report content
    const reportContent = `
LAB REPORT SUMMARY
Date: ${new Date(reportData.reportDate).toLocaleDateString()}

EXECUTIVE SUMMARY
${reportData.executiveSummary}

KEY FINDINGS
${reportData.keyFindings.map(f => `• ${f}`).join('\n')}

RECOMMENDATIONS
${reportData.recommendations.map(r => `• ${r}`).join('\n')}

NEXT STEPS
${reportData.nextSteps.map(s => `${s}`).join('\n')}

Generated by Health Dashboard
    `.trim()

    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lab-report-${reportData.reportDate}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <LabBaseWidget
      title="Lab Report Summary"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchReportData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<FileText className="h-5 w-5 text-blue-600" />}
      headerActions={
        reportData && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              title="Download Report"
            >
              <Download className="h-4 w-4" />
            </button>
            <div 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ 
                color: getRiskColor(reportData.patientInfo.overallRisk),
                backgroundColor: `${getRiskColor(reportData.patientInfo.overallRisk)}20`
              }}
            >
              {reportData.patientInfo.overallRisk} risk
            </div>
          </div>
        )
      }
    >
      {reportData && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              borderColor: getRiskColor(reportData.patientInfo.overallRisk),
              backgroundColor: `${getRiskColor(reportData.patientInfo.overallRisk)}10`
            }}
          >
            <h4 className="font-semibold mb-2" style={{ color: getRiskColor(reportData.patientInfo.overallRisk) }}>
              Executive Summary
            </h4>
            <p className="text-sm text-gray-700">{reportData.executiveSummary}</p>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">{reportData.patientInfo.totalTests}</div>
              <div className="text-xs text-gray-500">Total Tests</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{reportData.patientInfo.normalResults}</div>
              <div className="text-xs text-gray-500">Normal</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{reportData.patientInfo.abnormalResults}</div>
              <div className="text-xs text-gray-500">Abnormal</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{reportData.patientInfo.criticalResults}</div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
          </div>

          {/* Key Findings */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Key Findings</h4>
            <div className="space-y-2">
              {reportData.keyFindings.map((finding, index) => (
                <div key={index} className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                  {finding}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {includeRecommendations && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
              <ul className="space-y-1">
                {reportData.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
            <div className="space-y-2">
              {reportData.nextSteps.map((step, index) => (
                <div key={index} className="text-sm text-gray-700 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Report Footer */}
          <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
            <p>Report generated on {new Date().toLocaleDateString()} • Lab date: {new Date(reportData.reportDate).toLocaleDateString()}</p>
            <p className="mt-1">This report is for informational purposes only and should not replace professional medical advice.</p>
          </div>
        </div>
      )}
    </LabBaseWidget>
  )
}

export default LabReportSummaryWidget
