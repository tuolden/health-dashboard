/**
 * Auto Refresh Hook
 * 
 * Simple hook for automatic page refresh every hour to keep data fresh
 * without the complexity of WebSocket connections.
 */

import { useEffect, useRef } from 'react'

interface UseAutoRefreshOptions {
  intervalMinutes?: number
  enabled?: boolean
  onRefresh?: () => void
}

const DEFAULT_OPTIONS: Required<UseAutoRefreshOptions> = {
  intervalMinutes: 60, // 1 hour
  enabled: true,
  onRefresh: () => window.location.reload()
}

export const useAutoRefresh = (options: UseAutoRefreshOptions = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<Date>(new Date())

  // Clear any existing interval
  const clearRefreshInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Start the auto-refresh interval
  const startAutoRefresh = () => {
    if (!config.enabled) return

    clearRefreshInterval()

    const intervalMs = config.intervalMinutes * 60 * 1000
    console.log(`🔄 Starting auto-refresh every ${config.intervalMinutes} minutes`)

    intervalRef.current = setInterval(() => {
      console.log('🔄 Auto-refresh triggered')
      lastRefreshRef.current = new Date()
      config.onRefresh()
    }, intervalMs)
  }

  // Stop the auto-refresh interval
  const stopAutoRefresh = () => {
    console.log('🛑 Stopping auto-refresh')
    clearRefreshInterval()
  }

  // Manual refresh function
  const manualRefresh = () => {
    console.log('🔄 Manual refresh triggered')
    lastRefreshRef.current = new Date()
    config.onRefresh()
  }

  // Get time until next refresh
  const getTimeUntilNextRefresh = () => {
    const now = new Date()
    const timeSinceLastRefresh = now.getTime() - lastRefreshRef.current.getTime()
    const intervalMs = config.intervalMinutes * 60 * 1000
    const timeUntilNext = intervalMs - timeSinceLastRefresh
    return Math.max(0, timeUntilNext)
  }

  // Get formatted time until next refresh
  const getFormattedTimeUntilNext = () => {
    const ms = getTimeUntilNextRefresh()
    const minutes = Math.floor(ms / (60 * 1000))
    const seconds = Math.floor((ms % (60 * 1000)) / 1000)
    return `${minutes}m ${seconds}s`
  }

  // Auto-start on mount and cleanup on unmount
  useEffect(() => {
    startAutoRefresh()

    return () => {
      clearRefreshInterval()
    }
  }, [config.enabled, config.intervalMinutes])

  return {
    startAutoRefresh,
    stopAutoRefresh,
    manualRefresh,
    getTimeUntilNextRefresh,
    getFormattedTimeUntilNext,
    lastRefresh: lastRefreshRef.current,
    isEnabled: config.enabled
  }
}

// Hook for widgets that want to refresh their data periodically
export const useWidgetAutoRefresh = (
  refreshCallback: () => Promise<void> | void,
  intervalMinutes: number = 60
) => {
  const { manualRefresh, ...autoRefresh } = useAutoRefresh({
    intervalMinutes,
    enabled: true,
    onRefresh: async () => {
      try {
        await refreshCallback()
      } catch (error) {
        console.error('❌ Widget auto-refresh failed:', error)
      }
    }
  })

  return {
    ...autoRefresh,
    refreshWidget: async () => {
      try {
        await refreshCallback()
      } catch (error) {
        console.error('❌ Manual widget refresh failed:', error)
      }
    }
  }
}
