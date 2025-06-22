import React, { ReactNode } from 'react'
import Icon, { IconName } from '../../components/Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  icon?: IconName
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

/**
 * Button Component - Design System
 * Standardized button component with consistent styling and behavior
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  className = '',
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-opacity-90 focus:ring-primary',
    secondary: 'bg-widget-grey text-font-primary hover:bg-opacity-80 focus:ring-widget-grey',
    success: 'bg-success text-font-primary hover:bg-opacity-80 focus:ring-success',
    warning: 'bg-warning text-font-primary hover:bg-opacity-80 focus:ring-warning',
    danger: 'bg-danger text-white hover:bg-opacity-90 focus:ring-danger',
    ghost: 'bg-transparent text-font-primary hover:bg-widget-grey focus:ring-widget-grey'
  }
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  const iconSizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  const widthClasses = fullWidth ? 'w-full' : ''
  
  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${widthClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  const iconElement = icon && (
    <Icon 
      name={icon} 
      className={`${iconSizeMap[size]} ${children ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : ''}`}
      spin={loading && icon === 'refresh'}
    />
  )

  const loadingIcon = loading && !icon && (
    <Icon name="refresh" className={`${iconSizeMap[size]} mr-2`} spin />
  )

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {iconPosition === 'left' && iconElement}
      {loadingIcon}
      {children}
      {iconPosition === 'right' && iconElement}
    </button>
  )
}

export default Button
