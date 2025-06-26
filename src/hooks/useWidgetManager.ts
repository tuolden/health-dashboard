/**
 * Widget Manager Hook
 *
 * Centralized widget refresh management system for manual widget refreshes.
 * WebSocket functionality has been removed in favor of simple auto-refresh.
 */

import { useCallback, useState } from 'react'

export type WidgetType = 'cpap' | 'spo2-trend' | 'spo2-pulse' | 'leak-rate' | 'sleep-session' | 'all'

interface UseWidgetManagerOptions {
  onWidgetRefresh?: (widgetType: string) => void
  refreshDelay?: number // Delay before triggering refresh (to show loading state)
}

export const useWidgetManager = (options: UseWidgetManagerOptions = {}) => {
  const { onWidgetRefresh, refreshDelay = 500 } = options

  const [refreshingWidgets, setRefreshingWidgets] = useState<Set<string>>(new Set())
  const [lastRefreshTimes, setLastRefreshTimes] = useState<Record<string, Date>>({})
  
  // Registry of widget refresh callbacks
  const widgetCallbacks = new Map<string, () => Promise<void> | void>()

  // Register a widget's refresh callback
  const registerWidget = useCallback((widgetType: string, refreshCallback: () => Promise<void> | void) => {
    console.log(`📝 Registering widget: ${widgetType}`)
    widgetCallbacks.set(widgetType, refreshCallback)
    
    // Return unregister function
    return () => {
      console.log(`📝 Unregistering widget: ${widgetType}`)
      widgetCallbacks.delete(widgetType)
    }
  }, [])

  // Helper to update refreshing state
  const setWidgetRefreshing = useCallback((widgetType: string, refreshing: boolean) => {
    setRefreshingWidgets(prev => {
      const newSet = new Set(prev)
      if (refreshing) {
        newSet.add(widgetType)
      } else {
        newSet.delete(widgetType)
        setLastRefreshTimes(prevTimes => ({
          ...prevTimes,
          [widgetType]: new Date()
        }))
      }
      return newSet
    })
  }, [])

  // Trigger refresh for specific widget type
  const refreshWidget = useCallback(async (widgetType: string) => {
    console.log(`🔄 Refreshing widget: ${widgetType}`)
    
    // Set refreshing state
    setWidgetRefreshing(widgetType, true)
    onWidgetRefresh?.(widgetType)

    try {
      // Add delay to show loading state
      if (refreshDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, refreshDelay))
      }

      // Get the refresh callback for this widget type
      const refreshCallback = widgetCallbacks.get(widgetType)
      
      if (refreshCallback) {
        await refreshCallback()
        console.log(`✅ Widget refreshed successfully: ${widgetType}`)
      } else {
        console.warn(`⚠️ No refresh callback registered for widget: ${widgetType}`)
      }
    } catch (error) {
      console.error(`❌ Failed to refresh widget ${widgetType}:`, error)
    } finally {
      // Clear refreshing state
      setWidgetRefreshing(widgetType, false)
    }
  }, [setWidgetRefreshing, onWidgetRefresh, refreshDelay])

  // Refresh multiple widgets based on type
  const refreshWidgetsByType = useCallback(async (widgetType: WidgetType) => {
    console.log(`🔄 Refreshing widgets by type: ${widgetType}`)

    const widgetsToRefresh: string[] = []

    switch (widgetType) {
      case 'cpap':
        // Refresh all CPAP-related widgets
        widgetsToRefresh.push('spo2-trend', 'spo2-pulse', 'leak-rate', 'sleep-session')
        break
      case 'all':
        // Refresh all registered widgets
        widgetsToRefresh.push(...Array.from(widgetCallbacks.keys()))
        break
      default:
        // Refresh specific widget type
        widgetsToRefresh.push(widgetType)
        break
    }

    // Refresh widgets in parallel
    const refreshPromises = widgetsToRefresh
      .filter(type => widgetCallbacks.has(type))
      .map(type => refreshWidget(type))

    await Promise.allSettled(refreshPromises)
  }, [refreshWidget])

  // Manual refresh functions
  const manualRefresh = useCallback(async (widgetType: WidgetType = 'all') => {
    console.log(`🔧 Manual refresh triggered for: ${widgetType}`)
    await refreshWidgetsByType(widgetType)
  }, [refreshWidgetsByType])

  // Get refresh status for a specific widget
  const isWidgetRefreshing = useCallback((widgetType: string) => {
    return refreshingWidgets.has(widgetType)
  }, [refreshingWidgets])

  // Get list of currently refreshing widgets
  const getRefreshingWidgets = useCallback(() => {
    return Array.from(refreshingWidgets)
  }, [refreshingWidgets])

  return {
    // Registration
    registerWidget,
    
    // Refresh functions
    refreshWidget,
    refreshWidgetsByType,
    manualRefresh,
    
    // Status queries
    isWidgetRefreshing,
    getRefreshingWidgets,
    refreshingWidgets: Array.from(refreshingWidgets),
    
    // Debug info
    registeredWidgets: Array.from(widgetCallbacks.keys())
  }
}

// Hook for individual widgets to register themselves
export const useWidgetRefresh = (
  widgetType: string, 
  refreshCallback: () => Promise<void> | void
) => {
  const { registerWidget, isWidgetRefreshing } = useWidgetManager()

  useEffect(() => {
    const unregister = registerWidget(widgetType, refreshCallback)
    return unregister
  }, [widgetType, refreshCallback, registerWidget])

  return {
    isRefreshing: isWidgetRefreshing(widgetType)
  }
}
