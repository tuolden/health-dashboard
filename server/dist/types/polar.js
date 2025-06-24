"use strict";
/**
 * Polar Heart Rate Data Types - Issue #9
 *
 * TypeScript interfaces for polar_metrics table and workout session analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateForApi = exports.calculateCaloriesForZone = exports.getHeartRateZone = exports.calculateHeartRateZones = exports.PolarValidationError = exports.PolarDataError = exports.DEFAULT_MAX_HEART_RATE = exports.HEART_RATE_THRESHOLDS = void 0;
// Heart rate thresholds and constants
exports.HEART_RATE_THRESHOLDS = {
    RESTING: {
        EXCELLENT: 50,
        GOOD: 60,
        AVERAGE: 70,
        POOR: 80
    },
    ZONES: {
        // Based on percentage of max heart rate
        Z1_MIN: 0.50, // 50-60% - Recovery
        Z1_MAX: 0.60,
        Z2_MIN: 0.60, // 60-70% - Aerobic
        Z2_MAX: 0.70,
        Z3_MIN: 0.70, // 70-80% - Anaerobic
        Z3_MAX: 0.80,
        Z4_MIN: 0.80, // 80-90% - VO2 Max
        Z4_MAX: 0.90,
        Z5_MIN: 0.90, // 90-100% - Neuromuscular
        Z5_MAX: 1.00
    },
    CALORIES: {
        // Calories per minute by zone (rough estimates)
        Z1_CAL_PER_MIN: 8,
        Z2_CAL_PER_MIN: 12,
        Z3_CAL_PER_MIN: 16,
        Z4_CAL_PER_MIN: 20,
        Z5_CAL_PER_MIN: 25
    },
    SESSION_DETECTION: {
        MIN_DURATION_MINUTES: 10, // Minimum 10 minutes for valid session
        MAX_GAP_MINUTES: 5, // Max 5 minute gap before ending session
        MIN_HEART_RATE: 50, // Minimum valid heart rate
        MAX_HEART_RATE: 220, // Maximum valid heart rate
        WARMUP_THRESHOLD_MINUTES: 5 // Time to reach target zone
    }
};
// Default heart rate zones (can be personalized later)
exports.DEFAULT_MAX_HEART_RATE = 190; // Age-based: 220 - 30 years old
// Error types for polar data operations
class PolarDataError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'PolarDataError';
    }
}
exports.PolarDataError = PolarDataError;
class PolarValidationError extends Error {
    field;
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = 'PolarValidationError';
    }
}
exports.PolarValidationError = PolarValidationError;
// Utility functions
const calculateHeartRateZones = (maxHeartRate = exports.DEFAULT_MAX_HEART_RATE) => {
    return {
        maxHeartRate,
        zones: {
            Z1: {
                min: Math.round(maxHeartRate * exports.HEART_RATE_THRESHOLDS.ZONES.Z1_MIN),
                max: Math.round(maxHeartRate * exports.HEART_RATE_THRESHOLDS.ZONES.Z1_MAX),
                name: 'Recovery'
            },
            Z2: {
                min: Math.round(maxHeartRate * exports.HEART_RATE_THRESHOLDS.ZONES.Z2_MIN),
                max: Math.round(maxHeartRate * exports.HEART_RATE_THRESHOLDS.ZONES.Z2_MAX),
                name: 'Aerobic'
            },
            Z3: {
                min: Math.round(maxHeartRate * exports.HEART_RATE_THRESHOLDS.ZONES.Z3_MIN),
                max: Math.round(maxHeartRate * exports.HEART_RATE_THRESHOLDS.ZONES.Z3_MAX),
                name: 'Anaerobic'
            },
            Z4: {
                min: Math.round(maxHeartRate * exports.HEART_RATE_THRESHOLDS.ZONES.Z4_MIN),
                max: Math.round(maxHeartRate * exports.HEART_RATE_THRESHOLDS.ZONES.Z4_MAX),
                name: 'VO2 Max'
            },
            Z5: {
                min: Math.round(maxHeartRate * exports.HEART_RATE_THRESHOLDS.ZONES.Z5_MIN),
                max: Math.round(maxHeartRate * exports.HEART_RATE_THRESHOLDS.ZONES.Z5_MAX),
                name: 'Neuromuscular'
            }
        }
    };
};
exports.calculateHeartRateZones = calculateHeartRateZones;
const getHeartRateZone = (heartRate, zones) => {
    if (heartRate >= zones.zones.Z5.min)
        return 'Z5';
    if (heartRate >= zones.zones.Z4.min)
        return 'Z4';
    if (heartRate >= zones.zones.Z3.min)
        return 'Z3';
    if (heartRate >= zones.zones.Z2.min)
        return 'Z2';
    if (heartRate >= zones.zones.Z1.min)
        return 'Z1';
    return null;
};
exports.getHeartRateZone = getHeartRateZone;
const calculateCaloriesForZone = (zone, minutes) => {
    const caloriesPerMinute = {
        Z1: exports.HEART_RATE_THRESHOLDS.CALORIES.Z1_CAL_PER_MIN,
        Z2: exports.HEART_RATE_THRESHOLDS.CALORIES.Z2_CAL_PER_MIN,
        Z3: exports.HEART_RATE_THRESHOLDS.CALORIES.Z3_CAL_PER_MIN,
        Z4: exports.HEART_RATE_THRESHOLDS.CALORIES.Z4_CAL_PER_MIN,
        Z5: exports.HEART_RATE_THRESHOLDS.CALORIES.Z5_CAL_PER_MIN
    };
    return Math.round(caloriesPerMinute[zone] * minutes);
};
exports.calculateCaloriesForZone = calculateCaloriesForZone;
const formatDateForApi = (date) => {
    return date.toISOString().split('T')[0];
};
exports.formatDateForApi = formatDateForApi;
//# sourceMappingURL=polar.js.map