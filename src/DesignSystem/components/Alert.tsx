import React, { ReactNode } from 'react'
import Icon, { IconName } from '../../components/Icon'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps {
  children: ReactNode
  variant?: AlertVariant
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

/**
 * Alert Component - Design System
 * Contextual feedback messages for user actions
 */
const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const baseClasses = 'p-4 rounded-lg border'
  
  const variantConfig = {
    info: {
      classes: 'bg-widget-dark-blue border-widget-dark-blue text-font-primary',
      icon: 'info' as IconName
    },
    success: {
      classes: 'bg-success bg-opacity-10 border-success border-opacity-20 text-success',
      icon: 'check' as IconName
    },
    warning: {
      classes: 'bg-warning bg-opacity-10 border-warning border-opacity-20 text-warning',
      icon: 'warning' as IconName
    },
    danger: {
      classes: 'bg-danger bg-opacity-10 border-danger border-opacity-20 text-danger',
      icon: 'error' as IconName
    }
  }
  
  const config = variantConfig[variant]
  
  const classes = `
    ${baseClasses}
    ${config.classes}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  return (
    <div className={classes} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon name={config.icon} className="w-5 h-5" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 transition-colors"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Alert
