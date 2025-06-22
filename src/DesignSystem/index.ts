/**
 * Health Dashboard Design System
 * 
 * A comprehensive design system following Atomic Design methodology
 * for the modular health dashboard application.
 * 
 * Features:
 * - Consistent color palette with widget variants
 * - Typography system with semantic tokens
 * - Font Awesome SVG icons
 * - Reusable UI components
 * - Developer tools (grid overlay)
 * 
 * Usage:
 * import { Button, Card, Icon, colors, typography } from '@/DesignSystem'
 */

// Components
export * from './components'
export { default as GridOverlay } from './components/GridOverlay'

// Design Tokens
export const colors = {
  // Global App Colors
  appBackground: '#F4F6FA',
  fontPrimary: '#101316',
  
  // Widget Background Variants
  widgetDefault: '#FFFFFF',
  widgetPurple: '#DBD4FD',
  widgetGreen: '#E4F0E6',
  widgetPink: '#FED5D6',
  widgetYellow: '#F1F7DB',
  widgetGrey: '#E0E1E5',
  widgetLightPurple: '#F2E3FE',
  widgetDarkBlue: '#E3ECF9',
  
  // Legacy colors (for backward compatibility)
  primary: '#79BBFF',
  warning: '#FFD94D',
  danger: '#FF6B6B',
  success: '#B8F2E6',
  lavender: '#E0BBE4',
  orange: '#FFAD60',
  mutedText: '#6B7280'
} as const

export const typography = {
  // Font families
  fonts: {
    heading: ['Poppins', 'sans-serif'],
    body: ['Inter', 'sans-serif']
  },
  
  // Semantic typography tokens
  tokens: {
    title: { size: '2rem', lineHeight: '2.5rem', weight: '700' },
    titleLg: { size: '3rem', lineHeight: '3.5rem', weight: '700' },
    subtitle: { size: '1.25rem', lineHeight: '1.75rem', weight: '600' },
    widgetTitle: { size: '1.125rem', lineHeight: '1.5rem', weight: '500' },
    label: { size: '0.875rem', lineHeight: '1.25rem', weight: '500' },
    body: { size: '1rem', lineHeight: '1.5rem', weight: '400' },
    metric: { size: '2.25rem', lineHeight: '2.5rem', weight: '700' },
    metricLg: { size: '3rem', lineHeight: '3.5rem', weight: '700' }
  }
} as const

export const spacing = {
  // Widget spacing
  widgetGap: '1rem',
  sectionGap: '2rem',
  navHeight: '4rem',
  
  // Component spacing
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem'
} as const

export const shadows = {
  widget: '0 2px 8px rgba(0, 0, 0, 0.06)',
  widgetHover: '0 4px 12px rgba(0, 0, 0, 0.1)',
  nav: '0 2px 4px rgba(0, 0, 0, 0.05)'
} as const

export const borderRadius = {
  widget: '1.5rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px'
} as const

// Utility functions
export const getWidgetBackgroundClass = (variant: string) => {
  const variantMap: Record<string, string> = {
    default: 'bg-widget-default',
    purple: 'bg-widget-purple',
    green: 'bg-widget-green',
    pink: 'bg-widget-pink',
    yellow: 'bg-widget-yellow',
    grey: 'bg-widget-grey',
    'light-purple': 'bg-widget-light-purple',
    'dark-blue': 'bg-widget-dark-blue'
  }
  return variantMap[variant] || variantMap.default
}

export const getTypographyClass = (token: string) => {
  const tokenMap: Record<string, string> = {
    title: 'text-title',
    'title-lg': 'text-title-lg',
    subtitle: 'text-subtitle',
    'widget-title': 'text-widget-title',
    label: 'text-label',
    body: 'text-body',
    metric: 'text-metric',
    'metric-lg': 'text-metric-lg'
  }
  return tokenMap[token] || tokenMap.body
}

// Design System version
export const version = '1.0.0'
