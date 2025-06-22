import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

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
    <div className="min-h-screen bg-app-background">
      {/* Sticky Header - Issue #3 Implementation */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-12 px-6 bg-white shadow-sm flex items-center justify-between"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}
      >
        {/* Left Section: Logo + Navigation */}
        <div className="flex items-center gap-x-8">
          {/* Logo Placeholder */}
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-label="Health Dashboard Logo"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>

          {/* Navigation Links */}
          <nav className="flex gap-x-6 text-base font-medium text-gray-900">
            <a href="/dashboard" className="hover:text-blue-600 transition-colors duration-200">
              Dashboard
            </a>
            <a href="/vitals" className="hover:text-blue-600 transition-colors duration-200">
              Vitals
            </a>
          </nav>
        </div>

        {/* Right Section: Last Updated + Search */}
        <div className="flex items-center gap-x-4">
          {/* Last Updated Timestamp - Super Light and Small */}
          <span className={`text-xs font-light text-gray-400 whitespace-nowrap transition-opacity duration-200 ${isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {formatLastUpdated(lastUpdated)}
          </span>

          {/* Search Component */}
          <div className="relative">
            {!isSearchExpanded ? (
              /* Collapsed Search Button */
              <button
                onClick={handleSearchToggle}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                aria-label="Open search"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full bg-white border border-gray-300 rounded-full pl-4 pr-10 py-2 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search widgets, data..."
                  autoFocus
                />
                <button
                  onClick={handleSearchClear}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
          <h1 className="text-title mb-4 text-gray-900">Health Dashboard</h1>
          <p className="text-body text-gray-700 mb-8">
            Welcome to your health dashboard with sticky header functionality.
          </p>

          {/* Sample Widgets Grid - Multiple Rows for Scroll Testing */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Row 1 */}
            <div className="bg-widget-default p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Steps</h3>
              <p className="text-metric text-blue-600">8,547</p>
              <p className="text-label text-gray-500">steps today</p>
            </div>

            <div className="bg-widget-green p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Water Intake</h3>
              <p className="text-metric text-gray-900">6.2L</p>
              <p className="text-label text-gray-500">of 8L goal</p>
            </div>

            <div className="bg-widget-purple p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Heart Rate</h3>
              <p className="text-metric text-red-500">72 BPM</p>
              <p className="text-label text-gray-500">resting</p>
            </div>

            {/* Row 2 */}
            <div className="bg-widget-yellow p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Calories</h3>
              <p className="text-metric text-orange-600">1,847</p>
              <p className="text-label text-gray-500">of 2,200 goal</p>
            </div>

            <div className="bg-widget-grey p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Sleep</h3>
              <p className="text-metric text-indigo-600">7h 23m</p>
              <p className="text-label text-gray-500">last night</p>
            </div>

            <div className="bg-widget-light-purple p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Weight</h3>
              <p className="text-metric text-purple-600">68.2 kg</p>
              <p className="text-label text-gray-500">-0.3kg this week</p>
            </div>

            {/* Row 3 */}
            <div className="bg-widget-dark-blue p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Blood Pressure</h3>
              <p className="text-metric text-blue-700">120/80</p>
              <p className="text-label text-gray-500">mmHg</p>
            </div>

            <div className="bg-widget-pink p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Workouts</h3>
              <p className="text-metric text-pink-600">3</p>
              <p className="text-label text-gray-500">this week</p>
            </div>

            <div className="bg-widget-default p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Meditation</h3>
              <p className="text-metric text-green-600">15 min</p>
              <p className="text-label text-gray-500">today</p>
            </div>

            {/* Row 4 */}
            <div className="bg-widget-green p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Nutrition Score</h3>
              <p className="text-metric text-green-700">85%</p>
              <p className="text-label text-gray-500">excellent</p>
            </div>

            <div className="bg-widget-yellow p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Active Minutes</h3>
              <p className="text-metric text-yellow-600">127</p>
              <p className="text-label text-gray-500">minutes today</p>
            </div>

            <div className="bg-widget-purple p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Stress Level</h3>
              <p className="text-metric text-purple-500">Low</p>
              <p className="text-label text-gray-500">based on HRV</p>
            </div>

            {/* Row 5 */}
            <div className="bg-widget-dark-blue p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">VO2 Max</h3>
              <p className="text-metric text-blue-600">42.1</p>
              <p className="text-label text-gray-500">ml/kg/min</p>
            </div>

            <div className="bg-widget-pink p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Body Fat</h3>
              <p className="text-metric text-pink-500">18.5%</p>
              <p className="text-label text-gray-500">healthy range</p>
            </div>

            <div className="bg-widget-light-purple p-6 rounded-widget shadow-widget">
              <h3 className="text-widget-title mb-3 text-gray-900">Recovery</h3>
              <p className="text-metric text-purple-400">Good</p>
              <p className="text-label text-gray-500">ready to train</p>
            </div>
          </div>

          {/* Additional Content for More Scrolling */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-subtitle mb-6 text-gray-900">Weekly Summary</h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div className="bg-white p-6 rounded-widget shadow-widget">
                <h3 className="text-widget-title mb-4 text-gray-900">Activity Trends</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600">Average Steps</span>
                    <span className="text-label font-medium text-gray-900">8,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600">Active Days</span>
                    <span className="text-label font-medium text-gray-900">6/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600">Workout Sessions</span>
                    <span className="text-label font-medium text-gray-900">4</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-widget shadow-widget">
                <h3 className="text-widget-title mb-4 text-gray-900">Health Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600">Avg Heart Rate</span>
                    <span className="text-label font-medium text-gray-900">68 BPM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600">Sleep Quality</span>
                    <span className="text-label font-medium text-gray-900">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label text-gray-600">Hydration Goal</span>
                    <span className="text-label font-medium text-gray-900">6/7 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
