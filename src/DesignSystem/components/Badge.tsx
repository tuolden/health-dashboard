import React, { ReactNode } from 'react'
import Icon, { IconName } from '../../components/Icon'

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: IconName
  removable?: boolean
  onRemove?: () => void
  className?: string
}

/**
 * Badge Component - Design System
 * Small status indicators and labels
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  removable = false,
  onRemove,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const variantClasses = {
    default: 'bg-widget-grey text-font-primary',
    primary: 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20',
    success: 'bg-success bg-opacity-10 text-success border border-success border-opacity-20',
    warning: 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20',
    danger: 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20',
    info: 'bg-widget-dark-blue text-font-primary'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }
  
  const iconSizeMap = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }
  
  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  return (
    <span className={classes}>
      {icon && (
        <Icon 
          name={icon} 
          className={`${iconSizeMap[size]} ${children ? 'mr-1' : ''}`}
        />
      )}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className={`ml-1 ${iconSizeMap[size]} hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors`}
        >
          <Icon name="close" className="w-full h-full" />
        </button>
      )}
    </span>
  )
}

export default Badge
