/**
 * Dark Mode Testing Utilities - Issue #4
 *
 * DISABLED: Utilities to test and simulate dark mode behavior
 * These utilities have been disabled to prevent automatic dark mode activation
 */

/*
// Test if dark mode should be active at a given time
export const shouldUseDarkModeAtTime = (hours: number): boolean => {
  return hours >= 18 || hours < 6
}

// Simulate dark mode for testing
export const simulateDarkMode = (enable: boolean) => {
  const htmlElement = document.documentElement

  if (enable) {
    htmlElement.classList.add('dark')
    console.log('🌙 Dark mode simulated - ON')
  } else {
    htmlElement.classList.remove('dark')
    console.log('☀️ Dark mode simulated - OFF')
  }
}

// Test different times
export const testTimeBasedTheme = () => {
  console.log('🧪 Testing Time-Based Dark Mode:')

  const testTimes = [
    { hour: 6, label: '6:00 AM (Light)' },
    { hour: 12, label: '12:00 PM (Light)' },
    { hour: 17, label: '5:00 PM (Light)' },
    { hour: 18, label: '6:00 PM (Dark)' },
    { hour: 22, label: '10:00 PM (Dark)' },
    { hour: 2, label: '2:00 AM (Dark)' },
    { hour: 5, label: '5:00 AM (Dark)' }
  ]

  testTimes.forEach(({ hour, label }) => {
    const shouldBeDark = shouldUseDarkModeAtTime(hour)
    console.log(`${label}: ${shouldBeDark ? '🌙 Dark' : '☀️ Light'}`)
  })
}
*/

// Add to window for browser console testing
// DISABLED: Dark mode test utilities to prevent automatic dark mode activation
/*
if (typeof window !== 'undefined') {
  (window as any).darkModeTest = {
    simulate: simulateDarkMode,
    test: testTimeBasedTheme,
    shouldUseDarkModeAtTime
  }

  console.log('🔧 Dark mode test utilities available:')
  console.log('- darkModeTest.simulate(true/false) - Toggle dark mode')
  console.log('- darkModeTest.test() - Show time-based behavior')
  console.log('- darkModeTest.shouldUseDarkModeAtTime(hour) - Test specific hour')
}
*/
