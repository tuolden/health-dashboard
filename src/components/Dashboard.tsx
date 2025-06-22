import React, { useState, useEffect } from 'react'
import { WidgetDataState } from '../types/widget'
import { getEnabledWidgets, defaultDashboardLayout } from '../widgets/widgets.config'
import { GridOverlay } from '../DesignSystem'
import StickyHeader from './StickyHeader'

/**
 * Dashboard Component - Main container for all widgets
 * Optimized for vertical screen layouts with responsive grid system
 */
const Dashboard: React.FC = () => {
  const [widgetData, setWidgetData] = useState<Record<string, any>>({})
  const [widgetStates, setWidgetStates] = useState<Record<string, WidgetDataState>>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const enabledWidgets = getEnabledWidgets()
  
  // Initialize widget states
  useEffect(() => {
    const initialStates: Record<string, WidgetDataState> = {}
    enabledWidgets.forEach(widget => {
      initialStates[widget.id] = {
        isLoading: false,
        isError: false,
        lastUpdated: null
      }
    })
    setWidgetStates(initialStates)
  }, [])

  // Load data for a specific widget
  const loadWidgetData = async (widgetId: string) => {
    const widget = enabledWidgets.find(w => w.id === widgetId)
    if (!widget) return

    // Update state to loading
    setWidgetStates(prev => ({
      ...prev,
      [widgetId]: { ...prev[widgetId], isLoading: true, isError: false }
    }))

    try {
      const data = await widget.mockDataGenerator()
      const now = new Date()
      setWidgetData(prev => ({ ...prev, [widgetId]: data }))
      setWidgetStates(prev => ({
        ...prev,
        [widgetId]: {
          isLoading: false,
          isError: false,
          lastUpdated: now
        }
      }))
      // Update overall dashboard last updated time
      setLastUpdated(now)
    } catch (error) {
      console.error(`Failed to load data for widget ${widgetId}:`, error)
      setWidgetStates(prev => ({
        ...prev,
        [widgetId]: {
          isLoading: false,
          isError: true,
          lastUpdated: prev[widgetId].lastUpdated,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
  }

  // Load all widget data on mount
  useEffect(() => {
    enabledWidgets.forEach(widget => {
      loadWidgetData(widget.id)
    })
  }, [])

  // Handle widget refresh
  const handleWidgetRefresh = (widgetId: string) => {
    loadWidgetData(widgetId)
  }

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // TODO: Implement search filtering logic for widgets
    console.log('Search query:', query)
  }

  // Get grid column classes based on screen size
  const getGridClasses = (): string => {
    return `
      grid gap-4 
      grid-cols-1 
      sm:grid-cols-2 
      md:grid-cols-3 
      lg:grid-cols-4
      auto-rows-min
    `
  }

  return (
    <div className="min-h-screen bg-app-background">
      {/* Simple Header for Testing */}
      <header className="sticky top-0 z-50 h-16 px-6 bg-white shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: '#101316' }}>Health Dashboard</h1>
        <span className="text-sm text-gray-500">
          {lastUpdated ? `Updated ${Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000)} min ago` : 'Loading...'}
        </span>
      </header>

      {/* Main Dashboard Content */}
      <main className="pt-16 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Grid */}
          <div className={getGridClasses()}>
            {enabledWidgets.map((widget) => {
              const WidgetComponent = widget.component
              const data = widgetData[widget.id]
              const dataState = widgetStates[widget.id] || {
                isLoading: false,
                isError: false,
                lastUpdated: null
              }

              return (
                <div
                  key={widget.id}
                  className={`
                    ${widget.size[0] === 2 ? 'sm:col-span-2' : ''}
                    ${widget.size[0] === 3 ? 'sm:col-span-2 md:col-span-3' : ''}
                    ${widget.size[0] === 4 ? 'col-span-full' : ''}
                    ${widget.size[1] === 2 ? 'row-span-2' : ''}
                  `}
                >
                  <WidgetComponent
                    config={widget}
                    data={data}
                    dataState={dataState}
                    onRefresh={() => handleWidgetRefresh(widget.id)}
                  />
                </div>
              )
            })}
          </div>

          {/* Dashboard Footer */}
          <div className="mt-8 pt-4 border-t border-widget-grey text-center">
            <p className="text-label text-mutedText">
              Health Dashboard • Optimized for vertical screens
            </p>
          </div>
        </div>
      </main>

      {/* Developer Grid Overlay */}
      <GridOverlay columns={4} rows={8} />
    </div>
  )
}

export default Dashboard
