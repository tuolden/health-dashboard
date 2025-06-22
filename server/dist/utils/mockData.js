"use strict";
/**
 * Mock Data Generators - Issue #5
 *
 * Generate realistic mock data for all widget types during development
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateActivityData = exports.generateSleepData = exports.generateNutritionData = exports.generateHeartRateData = exports.generateWeightData = exports.generateWaterIntakeData = exports.generateStepsData = void 0;
const uuid_1 = require("uuid");
// Helper function to generate dates
const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};
const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
const getRandomFloat = (min, max, decimals = 1) => {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};
// Steps Mock Data
const generateStepsData = (timeRange) => {
    const today = new Date();
    const currentSteps = getRandomInt(6000, 12000);
    const goal = 10000;
    const history = Array.from({ length: 30 }, (_, i) => ({
        id: (0, uuid_1.v4)(),
        date: getDateDaysAgo(i),
        steps: getRandomInt(4000, 15000),
        goal,
        distance: getRandomFloat(3, 12, 2),
        calories: getRandomInt(200, 800)
    }));
    const weeklyAverage = history.slice(0, 7).reduce((sum, day) => sum + day.steps, 0) / 7;
    const monthlyTotal = history.reduce((sum, day) => sum + day.steps, 0);
    return {
        current: {
            id: (0, uuid_1.v4)(),
            date: today,
            steps: currentSteps,
            goal,
            distance: getRandomFloat(5, 10, 2),
            calories: Math.floor(currentSteps * 0.04)
        },
        history,
        weeklyAverage: Math.round(weeklyAverage),
        monthlyTotal
    };
};
exports.generateStepsData = generateStepsData;
// Water Intake Mock Data
const generateWaterIntakeData = (date) => {
    const targetDate = date || new Date();
    const goal = 8.0; // 8 glasses/liters
    const entries = Array.from({ length: getRandomInt(4, 8) }, (_, i) => {
        const timestamp = new Date(targetDate);
        timestamp.setHours(8 + i * 2, getRandomInt(0, 59));
        return {
            id: (0, uuid_1.v4)(),
            timestamp,
            amount: getRandomFloat(0.2, 0.5, 1),
            unit: 'L'
        };
    });
    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const percentage = Math.min((totalAmount / goal) * 100, 100);
    return {
        date: targetDate,
        entries,
        totalAmount: parseFloat(totalAmount.toFixed(1)),
        goal,
        percentage: Math.round(percentage)
    };
};
exports.generateWaterIntakeData = generateWaterIntakeData;
// Weight Mock Data
const generateWeightData = (timeRange) => {
    const baseWeight = getRandomFloat(60, 90, 1);
    const today = new Date();
    const history = Array.from({ length: 30 }, (_, i) => ({
        id: (0, uuid_1.v4)(),
        date: getDateDaysAgo(i),
        weight: baseWeight + getRandomFloat(-2, 2, 1),
        unit: 'kg',
        bodyFat: getRandomFloat(15, 25, 1),
        muscleMass: getRandomFloat(30, 45, 1)
    }));
    const currentWeight = baseWeight + getRandomFloat(-1, 1, 1);
    const weeklyChange = currentWeight - history[7].weight;
    const monthlyChange = currentWeight - history[29].weight;
    let trend = 'stable';
    if (weeklyChange > 0.5)
        trend = 'increasing';
    else if (weeklyChange < -0.5)
        trend = 'decreasing';
    return {
        current: {
            id: (0, uuid_1.v4)(),
            date: today,
            weight: currentWeight,
            unit: 'kg',
            bodyFat: getRandomFloat(15, 25, 1),
            muscleMass: getRandomFloat(30, 45, 1)
        },
        history,
        trend,
        weeklyChange: parseFloat(weeklyChange.toFixed(1)),
        monthlyChange: parseFloat(monthlyChange.toFixed(1))
    };
};
exports.generateWeightData = generateWeightData;
// Heart Rate Mock Data
const generateHeartRateData = (timeRange) => {
    const restingHR = getRandomInt(60, 80);
    const maxHR = 220 - 30; // Assuming age 30
    const zones = {
        zone1: { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6) },
        zone2: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7) },
        zone3: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8) },
        zone4: { min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9) },
        zone5: { min: Math.round(maxHR * 0.9), max: maxHR }
    };
    const history = Array.from({ length: 24 }, (_, i) => ({
        id: (0, uuid_1.v4)(),
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000), // Last 24 hours
        bpm: getRandomInt(65, 120),
        type: i < 8 ? 'resting' : i < 16 ? 'active' : 'recovery'
    }));
    return {
        current: {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            bpm: getRandomInt(70, 85),
            type: 'resting'
        },
        resting: restingHR,
        maximum: maxHR,
        zones,
        history
    };
};
exports.generateHeartRateData = generateHeartRateData;
// Nutrition Mock Data
const generateNutritionData = (date) => {
    const targetDate = date || new Date();
    const entries = [
        {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(targetDate.setHours(8, 0)),
            calories: 450,
            protein: 20,
            carbs: 45,
            fat: 18,
            fiber: 8,
            sugar: 12
        },
        {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(targetDate.setHours(13, 0)),
            calories: 650,
            protein: 35,
            carbs: 55,
            fat: 25,
            fiber: 12,
            sugar: 8
        },
        {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(targetDate.setHours(19, 0)),
            calories: 580,
            protein: 40,
            carbs: 40,
            fat: 22,
            fiber: 10,
            sugar: 6
        }
    ];
    const totals = entries.reduce((acc, entry) => ({
        id: (0, uuid_1.v4)(),
        timestamp: targetDate,
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
        fiber: (acc.fiber || 0) + (entry.fiber || 0),
        sugar: (acc.sugar || 0) + (entry.sugar || 0)
    }), {
        id: (0, uuid_1.v4)(),
        timestamp: targetDate,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0
    });
    const goals = {
        calories: 2200,
        protein: 120,
        carbs: 250,
        fat: 80
    };
    // Calculate nutrition score (simplified)
    const score = Math.min(100, Math.round((totals.protein / goals.protein * 25) +
        (Math.min(totals.calories, goals.calories) / goals.calories * 25) +
        ((totals.fiber || 0) / 30 * 25) + // 30g fiber target
        (25) // Base score for having balanced meals
    ));
    return {
        date: targetDate,
        entries,
        totals,
        goals,
        score
    };
};
exports.generateNutritionData = generateNutritionData;
// Sleep Mock Data
const generateSleepData = (timeRange) => {
    const generateSleepEntry = (daysAgo) => {
        const date = getDateDaysAgo(daysAgo);
        const bedtime = new Date(date);
        bedtime.setHours(22, getRandomInt(0, 59));
        const wakeTime = new Date(date);
        wakeTime.setDate(wakeTime.getDate() + 1);
        wakeTime.setHours(6, getRandomInt(30, 59));
        const duration = (wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60);
        const quality = getRandomInt(70, 95);
        return {
            id: (0, uuid_1.v4)(),
            date,
            bedtime,
            wakeTime,
            duration: parseFloat(duration.toFixed(1)),
            quality,
            deepSleep: getRandomFloat(1.5, 2.5, 1),
            remSleep: getRandomFloat(1.0, 2.0, 1),
            lightSleep: getRandomFloat(3.0, 4.5, 1)
        };
    };
    const history = Array.from({ length: 30 }, (_, i) => generateSleepEntry(i));
    const current = generateSleepEntry(0);
    const averageDuration = history.reduce((sum, sleep) => sum + sleep.duration, 0) / history.length;
    const averageQuality = history.reduce((sum, sleep) => sum + sleep.quality, 0) / history.length;
    const weeklyPattern = history.slice(0, 7).map(sleep => sleep.duration);
    return {
        current,
        history,
        averageDuration: parseFloat(averageDuration.toFixed(1)),
        averageQuality: Math.round(averageQuality),
        weeklyPattern
    };
};
exports.generateSleepData = generateSleepData;
// Activity Mock Data
const generateActivityData = (date) => {
    const targetDate = date || new Date();
    const workouts = [
        {
            id: (0, uuid_1.v4)(),
            type: 'Running',
            duration: 45,
            intensity: 'moderate',
            caloriesBurned: 400,
            startTime: new Date(new Date(targetDate).setHours(7, 0))
        },
        {
            id: (0, uuid_1.v4)(),
            type: 'Strength Training',
            duration: 60,
            intensity: 'high',
            caloriesBurned: 300,
            startTime: new Date(new Date(targetDate).setHours(18, 30))
        }
    ];
    const activeMinutes = workouts.reduce((sum, workout) => sum + workout.duration, 0) + getRandomInt(30, 90);
    const caloriesBurned = workouts.reduce((sum, workout) => sum + workout.caloriesBurned, 0) + getRandomInt(200, 400);
    return {
        id: (0, uuid_1.v4)(),
        date: targetDate,
        activeMinutes,
        sedentaryMinutes: 1440 - activeMinutes - 480, // 24h - active - sleep
        workouts,
        caloriesBurned
    };
};
exports.generateActivityData = generateActivityData;
//# sourceMappingURL=mockData.js.map