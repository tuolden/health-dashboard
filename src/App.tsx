import React, { useState, useEffect } from 'react'
import { ApolloProvider } from '@apollo/client'
import useTimeBasedTheme from './hooks/useTimeBasedTheme'
import { apolloClient } from './graphql/client'
import { CpapSpo2TrendWidget } from './components/widgets/CpapSpo2TrendWidget'
import { CpapSpo2PulseWidget } from './components/widgets/CpapSpo2PulseWidget'
import { CpapLeakRateWidget } from './components/widgets/CpapLeakRateWidget'
import { CpapSleepSessionWidget } from './components/widgets/CpapSleepSessionWidget'
import { WorkoutSummaryWidget } from './components/widgets/WorkoutSummaryWidget'
import { WorkoutHeartRateWidget } from './components/widgets/WorkoutHeartRateWidget'
import { WorkoutCaloriesWidget } from './components/widgets/WorkoutCaloriesWidget'
import { WorkoutHeartRateTimeWidget } from './components/widgets/WorkoutHeartRateTimeWidget'
import { WorkoutZonesWidget } from './components/widgets/WorkoutZonesWidget'
import { WorkoutFatBurnRatioWidget } from './components/widgets/WorkoutFatBurnRatioWidget'
// Advanced Analytics Widgets - Temporarily disabled
// import { WorkoutRecoveryWidget } from './components/widgets/WorkoutRecoveryWidget'
// import { WorkoutIntensityWidget } from './components/widgets/WorkoutIntensityWidget'
// import { WorkoutTrainingLoadWidget } from './components/widgets/WorkoutTrainingLoadWidget'
// import { WorkoutWeeklyZonesWidget } from './components/widgets/WorkoutWeeklyZonesWidget'
// import { WorkoutOvertrainingWidget } from './components/widgets/WorkoutOvertrainingWidget'
// import { WorkoutVariabilityWidget } from './components/widgets/WorkoutVariabilityWidget'
// import { WorkoutLoadRecoveryWidget } from './components/widgets/WorkoutLoadRecoveryWidget'
// import { WorkoutWarmupWidget } from './components/widgets/WorkoutWarmupWidget'
import { WebSocketStatus } from './components/WebSocketStatus'
import { useWebSocket } from './hooks/useWebSocket'
import { useWidgetManager } from './hooks/useWidgetManager'
import { getCpapApiUrl, apiConfig } from './utils/apiConfig'
import './utils/darkModeTest' // Load test utilities
import './App.css'

function App() {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  // Initialize time-based dark mode - Issue #4
  const { isDarkMode } = useTimeBasedTheme()

  // Initialize WebSocket connection - Issue #8
  const { isConnected, isConnecting, connectionError } = useWebSocket({
    onMessage: (message) => {
      console.log('📨 WebSocket message received in App:', message)
      setLastUpdated(new Date()) // Update last updated time when data refreshes
    },
    onConnect: () => {
      console.log('✅ WebSocket connected in App')
      setLastUpdated(new Date())
    },
    onDisconnect: () => {
      console.log('🔌 WebSocket disconnected in App')
    }
  })

  // Initialize widget manager - Issue #8
  const { manualRefresh, refreshingWidgets } = useWidgetManager({
    onWidgetRefresh: (widgetType) => {
      console.log(`🔄 Widget refreshing: ${widgetType}`)
      setLastUpdated(new Date())
    }
  })

  // Update current time every minute to refresh the "last updated" display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Format last updated time
  const formatLastUpdated = (date: Date): string => {
    const diffMs = currentTime.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Updated just now'
    if (diffMins === 1) return 'Updated 1 min ago'
    return `Last updated ${diffMins} min ago`
  }

  // Handle search toggle
  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded)
    if (isSearchExpanded) {
      setSearchQuery('')
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery('')
    setIsSearchExpanded(false)
  }
  return (
    <ApolloProvider client={apolloClient}>
      <div className="min-h-screen bg-app-background dark:bg-dark-background transition-colors duration-300">
      {/* Sticky Header - Issue #3 & #4 Implementation */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-12 px-6 bg-white dark:bg-dark-card shadow-sm flex items-center justify-between transition-colors duration-300"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}
      >
        {/* Left Section: Logo + Navigation */}
        <div className="flex items-center gap-x-8">
          {/* Logo Placeholder */}
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-500 transition-colors duration-300"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-label="Health Dashboard Logo"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>

          {/* Navigation Links */}
          <nav className="flex gap-x-6 text-base font-medium text-gray-900 dark:text-dark-text-primary">
            <a href="/dashboard" className="hover:text-blue-600 dark:hover:text-dark-accent-blue transition-colors duration-200">
              Dashboard
            </a>
            <a href="/vitals" className="hover:text-blue-600 dark:hover:text-dark-accent-blue transition-colors duration-200">
              Vitals
            </a>
          </nav>
        </div>

        {/* Right Section: Last Updated + Search */}
        <div className="flex items-center gap-x-4">
          {/* Last Updated Timestamp - Super Light and Small */}
          <span className={`text-xs font-light text-gray-400 dark:text-dark-text-muted whitespace-nowrap transition-all duration-200 ${isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {formatLastUpdated(lastUpdated)}
          </span>

          {/* Search Component */}
          <div className="relative">
            {!isSearchExpanded ? (
              /* Collapsed Search Button */
              <button
                onClick={handleSearchToggle}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-label="Open search"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            ) : (
              /* Expanded Search Input */
              <div className="relative w-full max-w-md">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-full pl-4 pr-10 py-2 shadow-sm text-sm text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-accent-blue focus:border-blue-500 dark:focus:border-dark-accent-blue transition-colors duration-200"
                  placeholder="Search widgets, data..."
                  autoFocus
                />
                <button
                  onClick={handleSearchClear}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-title mb-4 text-gray-900 dark:text-dark-text-primary transition-colors duration-300">Health Dashboard</h1>
          <p className="text-body text-gray-700 dark:text-dark-text-muted mb-8 transition-colors duration-300">
            Welcome to your health dashboard with automatic dark mode that activates at 6 PM.
          </p>

          {/* Health & Activity Widgets */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mb-8">
            {/* Steps Widget */}
            <div className="bg-widget-1 dark:bg-widget-1-dark p-6 rounded-xl shadow-sm">
              <h3 className="text-widget-title mb-3 text-gray-900 dark:text-gray-100">Steps Today</h3>
              <p className="text-metric text-blue-600 dark:text-blue-400">8,547</p>
              <p className="text-label text-gray-500 dark:text-gray-400">steps today</p>
            </div>

            {/* Water Intake Widget */}
            <div className="bg-widget-2 dark:bg-widget-2-dark p-6 rounded-xl shadow-sm">
              <h3 className="text-widget-title mb-3 text-gray-900 dark:text-gray-100">Water Intake</h3>
              <p className="text-metric text-blue-600 dark:text-blue-400">6.2L</p>
              <p className="text-label text-gray-500 dark:text-gray-400">of 8L goal</p>
            </div>
          </div>

          {/* CPAP Monitoring Widgets - Issue #7 */}
          <div className="mb-8">
            <h2 className="text-subtitle mb-6 text-gray-900 dark:text-gray-100">CPAP Monitoring</h2>

            {/* Debug Info & WebSocket Status */}
            <div className="mb-4 space-y-4">
              {/* Debug Info */}
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  🔍 Debug: Environment: {apiConfig.isProduction ? 'Production' : 'Development'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  📡 CPAP widgets fetch from: {apiConfig.baseUrl}/cpap/*
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={async () => {
                      console.log('🧪 Testing backend connection...')
                      try {
                        const response = await fetch(getCpapApiUrl('health'))
                        const data = await response.json()
                        console.log('🧪 Backend test successful:', data)
                        alert('Backend connection successful! Check console for details.')
                      } catch (err) {
                        console.error('🧪 Backend test failed:', err)
                        alert('Backend connection failed! Check console for details.')
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    🧪 Test Backend Connection
                  </button>
                  <button
                    onClick={() => manualRefresh('cpap')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={refreshingWidgets.length > 0}
                  >
                    🔄 Manual Refresh CPAP
                  </button>
                </div>
              </div>

              {/* WebSocket Status Component */}
              <WebSocketStatus
                showDetails={true}
                showControls={true}
                className="w-full"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {/* SpO2 Daily Trend Widget */}
              <div className="lg:col-span-2">
                <CpapSpo2TrendWidget />
              </div>

              {/* SpO2 + Pulse Rate Dual-Axis Widget */}
              <div className="lg:col-span-2">
                <CpapSpo2PulseWidget />
              </div>

              {/* Leak Rate Monitoring Widget */}
              <CpapLeakRateWidget />

              {/* Sleep Session Start Time Widget */}
              <CpapSleepSessionWidget />
            </div>
          </div>

          {/* Workout Widgets Section - Issue #9 */}
          <div className="mt-12">
            <h2 className="text-subtitle mb-6 text-gray-900 dark:text-dark-text-primary transition-colors duration-300">
              💪 Workout Analysis
            </h2>
            <p className="text-body text-gray-700 dark:text-dark-text-muted mb-8 transition-colors duration-300">
              Heart rate workout sessions with zone analysis and training insights.
            </p>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {/* Workout Summary Widget */}
              <WorkoutSummaryWidget />

              {/* Heart Rate Widget */}
              <WorkoutHeartRateWidget />

              {/* Calories Burned Widget */}
              <WorkoutCaloriesWidget />

              {/* Fat Burn vs Cardio Ratio Widget */}
              <WorkoutFatBurnRatioWidget />

              {/* Heart Rate Over Time Widget */}
              <div className="lg:col-span-2">
                <WorkoutHeartRateTimeWidget />
              </div>

              {/* Heart Rate Zones Widget */}
              <div className="lg:col-span-2">
                <WorkoutZonesWidget />
              </div>
            </div>
          </div>

          {/* Advanced Analytics Widgets Section - Issue #9 Phase 3 - Temporarily disabled */}
          {/*
          <div className="mt-12">
            <h2 className="text-subtitle mb-6 text-gray-900 dark:text-dark-text-primary transition-colors duration-300">
              🔬 Advanced Analytics
            </h2>
            <p className="text-body text-gray-700 dark:text-dark-text-muted mb-8 transition-colors duration-300">
              Advanced training metrics, recovery analysis, and performance optimization insights.
            </p>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <WorkoutRecoveryWidget />
              <WorkoutIntensityWidget />
              <WorkoutVariabilityWidget />
              <WorkoutOvertrainingWidget />

              <div className="lg:col-span-2">
                <WorkoutTrainingLoadWidget />
              </div>

              <div className="lg:col-span-2">
                <WorkoutWeeklyZonesWidget />
              </div>

              <WorkoutLoadRecoveryWidget />
              <WorkoutWarmupWidget />
            </div>
          </div>
          */}

          {/* Additional Content for More Scrolling */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <h2 className="text-subtitle mb-6 text-gray-900 dark:text-dark-text-primary transition-colors duration-300">Weekly Summary</h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div className="bg-white dark:bg-dark-card p-6 rounded-widget shadow-widget transition-colors duration-300">
                <h3 className="text-widget-title mb-4 text-gray-900 dark:text-dark-text-primary transition-colors duration-300">Activity Trends</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600 dark:text-dark-text-muted transition-colors duration-300">Average Steps</span>
                    <span className="text-label font-medium text-gray-900 dark:text-dark-text-primary transition-colors duration-300">8,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600 dark:text-dark-text-muted transition-colors duration-300">Active Days</span>
                    <span className="text-label font-medium text-gray-900 dark:text-dark-text-primary transition-colors duration-300">6/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600 dark:text-dark-text-muted transition-colors duration-300">Workout Sessions</span>
                    <span className="text-label font-medium text-gray-900 dark:text-dark-text-primary transition-colors duration-300">4</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-card p-6 rounded-widget shadow-widget transition-colors duration-300">
                <h3 className="text-widget-title mb-4 text-gray-900 dark:text-dark-text-primary transition-colors duration-300">Health Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600 dark:text-dark-text-muted transition-colors duration-300">Avg Heart Rate</span>
                    <span className="text-label font-medium text-gray-900 dark:text-dark-text-primary transition-colors duration-300">68 BPM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600 dark:text-dark-text-muted transition-colors duration-300">Sleep Quality</span>
                    <span className="text-label font-medium text-gray-900 dark:text-dark-text-primary transition-colors duration-300">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600 dark:text-dark-text-muted transition-colors duration-300">Hydration Goal</span>
                    <span className="text-label font-medium text-gray-900 dark:text-dark-text-primary transition-colors duration-300">6/7 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </ApolloProvider>
  )
}

export default App
