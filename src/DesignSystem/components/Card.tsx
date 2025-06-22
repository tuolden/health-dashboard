import React, { ReactNode } from 'react'

export type CardVariant = 'default' | 'purple' | 'green' | 'pink' | 'yellow' | 'grey' | 'light-purple' | 'dark-blue'

interface CardProps {
  children: ReactNode
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  className?: string
}

/**
 * Card Component - Design System
 * Container component for grouping related content
 */
const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  shadow = 'md',
  hover = false,
  className = ''
}) => {
  const baseClasses = 'rounded-widget transition-all duration-200'
  
  const variantClasses = {
    default: 'bg-widget-default',
    purple: 'bg-widget-purple',
    green: 'bg-widget-green',
    pink: 'bg-widget-pink',
    yellow: 'bg-widget-yellow',
    grey: 'bg-widget-grey',
    'light-purple': 'bg-widget-light-purple',
    'dark-blue': 'bg-widget-dark-blue'
  }
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-widget',
    lg: 'shadow-lg'
  }
  
  const hoverClasses = hover ? 'hover:shadow-widget-hover hover:scale-[1.02]' : ''
  
  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${shadowClasses[shadow]}
    ${hoverClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  return (
    <div className={classes}>
      {children}
    </div>
  )
}

export default Card
