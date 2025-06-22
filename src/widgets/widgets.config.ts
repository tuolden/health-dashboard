import { WidgetRegistryEntry, WIDGET_SIZES } from '../types/widget'

import React from 'react'

// Import widget components (will be created next)
import StepsWidget from './StepsWidget'
import WaterIntakeWidget from './WaterIntakeWidget'
// import CaloriesWidget from './CaloriesWidget'
// import HeartRateWidget from './HeartRateWidget'
// import WeightHistoryWidget from './WeightHistoryWidget'

// Temporary placeholder components for widgets not yet created
const CaloriesWidget: React.FC<any> = () => React.createElement('div', null, 'Calories Widget Coming Soon')
const HeartRateWidget: React.FC<any> = () => React.createElement('div', null, 'Heart Rate Widget Coming Soon')
const WeightHistoryWidget: React.FC<any> = () => React.createElement('div', null, 'Weight History Widget Coming Soon')

// Import mock data generators
import { 
  generateMockStepsData,
  generateMockWaterData,
  generateMockCaloriesData,
  generateMockHeartRateData,
  generateMockWeightData
} from './mockData'

/**
 * Widget Registry - Central configuration for all available widgets
 * Optimized for vertical screen layouts
 */
export const widgetRegistry: WidgetRegistryEntry[] = [
  {
    id: 'steps-today',
    title: 'Steps Today',
    description: 'Daily step count and progress toward goal',
    component: StepsWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 300000, // 5 minutes
    mockDataGenerator: generateMockStepsData,
    category: 'activity',
    priority: 10,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#79BBFF',
      animation: 'fade-in'
    }
  },
  {
    id: 'water-intake',
    title: 'Water Intake',
    description: 'Daily hydration tracking',
    component: WaterIntakeWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'interval',
    refreshInterval: 600000, // 10 minutes
    mockDataGenerator: generateMockWaterData,
    category: 'nutrition',
    priority: 9,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#B8F2E6',
      animation: 'scale-in'
    }
  },
  {
    id: 'calories-macros',
    title: 'Calories & Macros',
    description: 'Daily calorie intake with macronutrient breakdown',
    component: CaloriesWidget,
    size: WIDGET_SIZES.MEDIUM,
    refreshStrategy: 'interval',
    refreshInterval: 900000, // 15 minutes
    mockDataGenerator: generateMockCaloriesData,
    category: 'nutrition',
    priority: 8,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#FFD94D',
      animation: 'pulse-soft'
    }
  },
  {
    id: 'heart-rate',
    title: 'Heart Rate',
    description: 'Current and resting heart rate monitoring',
    component: HeartRateWidget,
    size: WIDGET_SIZES.SMALL,
    refreshStrategy: 'websocket',
    refreshInterval: 60000, // 1 minute fallback
    mockDataGenerator: generateMockHeartRateData,
    category: 'vitals',
    priority: 7,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#FF6B6B',
      animation: 'pulse-soft'
    }
  },
  {
    id: 'weight-history',
    title: 'Weight Trend',
    description: 'Weight tracking with 7-day trend',
    component: WeightHistoryWidget,
    size: WIDGET_SIZES.LARGE,
    refreshStrategy: 'interval',
    refreshInterval: 3600000, // 1 hour
    mockDataGenerator: generateMockWeightData,
    category: 'vitals',
    priority: 6,
    isEnabled: true,
    version: '1.0.0',
    theme: {
      accentColor: '#E0BBE4',
      animation: 'fade-in'
    }
  }
]

/**
 * Get widget configuration by ID
 */
export const getWidgetConfig = (id: string): WidgetRegistryEntry | undefined => {
  return widgetRegistry.find(widget => widget.id === id)
}

/**
 * Get widgets by category
 */
export const getWidgetsByCategory = (category: string): WidgetRegistryEntry[] => {
  return widgetRegistry.filter(widget => widget.category === category && widget.isEnabled)
}

/**
 * Get enabled widgets sorted by priority
 */
export const getEnabledWidgets = (): WidgetRegistryEntry[] => {
  return widgetRegistry
    .filter(widget => widget.isEnabled)
    .sort((a, b) => b.priority - a.priority)
}

/**
 * Default dashboard layout optimized for vertical screens
 */
export const defaultDashboardLayout = {
  id: 'default-vertical',
  name: 'Default Vertical Layout',
  description: 'Optimized layout for portrait/vertical screens',
  columns: 2, // Start with 2 columns for most vertical screens
  isDefault: true,
  widgets: [
    { id: 'steps-today', column: 1, row: 1, width: 1, height: 1 },
    { id: 'water-intake', column: 2, row: 1, width: 1, height: 1 },
    { id: 'calories-macros', column: 1, row: 2, width: 2, height: 1 },
    { id: 'heart-rate', column: 1, row: 3, width: 1, height: 1 },
    { id: 'weight-history', column: 1, row: 4, width: 2, height: 2 },
  ]
}
