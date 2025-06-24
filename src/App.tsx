import React, { useEffect } from 'react'
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from './graphql/client'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  useEffect(() => {
    console.log('🚀 [App] Component mounted')
    console.log('🎨 [App] Checking dark mode status...')

    // Check if dark class is on html element
    const htmlElement = document.documentElement
    const hasDarkClass = htmlElement.classList.contains('dark')
    console.log('🎨 [App] HTML element has dark class:', hasDarkClass)
    console.log('🎨 [App] HTML element classes:', htmlElement.className)

    // Check computed styles
    const bodyStyles = window.getComputedStyle(document.body)
    console.log('🎨 [App] Body background color:', bodyStyles.backgroundColor)
    console.log('🎨 [App] Body color:', bodyStyles.color)

    // Check Tailwind config
    console.log('🎨 [App] Checking for any dark mode triggers...')

    // Force remove dark class if present
    if (hasDarkClass) {
      console.log('🎨 [App] REMOVING dark class from HTML element')
      htmlElement.classList.remove('dark')
    }

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    console.log('🎨 [App] System prefers dark mode:', prefersDark)

    // Check all stylesheets for dark mode rules
    console.log('🎨 [App] Checking stylesheets for dark mode rules...')
    Array.from(document.styleSheets).forEach((sheet, index) => {
      try {
        const rules = Array.from(sheet.cssRules || [])
        const darkRules = rules.filter(rule =>
          rule.cssText && (
            rule.cssText.includes('.dark') ||
            rule.cssText.includes('prefers-color-scheme: dark') ||
            rule.cssText.includes('dark-background') ||
            rule.cssText.includes('dark-card')
          )
        )
        if (darkRules.length > 0) {
          console.log(`🎨 [App] Found ${darkRules.length} dark mode rules in stylesheet ${index}:`, darkRules.map(r => r.cssText.substring(0, 100)))
        }
      } catch (e) {
        console.log(`🎨 [App] Could not access stylesheet ${index}:`, e instanceof Error ? e.message : String(e))
      }
    })

    // Check CSS custom properties
    console.log('🎨 [App] Checking CSS custom properties...')
    const rootStyles = window.getComputedStyle(document.documentElement)
    console.log('🎨 [App] CSS custom properties:', {
      '--app-background': rootStyles.getPropertyValue('--app-background'),
      '--font-primary': rootStyles.getPropertyValue('--font-primary'),
      '--dark-background': rootStyles.getPropertyValue('--dark-background'),
      '--dark-card': rootStyles.getPropertyValue('--dark-card')
    })

    // Force light mode styles
    console.log('🎨 [App] Forcing light mode styles...')
    document.body.style.backgroundColor = '#F4F6FA'
    document.body.style.color = '#101316'

    // Also force on html element
    htmlElement.style.backgroundColor = '#F4F6FA'
    htmlElement.style.color = '#101316'

  }, [])

  return (
    <ApolloProvider client={apolloClient}>
      <Dashboard />
    </ApolloProvider>
  )
}

export default App
