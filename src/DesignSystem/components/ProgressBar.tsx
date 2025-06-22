import React from 'react'

export type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger'
export type ProgressSize = 'sm' | 'md' | 'lg'

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  variant?: ProgressVariant
  size?: ProgressSize
  showLabel?: boolean
  label?: string
  animated?: boolean
  className?: string
}

/**
 * ProgressBar Component - Design System
 * Visual indicator for progress or completion status
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  animated = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const containerClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }
  
  const variantClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger'
  }
  
  const animationClasses = animated ? 'transition-all duration-500 ease-out' : ''
  
  const containerClass = `
    w-full bg-widget-grey rounded-full overflow-hidden
    ${containerClasses[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ')
  
  const barClass = `
    h-full rounded-full
    ${variantClasses[variant]}
    ${animationClasses}
  `.trim().replace(/\s+/g, ' ')

  return (
    <div className="space-y-1">
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-font-primary font-medium">
            {label || 'Progress'}
          </span>
          <span className="text-mutedText">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={containerClass}>
        <div 
          className={barClass}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

export default ProgressBar
