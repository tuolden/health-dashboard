/**
 * Mock Data Generators - Issue #5
 *
 * Generate realistic mock data for all widget types during development
 */
import { StepsHistory, WaterIntakeData, WeightHistory, HeartRateData, NutritionData, SleepHistory, ActivityData, TimeRange } from '../types/widgets';
export declare const generateStepsData: (timeRange?: TimeRange) => StepsHistory;
export declare const generateWaterIntakeData: (date?: Date) => WaterIntakeData;
export declare const generateWeightData: (timeRange?: TimeRange) => WeightHistory;
export declare const generateHeartRateData: (timeRange?: TimeRange) => HeartRateData;
export declare const generateNutritionData: (date?: Date) => NutritionData;
export declare const generateSleepData: (timeRange?: TimeRange) => SleepHistory;
export declare const generateActivityData: (date?: Date) => ActivityData;
//# sourceMappingURL=mockData.d.ts.map