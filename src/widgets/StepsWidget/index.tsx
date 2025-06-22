import React from 'react'
import BaseWidget from '../../components/BaseWidget'
import { WidgetProps } from '../../types/widget'
import { StepsData } from '../mockData'
import { ProgressBar, Badge } from '../../DesignSystem'
import Icon from '../../components/Icon'

/**
 * StepsWidget - Daily step tracking optimized for vertical screens
 * Shows current steps, progress toward goal, distance, and calories
 */
const StepsWidget: React.FC<WidgetProps> = (props) => {
  const { data } = props
  const stepsData = data as StepsData
  
  if (!stepsData) {
    return (
      <BaseWidget {...props}>
        <div className="text-center text-mutedText">No step data available</div>
      </BaseWidget>
    )
  }

  const { steps, goal, distance, calories } = stepsData
  const progressPercentage = Math.min((steps / goal) * 100, 100)
  const isGoalReached = steps >= goal

  return (
    <BaseWidget {...props}>
      <div className="space-y-3">
        {/* Main Steps Display */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Icon
              name="steps"
              className={`w-5 h-5 ${isGoalReached ? 'text-success' : 'text-primary'}`}
            />
            <span className="text-metric">
              {steps.toLocaleString()}
            </span>
          </div>
          <p className="text-label text-mutedText">steps today</p>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          value={steps}
          max={goal}
          variant={isGoalReached ? 'success' : 'primary'}
          showLabel={true}
          label="Progress"
          animated={true}
        />

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Icon name="location" className="w-3 h-3 text-mutedText" />
              <span className="text-label font-semibold">
                {distance}km
              </span>
            </div>
            <p className="text-label text-mutedText">distance</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Icon name="fire" className="w-3 h-3 text-mutedText" />
              <span className="text-label font-semibold">
                {calories}
              </span>
            </div>
            <p className="text-label text-mutedText">calories</p>
          </div>
        </div>

        {/* Goal Achievement Badge */}
        {isGoalReached && (
          <Badge variant="success" size="md" icon="check" className="w-full justify-center">
            🎉 Goal Reached!
          </Badge>
        )}
      </div>
    </BaseWidget>
  )
}

export default StepsWidget
