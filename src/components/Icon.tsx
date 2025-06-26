import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faWater,
  faPersonWalking,
  faHeart,
  faWeight,
  faUtensils,
  faClock,
  faRefresh,
  faExclamationTriangle,
  faExclamationCircle,
  faMapPin,
  faBullseye,
  faFire,
  faDroplet,
  faHeartPulse,
  faChartLine,
  faPlus,
  faMinus,
  faCheck,
  faTimes,
  faInfo,
  faWarning,
  faGear,
  faEye,
  faEyeSlash,
  faGrip,
  faSearch,
  faArrowUp,
  faArrowDown,
  faCalendar,
  faPercent,
  faDumbbell,
  faBalanceScale,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons'

// Icon mapping for easy usage throughout the app
export const iconMap = {
  // Health & Fitness Icons
  water: faWater,
  droplet: faDroplet,
  steps: faPersonWalking,
  walking: faPersonWalking,
  heart: faHeart,
  heartRate: faHeartPulse,
  weight: faWeight,
  calories: faUtensils,
  fire: faFire,
  chart: faChartLine,
  
  // UI Icons
  clock: faClock,
  refresh: faRefresh,
  alert: faExclamationTriangle,
  error: faExclamationCircle,
  warning: faWarning,
  info: faInfo,
  location: faMapPin,
  target: faBullseye,
  
  // Action Icons
  plus: faPlus,
  minus: faMinus,
  check: faCheck,
  close: faTimes,
  settings: faGear,
  
  // Developer Icons
  eye: faEye,
  eyeSlash: faEyeSlash,
  grid: faGrip,
  search: faSearch,

  // Trend Icons
  'trending-up': faArrowUp,
  'trending-down': faArrowDown,

  // Additional Icons
  calendar: faCalendar,
  percentage: faPercent,
  muscle: faDumbbell,
  'weight-scale': faBalanceScale,
} as const

export type IconName = keyof typeof iconMap

interface IconProps {
  name: IconName
  className?: string
  size?: 'xs' | 'sm' | 'lg' | 'xl' | '2xl'
  color?: string
  spin?: boolean
  pulse?: boolean
}

/**
 * Icon Component - Standardized Font Awesome SVG icons for the design system
 * Usage: <Icon name="water" className="w-4 h-4 text-blue-500" />
 */
const Icon: React.FC<IconProps> = ({ 
  name, 
  className = '', 
  size,
  color,
  spin = false,
  pulse = false 
}) => {
  const iconDefinition = iconMap[name]
  
  if (!iconDefinition) {
    console.warn(`Icon "${name}" not found in iconMap`)
    return null
  }

  return (
    <FontAwesomeIcon
      icon={iconDefinition}
      className={className}
      size={size}
      color={color}
      spin={spin}
      pulse={pulse}
    />
  )
}

export default Icon

// Export individual icons for direct use if needed
export {
  faWater,
  faPersonWalking,
  faHeart,
  faWeight,
  faUtensils,
  faClock,
  faRefresh,
  faExclamationTriangle,
  faExclamationCircle,
  faMapPin,
  faBullseye,
  faFire,
  faDroplet,
  faHeartPulse,
  faChartLine
}
