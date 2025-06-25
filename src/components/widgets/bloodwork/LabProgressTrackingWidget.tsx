/**
 * Lab Progress Tracking Widget - Issue #13 Widget #50
 * 
 * Comprehensive progress tracking with milestones and achievement system
 */

import React, { useState, useEffect } from 'react'
import { Target, Trophy, Calendar, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LabBaseWidget } from './LabBaseWidget'
import { LabWidgetProps, formatLabValue } from './types'

interface LabProgressTrackingWidgetProps extends LabWidgetProps {
  timeframe?: number
}

interface ProgressGoal {
  id: string
  testName: string
  goalType: 'target_value' | 'range' | 'improvement' | 'maintenance'
  targetValue?: number
  targetRange?: { min: number, max: number }
  improvementPercent?: number
  currentValue: number
  startValue: number
  units: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
  status: 'achieved' | 'on_track' | 'behind' | 'at_risk'
  progress: number // 0-100%
  milestones: Milestone[]
  progressHistory: ProgressPoint[]
}

interface Milestone {
  id: string
  description: string
  targetDate: string
  targetValue: number
  achieved: boolean
  achievedDate?: string
}

interface ProgressPoint {
  date: string
  value: number
  milestone?: string
}

interface Achievement {
  id: string
  title: string
  description: string
  earnedDate: string
  category: 'improvement' | 'consistency' | 'target' | 'milestone'
  icon: string
}

export const LabProgressTrackingWidget: React.FC<LabProgressTrackingWidgetProps> = ({
  timeframe = 365,
  className,
  refreshInterval = 300000,
  showRefreshButton = true,
  onError,
  onDataUpdate
}) => {
  const [goals, setGoals] = useState<ProgressGoal[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'goals' | 'achievements'>('goals')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchProgressData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/labs/progress-tracking?startDate=${startDate}&endDate=${endDate}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch progress data')
      }

      const processedData = processProgressData(result.data)
      setGoals(processedData.goals)
      setAchievements(processedData.achievements)
      setLastUpdated(new Date().toISOString())
      
      if (onDataUpdate) {
        onDataUpdate(processedData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching progress data:', err)
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processProgressData = (data: any): { goals: ProgressGoal[], achievements: Achievement[] } => {
    // Mock progress data - in real implementation, this would process actual data
    const mockGoals: ProgressGoal[] = [
      {
        id: 'goal-1',
        testName: 'LDL Cholesterol',
        goalType: 'target_value',
        targetValue: 100,
        currentValue: 125,
        startValue: 165,
        units: 'mg/dL',
        deadline: '2024-06-30',
        priority: 'high',
        status: 'on_track',
        progress: 67,
        milestones: [
          { id: 'm1', description: 'Reduce to 150 mg/dL', targetDate: '2024-02-15', targetValue: 150, achieved: true, achievedDate: '2024-02-10' },
          { id: 'm2', description: 'Reach 130 mg/dL', targetDate: '2024-04-15', targetValue: 130, achieved: true, achievedDate: '2024-04-12' },
          { id: 'm3', description: 'Achieve target 100 mg/dL', targetDate: '2024-06-30', targetValue: 100, achieved: false }
        ],
        progressHistory: [
          { date: '2024-01-01', value: 165 },
          { date: '2024-02-10', value: 148, milestone: 'Milestone 1 achieved' },
          { date: '2024-03-15', value: 138 },
          { date: '2024-04-12', value: 128, milestone: 'Milestone 2 achieved' },
          { date: '2024-05-20', value: 125 }
        ]
      },
      {
        id: 'goal-2',
        testName: 'HbA1c',
        goalType: 'range',
        targetRange: { min: 4.5, max: 5.6 },
        currentValue: 5.8,
        startValue: 6.4,
        units: '%',
        deadline: '2024-08-31',
        priority: 'high',
        status: 'behind',
        progress: 75,
        milestones: [
          { id: 'm4', description: 'Below 6.0%', targetDate: '2024-03-31', targetValue: 6.0, achieved: true, achievedDate: '2024-03-25' },
          { id: 'm5', description: 'Reach 5.7%', targetDate: '2024-06-30', targetValue: 5.7, achieved: false },
          { id: 'm6', description: 'Achieve target range', targetDate: '2024-08-31', targetValue: 5.5, achieved: false }
        ],
        progressHistory: [
          { date: '2024-01-01', value: 6.4 },
          { date: '2024-02-15', value: 6.1 },
          { date: '2024-03-25', value: 5.9, milestone: 'Below 6.0% achieved' },
          { date: '2024-05-10', value: 5.8 }
        ]
      },
      {
        id: 'goal-3',
        testName: 'Vitamin D',
        goalType: 'improvement',
        improvementPercent: 100,
        currentValue: 45,
        startValue: 22,
        units: 'ng/mL',
        deadline: '2024-07-15',
        priority: 'medium',
        status: 'achieved',
        progress: 100,
        milestones: [
          { id: 'm7', description: 'Reach 30 ng/mL', targetDate: '2024-03-15', targetValue: 30, achieved: true, achievedDate: '2024-03-10' },
          { id: 'm8', description: 'Achieve 40 ng/mL', targetDate: '2024-05-15', targetValue: 40, achieved: true, achievedDate: '2024-05-12' },
          { id: 'm9', description: 'Maintain above 40 ng/mL', targetDate: '2024-07-15', targetValue: 40, achieved: true, achievedDate: '2024-05-20' }
        ],
        progressHistory: [
          { date: '2024-01-01', value: 22 },
          { date: '2024-02-15', value: 28 },
          { date: '2024-03-10', value: 32, milestone: '30 ng/mL achieved' },
          { date: '2024-04-20', value: 38 },
          { date: '2024-05-12', value: 42, milestone: '40 ng/mL achieved' },
          { date: '2024-05-20', value: 45 }
        ]
      }
    ]

    const mockAchievements: Achievement[] = [
      {
        id: 'ach-1',
        title: 'Cholesterol Champion',
        description: 'Reduced LDL cholesterol by 25% in 4 months',
        earnedDate: '2024-04-12',
        category: 'improvement',
        icon: '🏆'
      },
      {
        id: 'ach-2',
        title: 'Vitamin D Victory',
        description: 'Doubled vitamin D levels ahead of schedule',
        earnedDate: '2024-05-12',
        category: 'target',
        icon: '☀️'
      },
      {
        id: 'ach-3',
        title: 'Consistency King',
        description: 'Maintained regular lab testing for 6 months',
        earnedDate: '2024-05-20',
        category: 'consistency',
        icon: '📅'
      },
      {
        id: 'ach-4',
        title: 'Milestone Master',
        description: 'Achieved 5 consecutive milestones',
        earnedDate: '2024-05-12',
        category: 'milestone',
        icon: '🎯'
      }
    ]

    return { goals: mockGoals, achievements: mockAchievements }
  }

  useEffect(() => {
    fetchProgressData()
  }, [timeframe])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return '#10B981'
      case 'on_track': return '#3B82F6'
      case 'behind': return '#F59E0B'
      case 'at_risk': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'on_track': return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'behind': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'at_risk': return <Target className="h-4 w-4 text-red-500" />
      default: return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const renderProgressChart = (goal: ProgressGoal) => {
    const chartData = goal.progressHistory.map(point => ({
      date: point.date,
      value: point.value,
      target: goal.goalType === 'target_value' ? goal.targetValue : 
              goal.goalType === 'range' ? (goal.targetRange!.min + goal.targetRange!.max) / 2 :
              goal.startValue + (goal.startValue * (goal.improvementPercent! / 100)),
      milestone: point.milestone
    }))

    return (
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value, name) => [
                formatLabValue(value as number, goal.units, 1),
                name === 'value' ? 'Current' : 'Target'
              ]}
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ r: 6, fill: '#3B82F6' }}
              name="Progress"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Target"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderGoalCard = (goal: ProgressGoal) => {
    const isSelected = selectedGoal === goal.id
    const statusColor = getStatusColor(goal.status)
    const daysToDeadline = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    return (
      <div 
        key={goal.id}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedGoal(isSelected ? null : goal.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(goal.status)}
            <div>
              <h4 className="font-medium text-gray-900">{goal.testName} Goal</h4>
              <p className="text-sm text-gray-600 capitalize">{goal.goalType.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="text-right">
            <div 
              className="text-lg font-bold"
              style={{ color: statusColor }}
            >
              {goal.progress}%
            </div>
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium capitalize"
              style={{ 
                color: statusColor,
                backgroundColor: `${statusColor}20`
              }}
            >
              {goal.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium" style={{ color: statusColor }}>
              {goal.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${goal.progress}%`, 
                backgroundColor: statusColor 
              }}
            />
          </div>
        </div>

        {/* Current vs Target */}
        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-600">Current:</span>
            <div className="font-medium">
              {formatLabValue(goal.currentValue, goal.units, 1)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Target:</span>
            <div className="font-medium">
              {goal.goalType === 'target_value' && formatLabValue(goal.targetValue!, goal.units, 1)}
              {goal.goalType === 'range' && `${formatLabValue(goal.targetRange!.min, goal.units, 1)} - ${formatLabValue(goal.targetRange!.max, goal.units, 1)}`}
              {goal.goalType === 'improvement' && `${goal.improvementPercent}% improvement`}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Deadline:</span>
            <div className="font-medium">
              {daysToDeadline > 0 ? `${daysToDeadline} days` : 'Overdue'}
            </div>
          </div>
        </div>

        {/* Milestones Preview */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-2">Milestones:</div>
          <div className="space-y-1">
            {goal.milestones.slice(0, isSelected ? undefined : 2).map(milestone => (
              <div key={milestone.id} className="flex items-center space-x-2 text-sm">
                {milestone.achieved ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <Clock className="h-3 w-3 text-gray-400" />
                )}
                <span className={milestone.achieved ? 'text-green-700' : 'text-gray-600'}>
                  {milestone.description}
                </span>
                {milestone.achieved && milestone.achievedDate && (
                  <span className="text-xs text-green-500">
                    ✓ {new Date(milestone.achievedDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
            {!isSelected && goal.milestones.length > 2 && (
              <div className="text-xs text-gray-500">
                +{goal.milestones.length - 2} more milestones
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Progress Chart */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Progress Visualization</h5>
                {renderProgressChart(goal)}
              </div>

              {/* All Milestones */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">All Milestones</h5>
                <div className="space-y-2">
                  {goal.milestones.map(milestone => (
                    <div key={milestone.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{milestone.description}</span>
                        <span className="text-xs text-gray-500">
                          Target: {new Date(milestone.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Target: {formatLabValue(milestone.targetValue, goal.units, 1)}</span>
                        {milestone.achieved ? (
                          <span className="text-green-600 font-medium">
                            ✓ Achieved {milestone.achievedDate && new Date(milestone.achievedDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-500">Pending</span>
                        )}
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

  const renderAchievementCard = (achievement: Achievement) => {
    const categoryColors = {
      improvement: '#10B981',
      consistency: '#3B82F6',
      target: '#F59E0B',
      milestone: '#8B5CF6'
    }

    const color = categoryColors[achievement.category]

    return (
      <div key={achievement.id} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{achievement.icon}</div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{achievement.title}</h4>
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                style={{ 
                  color,
                  backgroundColor: `${color}20`
                }}
              >
                {achievement.category}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
            <div className="text-xs text-gray-500">
              Earned on {new Date(achievement.earnedDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const achievedCount = goals.filter(g => g.status === 'achieved').length
  const onTrackCount = goals.filter(g => g.status === 'on_track').length

  return (
    <LabBaseWidget
      title="Progress Tracking"
      className={className}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={fetchProgressData}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
      icon={<Target className="h-5 w-5 text-blue-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('goals')}
              className={`px-3 py-1 text-xs flex items-center space-x-1 ${
                viewMode === 'goals' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <Target className="h-3 w-3" />
              <span>Goals</span>
            </button>
            <button
              onClick={() => setViewMode('achievements')}
              className={`px-3 py-1 text-xs flex items-center space-x-1 ${
                viewMode === 'achievements' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <Trophy className="h-3 w-3" />
              <span>Achievements</span>
            </button>
          </div>
          {goals.length > 0 && viewMode === 'goals' && (
            <div className="flex items-center space-x-1">
              {achievedCount > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {achievedCount} achieved
                </span>
              )}
              {onTrackCount > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {onTrackCount} on track
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {viewMode === 'goals' ? (
          goals.length > 0 ? (
            <>
              {/* Goals Summary */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Progress Summary</h4>
                </div>
                <div className="text-sm text-blue-700">
                  Tracking {goals.length} health goals with {achievedCount} achieved and {onTrackCount} on track
                </div>
              </div>

              {/* Goals List */}
              <div className="space-y-3">
                {goals.map(renderGoalCard)}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Goals Set</h3>
              <p className="text-gray-500">
                Set health goals to track your lab value improvements
              </p>
            </div>
          )
        ) : (
          achievements.length > 0 ? (
            <>
              {/* Achievements Summary */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-medium text-yellow-900">Achievements Unlocked</h4>
                </div>
                <div className="text-sm text-yellow-700">
                  You've earned {achievements.length} achievements for your health progress!
                </div>
              </div>

              {/* Achievements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {achievements.map(renderAchievementCard)}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Achievements Yet</h3>
              <p className="text-gray-500">
                Complete goals and milestones to unlock achievements
              </p>
            </div>
          )
        )}
      </div>
    </LabBaseWidget>
  )
}

export default LabProgressTrackingWidget
