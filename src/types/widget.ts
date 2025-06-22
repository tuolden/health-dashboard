import { ReactNode } from 'react'

// Widget size configuration for vertical layout optimization
export type WidgetSize = [number, number] // [columns, rows]

// Predefined widget sizes optimized for vertical screens
export const WIDGET_SIZES = {
  SMALL: [1, 1] as WidgetSize,      // 1x1 - Perfect for single metrics
  MEDIUM: [2, 1] as WidgetSize,     // 2x1 - Good for metrics with charts
  LARGE: [2, 2] as WidgetSize,      // 2x2 - Complex widgets with multiple data points
  WIDE: [3, 1] as WidgetSize,       // 3x1 - Horizontal charts/timelines
  EXTRA_WIDE: [3, 2] as WidgetSize, // 3x2 - Large charts and complex visualizations
  FULL_WIDTH: [4, 1] as WidgetSize, // Full width for important widgets
} as const

// Widget refresh strategies
export type RefreshStrategy = 'manual' | 'interval' | 'websocket' | 'hybrid'

// Widget data state
export interface WidgetDataState {
  isLoading: boolean
  isError: boolean
  lastUpdated: Date | null
  errorMessage?: string
}

// Base widget data interface
export interface BaseWidgetData {
  id: string
  timestamp: Date
  source?: string
}

// Widget configuration interface
export interface WidgetConfig {
  id: string
  title: string
  description?: string
  component: React.ComponentType<WidgetProps>
  size: WidgetSize
  refreshStrategy: RefreshStrategy
  refreshInterval?: number // in milliseconds
  mockDataGenerator: () => Promise<any>
  category: WidgetCategory
  priority: number // Higher number = higher priority in layout
  isEnabled: boolean
}

// Widget categories for organization
export type WidgetCategory = 
  | 'activity'      // Steps, workouts, movement
  | 'nutrition'     // Calories, water, macros
  | 'vitals'        // Heart rate, blood pressure, weight
  | 'recovery'      // Sleep, stress, muscle recovery
  | 'tracking'      // Pain zones, medication, supplements
  | 'analytics'     // Charts, trends, summaries

// Props that every widget component receives
export interface WidgetProps {
  config: WidgetConfig
  data: any
  dataState: WidgetDataState
  onRefresh: () => void
  className?: string
}

// Widget layout position for grid system
export interface WidgetPosition {
  id: string
  column: number
  row: number
  width: number  // span columns
  height: number // span rows
}

// Dashboard layout configuration
export interface DashboardLayout {
  id: string
  name: string
  description?: string
  widgets: WidgetPosition[]
  columns: number // Total columns in grid
  isDefault: boolean
}

// Widget animation types for refresh feedback
export type WidgetAnimation = 'fade-in' | 'pulse-soft' | 'scale-in' | 'slide-up' | 'none'

// Widget theme customization
export interface WidgetTheme {
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  accentColor?: string
  animation?: WidgetAnimation
}

// Widget registry entry
export interface WidgetRegistryEntry extends WidgetConfig {
  version: string
  dependencies?: string[]
  theme?: WidgetTheme
}

// Dashboard configuration
export interface DashboardConfig {
  title: string
  layout: DashboardLayout
  refreshInterval: number
  enableAnimations: boolean
  enableWebSockets: boolean
  theme: 'light' // Fixed for V1
}
