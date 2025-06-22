"use strict";
/**
 * CPAP Data Types - Issue #7
 *
 * TypeScript interfaces for CPAP metrics from health_ingest database
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseApiDate = exports.formatDateForApi = exports.calculateSleepPattern = exports.calculateLeakSeverity = exports.calculateSpo2Quality = exports.CpapNotFoundError = exports.CpapValidationError = exports.CpapDataError = exports.CPAP_THRESHOLDS = void 0;
// Health thresholds for CPAP data
exports.CPAP_THRESHOLDS = {
    SPO2: {
        EXCELLENT: 95, // >= 95%
        GOOD: 92, // >= 92%
        CONCERNING: 90, // >= 90%
        CRITICAL: 88 // < 88%
    },
    LEAK_RATE: {
        EXCELLENT: 10, // <= 10 L/min
        GOOD: 20, // <= 20 L/min
        CONCERNING: 24, // <= 24 L/min (threshold from issue)
        CRITICAL: 30 // > 24 L/min
    },
    PULSE_RATE: {
        MIN_NORMAL: 50,
        MAX_NORMAL: 100,
        CONCERNING_HIGH: 110
    },
    BEDTIME: {
        EARLY: 21, // Before 9 PM
        NORMAL_START: 21,
        NORMAL_END: 23,
        LATE: 23 // After 11 PM
    }
};
// Error types for CPAP operations
class CpapDataError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'CpapDataError';
    }
}
exports.CpapDataError = CpapDataError;
class CpapValidationError extends CpapDataError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}
exports.CpapValidationError = CpapValidationError;
class CpapNotFoundError extends CpapDataError {
    constructor(message) {
        super(message, 'NOT_FOUND', 404);
    }
}
exports.CpapNotFoundError = CpapNotFoundError;
// Utility functions for CPAP data processing
const calculateSpo2Quality = (spo2) => {
    if (!spo2 || spo2 <= 0)
        return 'critical';
    if (spo2 >= exports.CPAP_THRESHOLDS.SPO2.EXCELLENT)
        return 'excellent';
    if (spo2 >= exports.CPAP_THRESHOLDS.SPO2.GOOD)
        return 'good';
    if (spo2 >= exports.CPAP_THRESHOLDS.SPO2.CONCERNING)
        return 'concerning';
    return 'critical';
};
exports.calculateSpo2Quality = calculateSpo2Quality;
const calculateLeakSeverity = (leakRate) => {
    if (!leakRate || leakRate < 0)
        return 'critical';
    if (leakRate <= exports.CPAP_THRESHOLDS.LEAK_RATE.EXCELLENT)
        return 'excellent';
    if (leakRate <= exports.CPAP_THRESHOLDS.LEAK_RATE.GOOD)
        return 'good';
    if (leakRate <= exports.CPAP_THRESHOLDS.LEAK_RATE.CONCERNING)
        return 'concerning';
    return 'critical';
};
exports.calculateLeakSeverity = calculateLeakSeverity;
const calculateSleepPattern = (sessionStart) => {
    const hour = sessionStart.getHours();
    if (hour < exports.CPAP_THRESHOLDS.BEDTIME.EARLY)
        return 'irregular'; // Very early (before 9 PM)
    if (hour <= exports.CPAP_THRESHOLDS.BEDTIME.NORMAL_END)
        return 'normal'; // 9 PM - 11 PM
    if (hour <= 23)
        return 'late'; // 11 PM - 11:59 PM
    return 'irregular'; // After midnight
};
exports.calculateSleepPattern = calculateSleepPattern;
const formatDateForApi = (date) => {
    const isoString = date.toISOString();
    const datePart = isoString.split('T')[0];
    return datePart || ''; // YYYY-MM-DD
};
exports.formatDateForApi = formatDateForApi;
const parseApiDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00Z');
    if (isNaN(date.getTime())) {
        throw new CpapValidationError(`Invalid date format: ${dateString}. Expected YYYY-MM-DD`);
    }
    return date;
};
exports.parseApiDate = parseApiDate;
//# sourceMappingURL=cpap.js.map