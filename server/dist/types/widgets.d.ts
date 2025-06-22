/**
 * Widget Data Types - Issue #5
 *
 * TypeScript interfaces matching GraphQL schema for type safety
 */
export interface TimeRange {
    start: Date;
    end: Date;
}
export interface IntRange {
    min: number;
    max: number;
}
export interface StepData {
    id: string;
    date: Date;
    steps: number;
    goal: number;
    distance?: number;
    calories?: number;
}
export interface StepsHistory {
    current: StepData;
    history: StepData[];
    weeklyAverage: number;
    monthlyTotal: number;
}
export interface WaterIntakeEntry {
    id: string;
    timestamp: Date;
    amount: number;
    unit: string;
}
export interface WaterIntakeData {
    date: Date;
    entries: WaterIntakeEntry[];
    totalAmount: number;
    goal: number;
    percentage: number;
}
export interface WeightEntry {
    id: string;
    date: Date;
    weight: number;
    unit: string;
    bodyFat?: number;
    muscleMass?: number;
}
export interface WeightHistory {
    current: WeightEntry;
    history: WeightEntry[];
    trend: 'increasing' | 'decreasing' | 'stable';
    weeklyChange: number;
    monthlyChange: number;
}
export interface HeartRateReading {
    id: string;
    timestamp: Date;
    bpm: number;
    type: 'resting' | 'active' | 'recovery';
}
export interface HeartRateZones {
    zone1: IntRange;
    zone2: IntRange;
    zone3: IntRange;
    zone4: IntRange;
    zone5: IntRange;
}
export interface HeartRateData {
    current: HeartRateReading;
    resting: number;
    maximum: number;
    zones: HeartRateZones;
    history: HeartRateReading[];
}
export interface NutritionEntry {
    id: string;
    timestamp: Date;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
}
export interface NutritionGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}
export interface NutritionData {
    date: Date;
    entries: NutritionEntry[];
    totals: NutritionEntry;
    goals: NutritionGoals;
    score: number;
}
export interface SleepData {
    id: string;
    date: Date;
    bedtime: Date;
    wakeTime: Date;
    duration: number;
    quality: number;
    deepSleep?: number;
    remSleep?: number;
    lightSleep?: number;
}
export interface SleepHistory {
    current: SleepData;
    history: SleepData[];
    averageDuration: number;
    averageQuality: number;
    weeklyPattern: number[];
}
export interface WorkoutSession {
    id: string;
    type: string;
    duration: number;
    intensity: 'low' | 'moderate' | 'high';
    caloriesBurned: number;
    startTime: Date;
}
export interface ActivityData {
    id: string;
    date: Date;
    activeMinutes: number;
    sedentaryMinutes: number;
    workouts: WorkoutSession[];
    caloriesBurned: number;
}
export interface WidgetRegistryEntry {
    widgetType: string;
    datasetName: string;
    lastUpdated?: Date;
    isActive: boolean;
}
export interface WidgetUpdate {
    widgetType: string;
    data: any;
    timestamp: Date;
}
export interface DatasetRefresh {
    datasetName: string;
    affectedWidgets: string[];
    timestamp: Date;
}
export interface WebhookEvent {
    source: string;
    payload: any;
    timestamp: Date;
}
//# sourceMappingURL=widgets.d.ts.map