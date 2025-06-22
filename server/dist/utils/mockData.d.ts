/**
 * Mock Data Generators - Issue #5
 *
 * Generate realistic mock data for all widget types during development
 */
export declare const generateStepsData: (_timeRange?: any) => {
    current: {
        id: string;
        date: Date;
        steps: number;
        goal: number;
        distance: number;
        calories: number;
    };
    history: {
        id: string;
        date: Date;
        steps: number;
        goal: number;
        distance: number;
        calories: number;
    }[];
    weeklyAverage: number;
    monthlyTotal: number;
};
export declare const generateWaterIntakeData: (date?: Date) => {
    date: Date;
    entries: {
        id: string;
        timestamp: Date;
        amount: number;
        unit: string;
    }[];
    totalAmount: number;
    goal: number;
    percentage: number;
};
export declare const generateWeightData: (_timeRange?: any) => {
    current: {
        id: string;
        date: Date;
        weight: number;
        unit: string;
        bodyFat: number;
        muscleMass: number;
    };
    history: {
        id: string;
        date: Date;
        weight: number;
        unit: string;
        bodyFat: number;
        muscleMass: number;
    }[];
    trend: string;
    weeklyChange: number;
    monthlyChange: number;
};
export declare const generateHeartRateData: (_timeRange?: any) => {
    current: {
        id: string;
        timestamp: Date;
        bpm: number;
        type: string;
    };
    resting: number;
    maximum: number;
    zones: {
        zone1: {
            min: number;
            max: number;
        };
        zone2: {
            min: number;
            max: number;
        };
        zone3: {
            min: number;
            max: number;
        };
        zone4: {
            min: number;
            max: number;
        };
        zone5: {
            min: number;
            max: number;
        };
    };
    history: {
        id: string;
        timestamp: Date;
        bpm: number;
        type: string;
    }[];
};
export declare const generateNutritionData: (date?: Date) => {
    date: Date;
    entries: {
        id: string;
        timestamp: Date;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        sugar: number;
    }[];
    totals: {
        id: string;
        timestamp: Date;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        sugar: number;
    };
    goals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    score: number;
};
export declare const generateSleepData: (_timeRange?: any) => {
    current: {
        id: string;
        date: Date;
        bedtime: Date;
        wakeTime: Date;
        duration: number;
        quality: number;
        deepSleep: number;
        remSleep: number;
        lightSleep: number;
    };
    history: {
        id: string;
        date: Date;
        bedtime: Date;
        wakeTime: Date;
        duration: number;
        quality: number;
        deepSleep: number;
        remSleep: number;
        lightSleep: number;
    }[];
    averageDuration: number;
    averageQuality: number;
    weeklyPattern: number[];
};
export declare const generateActivityData: (date?: Date) => {
    id: string;
    date: Date;
    activeMinutes: number;
    sedentaryMinutes: number;
    workouts: {
        id: string;
        type: string;
        duration: number;
        intensity: string;
        caloriesBurned: number;
        startTime: Date;
    }[];
    caloriesBurned: number;
};
//# sourceMappingURL=mockData.d.ts.map