/**
 * API Configuration Utility
 * Provides the correct API base URL for different environments
 */

// Get the API base URL based on environment
export const getApiBaseUrl = (): string => {
  // In production, use the dedicated API subdomain
  if (import.meta.env.PROD) {
    return 'http://api.dashboard.home/api'
  }

  // In development, use localhost
  return 'http://localhost:4000/api'
}

// Get the full CPAP API URL for a specific endpoint
export const getCpapApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/cpap/${endpoint}`
}

// Get the full Workout API URL - Issue #9
export const getWorkoutApiUrl = (): string => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/workouts`
}

// Export for debugging
export const apiConfig = {
  baseUrl: getApiBaseUrl(),
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV
}
