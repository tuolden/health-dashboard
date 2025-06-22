import { BaseWidgetData } from '../types/widget'

// Helper function to generate random numbers within a range
const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to generate dates for the past N days
const getPastDates = (days: number): Date[] => {
  const dates: Date[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date)
  }
  return dates
}

// Steps Widget Mock Data
export interface StepsData extends BaseWidgetData {
  steps: number
  goal: number
  distance: number // in km
  calories: number
}

export const generateMockStepsData = async (): Promise<StepsData> => {
  await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API delay
  
  return {
    id: 'steps-today',
    timestamp: new Date(),
    steps: randomBetween(5000, 12000),
    goal: 10000,
    distance: randomBetween(3, 8),
    calories: randomBetween(200, 500),
    source: 'fitness-tracker'
  }
}

// Water Intake Widget Mock Data
export interface WaterData extends BaseWidgetData {
  intake: number // in liters
  goal: number // in liters
  lastDrink: Date
}

export const generateMockWaterData = async (): Promise<WaterData> => {
  await new Promise(resolve => setTimeout(resolve, 80))
  
  return {
    id: 'water-intake',
    timestamp: new Date(),
    intake: Math.round((randomBetween(8, 25) / 10) * 10) / 10, // 0.8 to 2.5L
    goal: 2.5,
    lastDrink: new Date(Date.now() - randomBetween(30, 180) * 60000), // 30min to 3h ago
    source: 'manual-entry'
  }
}

// Calories Widget Mock Data
export interface CaloriesData extends BaseWidgetData {
  calories: number
  goal: number
  macros: {
    protein: number // grams
    carbs: number   // grams
    fat: number     // grams
  }
  meals: {
    breakfast: number
    lunch: number
    dinner: number
    snacks: number
  }
}

export const generateMockCaloriesData = async (): Promise<CaloriesData> => {
  await new Promise(resolve => setTimeout(resolve, 120))
  
  const calories = randomBetween(1200, 2500)
  
  return {
    id: 'calories-macros',
    timestamp: new Date(),
    calories,
    goal: 2200,
    macros: {
      protein: randomBetween(80, 150),
      carbs: randomBetween(150, 300),
      fat: randomBetween(50, 100)
    },
    meals: {
      breakfast: Math.floor(calories * 0.25),
      lunch: Math.floor(calories * 0.35),
      dinner: Math.floor(calories * 0.30),
      snacks: Math.floor(calories * 0.10)
    },
    source: 'nutrition-app'
  }
}

// Heart Rate Widget Mock Data
export interface HeartRateData extends BaseWidgetData {
  current: number // BPM
  resting: number // BPM
  max: number     // BPM
  zone: 'resting' | 'fat-burn' | 'cardio' | 'peak'
  trend: 'up' | 'down' | 'stable'
}

export const generateMockHeartRateData = async (): Promise<HeartRateData> => {
  await new Promise(resolve => setTimeout(resolve, 60))
  
  const resting = randomBetween(60, 80)
  const current = randomBetween(resting, resting + 40)
  
  let zone: HeartRateData['zone'] = 'resting'
  if (current > resting + 20) zone = 'cardio'
  else if (current > resting + 10) zone = 'fat-burn'
  
  return {
    id: 'heart-rate',
    timestamp: new Date(),
    current,
    resting,
    max: randomBetween(180, 200),
    zone,
    trend: ['up', 'down', 'stable'][randomBetween(0, 2)] as HeartRateData['trend'],
    source: 'wearable-device'
  }
}

// Weight History Widget Mock Data
export interface WeightData extends BaseWidgetData {
  current: number // kg
  goal: number    // kg
  history: Array<{
    date: Date
    weight: number
  }>
  trend: 'up' | 'down' | 'stable'
  change7d: number // kg change over 7 days
}

export const generateMockWeightData = async (): Promise<WeightData> => {
  await new Promise(resolve => setTimeout(resolve, 150))
  
  const baseWeight = randomBetween(60, 90)
  const dates = getPastDates(7)
  
  const history = dates.map((date, index) => ({
    date,
    weight: baseWeight + (Math.random() - 0.5) * 2 // ±1kg variation
  }))
  
  const current = history[history.length - 1].weight
  const weekAgo = history[0].weight
  const change7d = Math.round((current - weekAgo) * 10) / 10
  
  let trend: WeightData['trend'] = 'stable'
  if (change7d > 0.2) trend = 'up'
  else if (change7d < -0.2) trend = 'down'
  
  return {
    id: 'weight-history',
    timestamp: new Date(),
    current: Math.round(current * 10) / 10,
    goal: randomBetween(65, 75),
    history,
    trend,
    change7d,
    source: 'smart-scale'
  }
}

// Workout Activity Mock Data (for future use)
export interface WorkoutData extends BaseWidgetData {
  type: string
  duration: number // minutes
  calories: number
  intensity: 'low' | 'medium' | 'high'
  exercises: Array<{
    name: string
    sets: number
    reps: number
    weight?: number
  }>
}

export const generateMockWorkoutData = async (): Promise<WorkoutData> => {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const workoutTypes = ['Strength Training', 'Cardio', 'Yoga', 'Running', 'Cycling']
  const exercises = [
    { name: 'Push-ups', sets: 3, reps: 15 },
    { name: 'Squats', sets: 3, reps: 20 },
    { name: 'Plank', sets: 3, reps: 60 },
    { name: 'Lunges', sets: 3, reps: 12 }
  ]
  
  return {
    id: 'workout-activity',
    timestamp: new Date(),
    type: workoutTypes[randomBetween(0, workoutTypes.length - 1)],
    duration: randomBetween(20, 90),
    calories: randomBetween(150, 600),
    intensity: ['low', 'medium', 'high'][randomBetween(0, 2)] as WorkoutData['intensity'],
    exercises: exercises.slice(0, randomBetween(2, 4)),
    source: 'workout-app'
  }
}
