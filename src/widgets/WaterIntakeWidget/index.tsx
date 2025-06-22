import React from 'react'
import BaseWidget from '../../components/BaseWidget'
import { WidgetProps } from '../../types/widget'
import { WaterData } from '../mockData'
import { Badge } from '../../DesignSystem'
import Icon from '../../components/Icon'

/**
 * WaterIntakeWidget - Daily hydration tracking optimized for vertical screens
 * Shows current intake, progress toward goal, and last drink time
 */
const WaterIntakeWidget: React.FC<WidgetProps> = (props) => {
  const { data } = props
  const waterData = data as WaterData
  
  if (!waterData) {
    return (
      <BaseWidget {...props}>
        <div className="text-center text-mutedText">No water data available</div>
      </BaseWidget>
    )
  }

  const { intake, goal, lastDrink } = waterData
  const progressPercentage = Math.min((intake / goal) * 100, 100)
  const isGoalReached = intake >= goal
  
  // Calculate time since last drink
  const timeSinceLastDrink = (): string => {
    const now = new Date()
    const diffMs = now.getTime() - lastDrink.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours}h ago`
  }

  // Get hydration status color
  const getHydrationColor = (): string => {
    if (isGoalReached) return 'text-success'
    if (progressPercentage >= 60) return 'text-primary'
    if (progressPercentage >= 30) return 'text-warning'
    return 'text-danger'
  }

  // Get hydration status message
  const getHydrationStatus = (): string => {
    if (isGoalReached) return 'Well hydrated!'
    if (progressPercentage >= 60) return 'Good progress'
    if (progressPercentage >= 30) return 'Keep drinking'
    return 'Need more water'
  }

  return (
    <BaseWidget {...props}>
      <div className="space-y-3">
        {/* Main Water Display */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Icon
              name="droplet"
              className={`w-5 h-5 ${getHydrationColor()}`}
            />
            <span className={`text-metric ${getHydrationColor()}`}>
              {intake}L
            </span>
          </div>
          <p className="text-label text-mutedText">of {goal}L goal</p>
        </div>

        {/* Water Level Visualization */}
        <div className="relative mx-auto w-16 h-20 bg-lightGray rounded-lg overflow-hidden">
          {/* Water fill */}
          <div 
            className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ${
              isGoalReached ? 'bg-success' : 'bg-primary'
            } opacity-80`}
            style={{ height: `${progressPercentage}%` }}
          />
          {/* Water surface animation */}
          <div 
            className={`absolute left-0 right-0 h-1 ${
              isGoalReached ? 'bg-success' : 'bg-primary'
            } opacity-60 animate-pulse`}
            style={{ bottom: `${progressPercentage}%` }}
          />
          {/* Glass outline */}
          <div className="absolute inset-0 border-2 border-gray-300 rounded-lg" />
        </div>

        {/* Progress Information */}
        <div className="text-center space-y-1">
          <div className="flex justify-between text-label">
            <span className="text-mutedText">Progress</span>
            <span className={`font-medium ${getHydrationColor()}`}>
              {Math.round(progressPercentage)}%
            </span>
          </div>

          <p className={`text-label font-medium ${getHydrationColor()}`}>
            {getHydrationStatus()}
          </p>
        </div>

        {/* Last Drink Info */}
        <div className="flex items-center justify-center space-x-1 text-label text-mutedText">
          <Icon name="clock" className="w-3 h-3" />
          <span>Last drink {timeSinceLastDrink()}</span>
        </div>

        {/* Goal Achievement Badge */}
        {isGoalReached && (
          <Badge variant="success" size="md" icon="droplet" className="w-full justify-center">
            💧 Hydration Goal Met!
          </Badge>
        )}
      </div>
    </BaseWidget>
  )
}

export default WaterIntakeWidget
