/**
 * Lab Cost Analysis Widget - Issue #13 Widget #43
 * 
 * Analyzes lab testing costs and provides cost optimization recommendations
 */

import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, PieChart, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps } from './types'

interface LabCostAnalysisWidgetProps extends LabWidgetProps {
  timeframe?: number
}

interface CostAnalysis {
  totalCost: number
  averageCostPerTest: number
  costByCategory: CategoryCost[]
  costByMonth: MonthlyCost[]
  costOptimization: OptimizationSuggestion[]
  topExpensiveTests: ExpensiveTest[]
  costTrends: CostTrend
}

interface CategoryCost {
  category: string
  cost: number
  testCount: number
  percentage: number
}

interface MonthlyCost {
  month: string
  cost: number
  testCount: number
}

interface OptimizationSuggestion {
  type: 'frequency' | 'bundling' | 'alternative' | 'timing'
  description: string
  potentialSavings: number
  tests: string[]
  priority: 'high' | 'medium' | 'low'
}

interface ExpensiveTest {
  testName: string
  cost: number
  frequency: number
  totalCost: number
  category: string
}

interface CostTrend {
  direction: 'increasing' | 'decreasing' | 'stable'
  changePercent: number
  monthlyAverage: number
}

export const LabCostAnalysisWidget: React.FC<LabCostAnalysisWidgetProps> = ({
  timeframe = 365,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'categories' | 'trends' | 'optimization'>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchCostAnalysis = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/labs/cost-analysis?startDate=${startDate}&endDate=${endDate}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch cost analysis')
      }

      const analysis = processCostData(result.data)
      setCostAnalysis(analysis)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(analysis)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching cost analysis:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processCostData = (data: any): CostAnalysis => {
    // Mock cost data processing - in real implementation, this would process actual cost data
    const mockCostAnalysis: CostAnalysis = {
      totalCost: 2847.50,
      averageCostPerTest: 45.20,
      costByCategory: [
        { category: 'Lipid Panel', cost: 890.25, testCount: 12, percentage: 31.3 },
        { category: 'Complete Blood Count', cost: 456.80, testCount: 18, percentage: 16.0 },
        { category: 'Metabolic Panel', cost: 623.40, testCount: 15, percentage: 21.9 },
        { category: 'Thyroid Function', cost: 387.60, testCount: 8, percentage: 13.6 },
        { category: 'Specialty Tests', cost: 489.45, testCount: 6, percentage: 17.2 }
      ],
      costByMonth: [
        { month: 'Jan', cost: 245.80, testCount: 5 },
        { month: 'Feb', cost: 189.40, testCount: 4 },
        { month: 'Mar', cost: 312.60, testCount: 7 },
        { month: 'Apr', cost: 278.90, testCount: 6 },
        { month: 'May', cost: 198.75, testCount: 4 },
        { month: 'Jun', cost: 356.20, testCount: 8 },
        { month: 'Jul', cost: 289.15, testCount: 6 },
        { month: 'Aug', cost: 234.50, testCount: 5 },
        { month: 'Sep', cost: 298.80, testCount: 7 },
        { month: 'Oct', cost: 187.30, testCount: 4 },
        { month: 'Nov', cost: 256.10, testCount: 5 },
        { month: 'Dec', cost: 0, testCount: 0 }
      ],
      costOptimization: [
        {
          type: 'bundling',
          description: 'Bundle lipid panel with metabolic panel for 15% savings',
          potentialSavings: 127.50,
          tests: ['Total Cholesterol', 'LDL', 'HDL', 'Glucose'],
          priority: 'high'
        },
        {
          type: 'frequency',
          description: 'Reduce TSH testing frequency from quarterly to bi-annually',
          potentialSavings: 96.90,
          tests: ['TSH'],
          priority: 'medium'
        },
        {
          type: 'alternative',
          description: 'Use point-of-care glucose testing instead of lab draws',
          potentialSavings: 78.40,
          tests: ['Glucose'],
          priority: 'medium'
        },
        {
          type: 'timing',
          description: 'Schedule annual comprehensive panel to avoid duplicate tests',
          potentialSavings: 156.80,
          tests: ['Multiple'],
          priority: 'high'
        }
      ],
      topExpensiveTests: [
        { testName: 'Comprehensive Metabolic Panel', cost: 89.50, frequency: 6, totalCost: 537.00, category: 'Metabolic' },
        { testName: 'Lipid Panel', cost: 74.25, frequency: 8, totalCost: 594.00, category: 'Lipid' },
        { testName: 'Thyroid Panel', cost: 96.90, frequency: 4, totalCost: 387.60, category: 'Thyroid' },
        { testName: 'HbA1c', cost: 45.80, frequency: 6, totalCost: 274.80, category: 'Diabetes' },
        { testName: 'Vitamin D', cost: 67.30, frequency: 3, totalCost: 201.90, category: 'Vitamin' }
      ],
      costTrends: {
        direction: 'increasing',
        changePercent: 12.5,
        monthlyAverage: 237.29
      }
    }

    return mockCostAnalysis
  }

  useEffect(() => {
    fetchCostAnalysis()
  }, [timeframe])

  const renderOverview = () => {
    if (!costAnalysis) return null

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${costAnalysis.totalCost.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Cost</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              ${costAnalysis.averageCostPerTest.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Avg per Test</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              ${costAnalysis.costTrends.monthlyAverage.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Monthly Avg</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              ${costAnalysis.costOptimization.reduce((sum, opt) => sum + opt.potentialSavings, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Potential Savings</div>
          </div>
        </div>

        {/* Cost Trend */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Cost Trend</h4>
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                costAnalysis.costTrends.direction === 'increasing' ? 'bg-red-100 text-red-800' :
                costAnalysis.costTrends.direction === 'decreasing' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {costAnalysis.costTrends.direction} {Math.abs(costAnalysis.costTrends.changePercent).toFixed(1)}%
            </span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costAnalysis.costByMonth.filter(m => m.cost > 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Bar dataKey="cost" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderCategories = () => {
    if (!costAnalysis) return null

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

    return (
      <div className="space-y-6">
        {/* Pie Chart */}
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
              {/* Note: PieChart implementation would go here */}
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          {costAnalysis.costByCategory.map((category, index) => (
            <div key={category.category} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{category.category}</span>
                </div>
                <span className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cost:</span>
                  <span className="ml-1 font-medium">${category.cost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tests:</span>
                  <span className="ml-1 font-medium">{category.testCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Avg per Test:</span>
                  <span className="ml-1 font-medium">${(category.cost / category.testCount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderOptimization = () => {
    if (!costAnalysis) return null

    const priorityColors = {
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#10B981'
    }

    return (
      <div className="space-y-4">
        {costAnalysis.costOptimization.map((suggestion, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 capitalize">{suggestion.type} Optimization</h4>
                <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  ${suggestion.potentialSavings.toFixed(2)}
                </div>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                  style={{ 
                    color: priorityColors[suggestion.priority],
                    backgroundColor: `${priorityColors[suggestion.priority]}20`
                  }}
                >
                  {suggestion.priority} priority
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Affects: {suggestion.tests.join(', ')}
            </div>
          </div>
        ))}

        {/* Total Potential Savings */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">Total Optimization Potential</h4>
          </div>
          <div className="text-2xl font-bold text-green-600">
            ${costAnalysis.costOptimization.reduce((sum, opt) => sum + opt.potentialSavings, 0).toFixed(2)}
          </div>
          <div className="text-sm text-green-700 mt-1">
            Potential annual savings: ${(costAnalysis.costOptimization.reduce((sum, opt) => sum + opt.potentialSavings, 0) * 4).toFixed(2)}
          </div>
        </div>
      </div>
    )
  }

  const renderExpensiveTests = () => {
    if (!costAnalysis) return null

    return (
      <div className="space-y-3">
        {costAnalysis.topExpensiveTests.map((test, index) => (
          <div key={test.testName} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{test.testName}</h4>
              <span className="text-sm text-gray-500">{test.category}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Per Test:</span>
                <div className="font-medium">${test.cost.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">Frequency:</span>
                <div className="font-medium">{test.frequency}x</div>
              </div>
              <div>
                <span className="text-gray-600">Total Cost:</span>
                <div className="font-medium">${test.totalCost.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">% of Total:</span>
                <div className="font-medium">{((test.totalCost / costAnalysis.totalCost) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <LabBaseWidget
      title="Lab Cost Analysis"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchCostAnalysis}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<DollarSign className="h-5 w-5 text-green-600" />}
      headerActions={
        <div className="flex border border-gray-300 rounded overflow-hidden">
          {[
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'categories', label: 'Categories', icon: PieChart },
            { key: 'optimization', label: 'Savings', icon: DollarSign }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key as any)}
              className={`px-3 py-1 text-xs flex items-center space-x-1 ${
                viewMode === key ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        {costAnalysis ? (
          <>
            {viewMode === 'overview' && renderOverview()}
            {viewMode === 'categories' && renderCategories()}
            {viewMode === 'optimization' && renderOptimization()}

            {/* Most Expensive Tests */}
            {viewMode === 'overview' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Most Expensive Tests</h4>
                {renderExpensiveTests()}
              </div>
            )}

            {/* Cost Insights */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong>Cost Optimization Tips:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Bundle related tests to reduce individual test costs</li>
                    <li>• Consider annual comprehensive panels vs. individual tests</li>
                    <li>• Review test frequency with your healthcare provider</li>
                    <li>• Ask about generic or alternative testing options</li>
                    <li>• Check if your insurance covers preventive lab work</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Cost Data</h3>
            <p className="text-gray-500">
              Cost analysis will appear when lab billing data is available
            </p>
          </div>
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabCostAnalysisWidget
