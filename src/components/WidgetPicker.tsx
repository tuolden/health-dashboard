/**
 * Widget Picker Component - Issue #15
 * 
 * Modal for selecting widgets to add to custom dashboard
 */

import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faSearch, faChartLine } from '@fortawesome/free-solid-svg-icons'
import { getEnabledWidgets } from '../widgets/widgets.config'

interface WidgetPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectWidget: (widgetType: string, size: 'small' | 'medium' | 'large') => void
  darkMode?: boolean
}

interface WidgetOption {
  id: string
  title: string
  description: string
  category: string
  defaultSize: 'small' | 'medium' | 'large'
  icon: string
}

/**
 * Widget Picker Component
 * Shows available widgets in a searchable modal interface
 */
const WidgetPicker: React.FC<WidgetPickerProps> = ({
  isOpen,
  onClose,
  onSelectWidget,
  darkMode = false
}) => {
  console.log('🧩 [WidgetPicker] Modal open:', isOpen)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium')

  // Get available widgets from the existing widget configuration
  const availableWidgets: WidgetOption[] = getEnabledWidgets().map(widget => ({
    id: widget.id,
    title: widget.title,
    description: widget.description || `${widget.title} widget for health monitoring`,
    category: widget.category || 'health',
    defaultSize: widget.defaultSize || 'medium',
    icon: widget.icon || 'chart-line'
  }))

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(availableWidgets.map(w => w.category)))]

  // Filter widgets based on search and category
  const filteredWidgets = availableWidgets.filter(widget => {
    const matchesSearch = widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Handle widget selection
  const handleSelectWidget = (widget: WidgetOption) => {
    console.log('🧩 [WidgetPicker] Selected widget:', widget.id, 'size:', selectedSize)
    onSelectWidget(widget.id, selectedSize)
    onClose()
  }

  // Handle modal close
  const handleClose = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-4xl max-h-[90vh] mx-4 rounded-lg shadow-xl overflow-hidden
        ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 border-b
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add Widget
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose a widget to add to your dashboard
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className={`
              p-2 rounded-lg transition-colors
              ${darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>
        
        {/* Controls */}
        <div className={`
          p-6 border-b space-y-4
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          {/* Search and Category */}
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search widgets..."
                className={`
                  w-full pl-10 pr-4 py-2 rounded-lg border
                  ${darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }
                `}
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`
                px-4 py-2 rounded-lg border
                ${darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
                }
              `}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Size Selector */}
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Widget Size:
            </span>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`
                    px-3 py-1 rounded text-sm font-medium transition-colors
                    ${selectedSize === size
                      ? 'bg-blue-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)} ({
                    size === 'small' ? '1x1' : 
                    size === 'medium' ? '2x1' : '4x1'
                  })
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Widget Grid */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {filteredWidgets.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon 
                icon={faChartLine} 
                className={`text-4xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} 
              />
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                No widgets found
              </h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWidgets.map(widget => (
                <div
                  key={widget.id}
                  onClick={() => handleSelectWidget(widget)}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all
                    ${darkMode 
                      ? 'border-gray-600 bg-gray-700 hover:border-blue-400 hover:bg-gray-600' 
                      : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${darkMode ? 'bg-gray-600' : 'bg-white'}
                    `}>
                      <FontAwesomeIcon 
                        icon={faChartLine} 
                        className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} 
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {widget.title}
                      </h3>
                      <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {widget.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`
                          text-xs px-2 py-0.5 rounded
                          ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}
                        `}>
                          {widget.category}
                        </span>
                        <span className={`
                          text-xs px-2 py-0.5 rounded
                          ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}
                        `}>
                          Default: {widget.defaultSize}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`
          p-6 border-t
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <div className="flex justify-between items-center">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {filteredWidgets.length} widget{filteredWidgets.length !== 1 ? 's' : ''} available
            </p>
            <button
              onClick={handleClose}
              className={`
                px-4 py-2 rounded-lg transition-colors
                ${darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WidgetPicker
