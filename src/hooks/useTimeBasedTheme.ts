import { useEffect, useState } from 'react'

/**
 * useTimeBasedTheme Hook - Issue #4
 * 
 * Automatically applies dark mode based on time of day:
 * - Dark mode: 6:00 PM - 6:00 AM (18:00 - 06:00)
 * - Light mode: 6:00 AM - 6:00 PM (06:00 - 18:00)
 * 
 * Updates every 15 minutes to ensure accurate switching
 */
export const useTimeBasedTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  // Check if current time should use dark mode
  const shouldUseDarkMode = (): boolean => {
    const now = new Date()
    const hours = now.getHours()
    
    // Dark mode from 6 PM (18:00) to 6 AM (06:00)
    return hours >= 18 || hours < 6
  }

  // Apply dark mode class to document
  const applyTheme = (isDark: boolean) => {
    const htmlElement = document.documentElement
    
    if (isDark) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
    
    setIsDarkMode(isDark)
  }

  // Initialize theme on mount and set up interval
  useEffect(() => {
    // Apply initial theme
    const initialDarkMode = shouldUseDarkMode()
    applyTheme(initialDarkMode)

    // Set up interval to check every 15 minutes (900,000 ms)
    const interval = setInterval(() => {
      const currentDarkMode = shouldUseDarkMode()
      
      // Only update if theme should change
      if (currentDarkMode !== isDarkMode) {
        applyTheme(currentDarkMode)
      }
    }, 15 * 60 * 1000) // 15 minutes

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [isDarkMode])

  // Also check on page visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const currentDarkMode = shouldUseDarkMode()
        if (currentDarkMode !== isDarkMode) {
          applyTheme(currentDarkMode)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isDarkMode])

  return {
    isDarkMode,
    shouldUseDarkMode: shouldUseDarkMode()
  }
}

export default useTimeBasedTheme
