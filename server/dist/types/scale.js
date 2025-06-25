"use strict";
/**
 * HUME Scale Types - Issue #11
 *
 * TypeScript interfaces for HUME smart scale data and API responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STABLE_CHANGE_THRESHOLD = exports.MAX_QUERY_LIMIT = exports.DEFAULT_QUERY_LIMIT = exports.HEALTH_METRICS = exports.getTrendDirection = exports.calculatePercentageChange = exports.calculateChange = exports.ScaleDataError = void 0;
// Error types
class ScaleDataError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'ScaleDataError';
    }
}
exports.ScaleDataError = ScaleDataError;
// Utility functions for calculations
const calculateChange = (current, previous) => {
    if (current === undefined || previous === undefined)
        return null;
    return current - previous;
};
exports.calculateChange = calculateChange;
const calculatePercentageChange = (current, previous) => {
    if (current === undefined || previous === undefined || previous === 0)
        return null;
    return ((current - previous) / previous) * 100;
};
exports.calculatePercentageChange = calculatePercentageChange;
const getTrendDirection = (change) => {
    if (change === null || change === undefined)
        return 'stable';
    if (Math.abs(change) < 0.1)
        return 'stable'; // Small changes considered stable
    return change > 0 ? 'increasing' : 'decreasing';
};
exports.getTrendDirection = getTrendDirection;
// Constants for health metrics
exports.HEALTH_METRICS = {
    WEIGHT: 'weight',
    BODY_FAT_PERCENTAGE: 'body_fat_percentage',
    LEAN_MASS: 'lean_mass',
    SKELETAL_MUSCLE_MASS: 'skeletal_muscle_mass',
    BMR: 'bmr',
    RESTING_HEART_RATE: 'resting_heart_rate',
    BODY_WATER: 'body_water',
    VISCERAL_FAT_INDEX: 'visceral_fat_index',
    HEALTH_SCORE: 'health_score'
};
// Default values and thresholds
exports.DEFAULT_QUERY_LIMIT = 30;
exports.MAX_QUERY_LIMIT = 365;
exports.STABLE_CHANGE_THRESHOLD = 0.1;
//# sourceMappingURL=scale.js.map