import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'

interface StickyHeaderProps {
  lastUpdated?: Date | null
  onSearch?: (query: string) => void
}

/**
 * StickyHeader Component - Issue #3
 * Sticky top header with logo, navigation, last updated timestamp, and expandable search
 */
const StickyHeader: React.FC<StickyHeaderProps> = ({
  lastUpdated,
  onSearch
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()

  // Format last updated time for display
  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never updated'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Last updated just now'
    if (diffMins < 60) return `Last updated ${diffMins} min ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Last updated ${diffHours}h ago`
    
    return `Last updated ${date.toLocaleDateString()}`
  }

  // Handle search expansion
  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded)
    if (isSearchExpanded) {
      setSearchQuery('')
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery('')
    setIsSearchExpanded(false)
    onSearch?.('')
  }

  return (
    <header className="sticky top-0 z-50 h-16 px-6 bg-white shadow-sm flex items-center justify-between">
      {/* Left Section: Logo + Navigation */}
      <div className={`flex items-center gap-x-8 transition-opacity duration-200 ${isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Logo Placeholder */}
        <div className="flex-shrink-0">
          <svg 
            className="w-8 h-8 text-gray-400" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            aria-label="Health Dashboard Logo"
          >
            {/* Health/Medical Cross Icon Placeholder */}
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>

        {/* Navigation Links */}
        <nav className="flex gap-x-6 text-base font-medium" style={{ color: '#101316' }}>
          <Link
            to="/"
            className={`hover:text-primary transition-colors duration-200 ${
              location.pathname === '/' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/custom-dashboards"
            className={`hover:text-primary transition-colors duration-200 ${
              location.pathname.startsWith('/custom-dashboards') ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Custom Dashboards
          </Link>
        </nav>
      </div>

      {/* Right Section: Last Updated + Search */}
      <div className="flex items-center gap-x-4">
        {/* Last Updated Timestamp */}
        <span className={`text-sm text-gray-500 whitespace-nowrap transition-opacity duration-200 ${isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
              <Icon name="search" className="w-4 h-4 text-gray-600" />
            </button>
          ) : (
            /* Expanded Search Input */
            <div className="relative w-full max-w-md">
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-white border border-gray-300 rounded-full pl-4 pr-10 py-2 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Search widgets, data..."
                autoFocus
              />
              <button
                onClick={handleSearchClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Clear search"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default StickyHeader
