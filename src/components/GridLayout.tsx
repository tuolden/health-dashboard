/**
 * Grid Layout Component - Issue #15
 * 
 * 4-column grid system for custom dashboard widget placement
 */

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import CustomDashboardWidget from './CustomDashboardWidget'

interface GridLayoutProps {
  widgets: CustomDashboardWidget[]
  editMode: boolean
  timeRange: string
  onAddWidget: (gridX: number, gridY: number) => void
  onRemoveWidget: (widgetId: number) => void
  onResizeWidget: (widgetId: number, newSize: 'small' | 'medium' | 'large') => void
  onMoveWidget: (widgetId: number, newX: number, newY: number) => void
  darkMode?: boolean
}

// CustomDashboardWidget interface is imported from the parent component

/**
 * Grid Layout Component
 * Renders a 4-column grid with widget placement and editing capabilities
 */
const GridLayout: React.FC<GridLayoutProps> = ({
  widgets,
  editMode,
  timeRange,
  onAddWidget,
  onRemoveWidget,
  onResizeWidget,
  onMoveWidget,
  darkMode = false
}) => {
  console.log('🏗️ [GridLayout] Rendering grid with', widgets.length, 'widgets')

  // Grid configuration
  const GRID_COLUMNS = 4
  const GRID_ROWS = Math.max(10, Math.ceil(widgets.length / 2) + 5) // Dynamic rows with minimum

  // Get widget size in grid units
  const getWidgetSize = (size: string) => {
    switch (size) {
      case 'small': return { width: 1, height: 1 }
      case 'medium': return { width: 2, height: 1 }
      case 'large': return { width: 4, height: 1 }
      default: return { width: 2, height: 1 }
    }
  }

  // Check if a grid cell is occupied by a widget
  const isCellOccupied = (x: number, y: number): CustomDashboardWidget | null => {
    for (const widget of widgets) {
      const size = getWidgetSize(widget.size)
      
      // Check if the cell (x, y) is within this widget's bounds
      if (x >= widget.grid_x && 
          x < widget.grid_x + size.width && 
          y >= widget.grid_y && 
          y < widget.grid_y + size.height) {
        return widget
      }
    }
    return null
  }

  // Get widget display name
  const getWidgetDisplayName = (widgetType: string) => {
    // Convert widget type to display name
    return widgetType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Render a grid cell
  const renderGridCell = (x: number, y: number) => {
    const occupyingWidget = isCellOccupied(x, y)
    const cellKey = `${x}-${y}`

    if (occupyingWidget && occupyingWidget.grid_x === x && occupyingWidget.grid_y === y) {
      // This is the top-left cell of a widget - render the widget
      const size = getWidgetSize(occupyingWidget.size)
      
      return (
        <div
          key={cellKey}
          className={`
            relative border-2 border-dashed rounded-lg p-4 transition-all
            ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}
            ${editMode ? 'hover:border-blue-400' : ''}
          `}
          style={{
            gridColumn: `span ${size.width}`,
            gridRow: `span ${size.height}`,
            minHeight: '120px'
          }}
        >
          {/* Widget Content */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {getWidgetDisplayName(occupyingWidget.widget_type)}
              </h3>
              
              {editMode && (
                <div className="flex items-center gap-1">
                  {/* Size selector */}
                  <select
                    value={occupyingWidget.size}
                    onChange={(e) => onResizeWidget(occupyingWidget.id, e.target.value as any)}
                    className={`text-xs px-1 py-0.5 rounded border ${
                      darkMode 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="small">S</option>
                    <option value="medium">M</option>
                    <option value="large">L</option>
                  </select>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveWidget(occupyingWidget.id)}
                    className="text-xs px-1 py-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            
            {/* Actual Widget Component */}
            <div className="flex-1 overflow-hidden">
              <CustomDashboardWidget
                widgetType={occupyingWidget.widget_type}
                size={occupyingWidget.size}
                timeRange={timeRange}
                widgetConfig={occupyingWidget.widget_config}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      )
    } else if (occupyingWidget) {
      // This cell is occupied by a widget but not the top-left corner - skip rendering
      return null
    } else if (editMode) {
      // Empty cell in edit mode - show add button
      return (
        <div
          key={cellKey}
          className={`
            border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer
            ${darkMode 
              ? 'border-gray-600 hover:border-blue-400 hover:bg-gray-700' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
          style={{ minHeight: '120px' }}
          onClick={() => onAddWidget(x, y)}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FontAwesomeIcon 
                icon={faPlus} 
                className={`text-2xl mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} 
              />
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Add Widget
              </div>
              <div className={`text-xs mt-1 opacity-75 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {x},{y}
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      // Empty cell in view mode - render nothing
      return (
        <div
          key={cellKey}
          className="min-h-[120px]"
        />
      )
    }
  }

  // Generate grid cells
  const gridCells = []
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLUMNS; x++) {
      const cell = renderGridCell(x, y)
      if (cell) {
        gridCells.push(cell)
      }
    }
  }

  return (
    <div className="w-full">
      {/* Grid container */}
      <div
        className={`
          grid gap-4 w-full
          ${editMode ? 'p-4' : 'p-2'}
        `}
        style={{
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
          gridAutoRows: 'min-content'
        }}
      >
        {gridCells}
      </div>
      
      {/* Grid info */}
      {editMode && (
        <div className={`mt-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>4-column grid • Click + to add widgets • Use size controls to resize</p>
          <p className="text-xs mt-1 opacity-75">
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''} placed
          </p>
        </div>
      )}
    </div>
  )
}

export default GridLayout
