import React, { useEffect, useState } from 'react'
import Button from './Button'
import Icon from '../../components/Icon'

interface GridOverlayProps {
  columns?: number
  rows?: number
  gap?: number
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
}

/**
 * GridOverlay Component - Developer Tool
 * Visual grid overlay for development and design alignment
 * Only available in development mode
 */
const GridOverlay: React.FC<GridOverlayProps> = ({
  columns = 4,
  rows = 8,
  gap = 16,
  enabled = false,
  onToggle
}) => {
  const [isVisible, setIsVisible] = useState(enabled)
  const [isDev, setIsDev] = useState(false)

  // Check if we're in development mode
  useEffect(() => {
    setIsDev(import.meta.env.DEV)
  }, [])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + G to toggle grid
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'G') {
        event.preventDefault()
        toggleGrid()
      }
    }

    if (isDev) {
      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isDev, isVisible])

  const toggleGrid = () => {
    const newState = !isVisible
    setIsVisible(newState)
    onToggle?.(newState)
  }

  // Don't render in production
  if (!isDev) {
    return null
  }

  // Generate grid lines
  const verticalLines = Array.from({ length: columns + 1 }, (_, i) => i)
  const horizontalLines = Array.from({ length: rows + 1 }, (_, i) => i)

  return (
    <>
      {/* Grid Toggle Button */}
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Button
          variant="secondary"
          size="sm"
          icon="grid"
          onClick={toggleGrid}
          className={`
            shadow-lg backdrop-blur-sm
            ${isVisible ? 'bg-primary text-white' : 'bg-widget-default'}
          `}
        >
          Grid
        </Button>
      </div>

      {/* Grid Overlay */}
      {isVisible && (
        <div 
          className="fixed inset-0 pointer-events-none z-[9998]"
          style={{ top: '4rem' }} // Account for nav bar
        >
          {/* Grid Container */}
          <div 
            className="w-full h-full relative"
            style={{ 
              padding: `${gap}px`,
              paddingTop: `${gap * 2}px` // Extra space for nav
            }}
          >
            {/* Vertical Grid Lines */}
            {verticalLines.map((line) => (
              <div
                key={`v-${line}`}
                className="absolute top-0 bottom-0 border-l border-primary border-opacity-30"
                style={{
                  left: `${(line / columns) * 100}%`,
                  marginLeft: line === 0 ? `${gap}px` : line === columns ? `-${gap}px` : '0'
                }}
              />
            ))}

            {/* Horizontal Grid Lines */}
            {horizontalLines.map((line) => (
              <div
                key={`h-${line}`}
                className="absolute left-0 right-0 border-t border-primary border-opacity-30"
                style={{
                  top: `${(line / rows) * 100}%`,
                  marginTop: line === 0 ? `${gap * 2}px` : '0'
                }}
              />
            ))}

            {/* Grid Info */}
            <div className="absolute top-4 left-4 bg-widget-default bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="text-label text-font-primary space-y-1">
                <div className="flex items-center space-x-2">
                  <Icon name="grid" className="w-4 h-4" />
                  <span className="font-medium">Grid Overlay</span>
                </div>
                <div className="text-xs text-mutedText space-y-0.5">
                  <div>Columns: {columns}</div>
                  <div>Rows: {rows}</div>
                  <div>Gap: {gap}px</div>
                  <div className="pt-1 border-t border-widget-grey">
                    <kbd className="px-1 py-0.5 bg-widget-grey rounded text-xs">
                      Ctrl+Shift+G
                    </kbd> to toggle
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GridOverlay
