import React, { ReactNode } from 'react'
import Icon, { IconName } from '../../components/Icon'

interface NavItem {
  id: string
  label: string
  icon?: IconName
  active?: boolean
  onClick?: () => void
}

interface TopNavBarProps {
  title: string
  items?: NavItem[]
  actions?: ReactNode
  className?: string
}

/**
 * TopNavBar Component - Design System
 * Fixed navigation bar optimized for vertical screens
 */
const TopNavBar: React.FC<TopNavBarProps> = ({
  title,
  items = [],
  actions,
  className = ''
}) => {
  const classes = `
    fixed top-0 left-0 right-0 z-50 
    bg-widget-default shadow-nav
    h-16 px-4
    flex items-center justify-between
    ${className}
  `.trim().replace(/\s+/g, ' ')

  return (
    <nav className={classes}>
      {/* Left side - Title */}
      <div className="flex items-center space-x-4">
        <h1 className="text-title font-heading text-font-primary">
          {title}
        </h1>
      </div>

      {/* Center - Navigation Items (if any) */}
      {items.length > 0 && (
        <div className="hidden sm:flex items-center space-x-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${item.active 
                  ? 'bg-primary text-white' 
                  : 'text-font-primary hover:bg-widget-grey'
                }
              `}
            >
              {item.icon && (
                <Icon name={item.icon} className="w-4 h-4" />
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right side - Actions */}
      <div className="flex items-center space-x-3">
        {actions}
        
        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-label text-mutedText hidden sm:inline">
            Live
          </span>
        </div>
      </div>

      {/* Mobile menu button (if nav items exist) */}
      {items.length > 0 && (
        <div className="sm:hidden">
          <button className="p-2 rounded-lg hover:bg-widget-grey transition-colors">
            <Icon name="grid" className="w-5 h-5 text-font-primary" />
          </button>
        </div>
      )}
    </nav>
  )
}

export default TopNavBar
