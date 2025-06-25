"use strict";
/**
 * Mock Data Generators - Issue #5
 *
 * Generate realistic mock data for all widget types during development
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBloodworkData = exports.generateActivityData = exports.generateSleepData = exports.generateNutritionData = exports.generateHeartRateData = exports.generateWeightData = exports.generateWaterIntakeData = exports.generateStepsData = void 0;
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
const generateStepsData = (_timeRange) => {
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
const generateWeightData = (_timeRange) => {
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
    const weeklyChange = currentWeight - (history[7]?.weight || currentWeight);
    const monthlyChange = currentWeight - (history[29]?.weight || currentWeight);
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
const generateHeartRateData = (_timeRange) => {
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
            timestamp: new Date(new Date(targetDate).setHours(8, 0)),
            calories: 450,
            protein: 20,
            carbs: 45,
            fat: 18,
            fiber: 8,
            sugar: 12
        },
        {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(new Date(targetDate).setHours(13, 0)),
            calories: 650,
            protein: 35,
            carbs: 55,
            fat: 25,
            fiber: 12,
            sugar: 8
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
    const score = Math.min(100, Math.round((totals.protein / goals.protein * 25) +
        (Math.min(totals.calories, goals.calories) / goals.calories * 25) +
        ((totals.fiber || 0) / 30 * 25) + 25));
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
const generateSleepData = (_timeRange) => {
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
// Bloodwork Mock Data - Issue #13
const generateBloodworkData = (daysBack = 90) => {
    // Common lab test reference ranges and typical values
    const labTests = [
        // Complete Blood Count (CBC)
        { name: 'WBC', min: 4.0, max: 11.0, units: 'K/uL', category: 'CBC' },
        { name: 'RBC', min: 4.2, max: 5.8, units: 'M/uL', category: 'CBC' },
        { name: 'Hemoglobin', min: 12.0, max: 17.0, units: 'g/dL', category: 'CBC' },
        { name: 'Hematocrit', min: 36.0, max: 50.0, units: '%', category: 'CBC' },
        { name: 'Platelet Count', min: 150, max: 450, units: 'K/uL', category: 'CBC' },
        { name: 'Neutrophils', min: 45, max: 70, units: '%', category: 'CBC' },
        { name: 'Lymphocytes', min: 20, max: 45, units: '%', category: 'CBC' },
        // Lipid Panel
        { name: 'Total Cholesterol', min: 100, max: 200, units: 'mg/dL', category: 'LIPID' },
        { name: 'LDL Cholesterol', min: 0, max: 100, units: 'mg/dL', category: 'LIPID' },
        { name: 'HDL Cholesterol', min: 40, max: 100, units: 'mg/dL', category: 'LIPID' },
        { name: 'Triglycerides', min: 0, max: 150, units: 'mg/dL', category: 'LIPID' },
        // Comprehensive Metabolic Panel (CMP)
        { name: 'Glucose', min: 70, max: 100, units: 'mg/dL', category: 'CMP' },
        { name: 'BUN', min: 7, max: 20, units: 'mg/dL', category: 'CMP' },
        { name: 'Creatinine', min: 0.6, max: 1.3, units: 'mg/dL', category: 'CMP' },
        { name: 'Sodium', min: 136, max: 145, units: 'mmol/L', category: 'CMP' },
        { name: 'Potassium', min: 3.5, max: 5.1, units: 'mmol/L', category: 'CMP' },
        { name: 'Chloride', min: 98, max: 107, units: 'mmol/L', category: 'CMP' },
        // Liver Function
        { name: 'AST', min: 10, max: 40, units: 'U/L', category: 'LIVER' },
        { name: 'ALT', min: 7, max: 56, units: 'U/L', category: 'LIVER' },
        { name: 'Alkaline Phosphatase', min: 44, max: 147, units: 'U/L', category: 'LIVER' },
        { name: 'Bilirubin Total', min: 0.2, max: 1.2, units: 'mg/dL', category: 'LIVER' },
        // Thyroid Function
        { name: 'TSH', min: 0.4, max: 4.0, units: 'mIU/L', category: 'THYROID' },
        { name: 'Free T4', min: 0.8, max: 1.8, units: 'ng/dL', category: 'THYROID' },
        { name: 'Free T3', min: 2.3, max: 4.2, units: 'pg/mL', category: 'THYROID' },
        // Hormone Panel
        { name: 'Testosterone Total', min: 300, max: 1000, units: 'ng/dL', category: 'HORMONE' },
        { name: 'PSA', min: 0.0, max: 4.0, units: 'ng/mL', category: 'HORMONE' },
        { name: 'Vitamin D', min: 30, max: 100, units: 'ng/mL', category: 'HORMONE' }
    ];
    // Generate test dates (every 30-90 days)
    const dates = [];
    const today = new Date();
    for (let i = 0; i < Math.floor(daysBack / 60); i++) {
        const testDate = new Date(today);
        testDate.setDate(testDate.getDate() - (i * getRandomInt(30, 90)));
        const dateString = testDate.toISOString().split('T')[0];
        if (dateString) {
            dates.push(dateString);
        }
    }
    // Generate lab results for each date
    const labResults = [];
    const labMetrics = [];
    for (const test of labTests) {
        // Add to metrics
        labMetrics.push({
            id: labMetrics.length + 1,
            test_name: test.name,
            range_min: test.min,
            range_max: test.max,
            units: test.units,
            category: test.category,
            description: `${test.name} lab test`
        });
        // Generate results for each date
        for (const date of dates) {
            // Generate realistic values with some variation
            const baseValue = test.min + (test.max - test.min) * 0.7; // Aim for 70% of range
            const variation = (test.max - test.min) * 0.3; // 30% variation
            const value = baseValue + (Math.random() - 0.5) * variation;
            // Occasionally generate out-of-range values (10% chance)
            const finalValue = Math.random() < 0.1
                ? value + (Math.random() - 0.5) * (test.max - test.min) * 0.5
                : Math.max(test.min * 0.8, Math.min(test.max * 1.2, value));
            labResults.push({
                id: labResults.length + 1,
                test_name: test.name,
                value: finalValue.toFixed(test.name.includes('Cholesterol') || test.name.includes('Glucose') ? 0 : 1),
                collected_on: date,
                numeric_value: parseFloat(finalValue.toFixed(2))
            });
        }
    }
    return {
        labResults: labResults.sort((a, b) => new Date(b.collected_on).getTime() - new Date(a.collected_on).getTime()),
        labMetrics,
        availableDates: dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    };
};
exports.generateBloodworkData = generateBloodworkData;
//# sourceMappingURL=mockData.js.map