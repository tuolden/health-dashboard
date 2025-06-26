import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from './graphql/client'
import Dashboard from './components/Dashboard'
import CustomDashboardList from './components/CustomDashboardList'
import CustomDashboardBuilder from './components/CustomDashboardBuilder'
import './App.css'

function App() {
  useEffect(() => {
    console.log('🚀 [App] Component mounted')
    console.log('🎨 [App] FORCE DISABLING DARK MODE...')

    const htmlElement = document.documentElement

    // Aggressive dark mode removal function
    const forceLightMode = () => {
      // Remove dark class if present
      if (htmlElement.classList.contains('dark')) {
        console.log('🎨 [App] REMOVING dark class from HTML element')
        htmlElement.classList.remove('dark')
      }

      // Force light mode styles
      document.body.style.backgroundColor = '#F4F6FA'
      document.body.style.color = '#101316'
      htmlElement.style.backgroundColor = '#F4F6FA'
      htmlElement.style.color = '#101316'
    }

    // Run immediately
    forceLightMode()

    // Set up a mutation observer to watch for dark class being added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (htmlElement.classList.contains('dark')) {
            console.log('🎨 [App] Dark class detected and REMOVED by observer')
            htmlElement.classList.remove('dark')
            forceLightMode()
          }
        }
      })
    })

    // Start observing
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Also set up an interval to check every second
    const interval = setInterval(() => {
      if (htmlElement.classList.contains('dark')) {
        console.log('🎨 [App] Dark class detected and REMOVED by interval')
        forceLightMode()
      }
    }, 1000)

    // Cleanup
    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return (
    <ApolloProvider client={apolloClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/custom-dashboards" element={<CustomDashboardList />} />
            <Route path="/custom-dashboards/:id" element={<CustomDashboardBuilder />} />
          </Routes>
        </div>
      </Router>
    </ApolloProvider>
  )
}

export default App
