"use strict";
/**
 * Bloodwork Lab Data Types - Issue #13
 *
 * TypeScript interfaces for bloodwork lab visualization system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RISK_THRESHOLDS = exports.LAB_CATEGORIES = exports.MAX_QUERY_LIMIT = exports.DEFAULT_QUERY_LIMIT = exports.BloodworkDataError = exports.LAB_PANELS = void 0;
exports.calculateDeviationScore = calculateDeviationScore;
exports.getRiskLevel = getRiskLevel;
exports.calculateTrendDirection = calculateTrendDirection;
// Common lab panels
exports.LAB_PANELS = {
    CBC: 'Complete Blood Count',
    LIPID: 'Lipid Panel',
    CMP: 'Comprehensive Metabolic Panel',
    LIVER: 'Liver Function',
    KIDNEY: 'Kidney Function',
    THYROID: 'Thyroid Function',
    HORMONE: 'Hormone Panel',
    URINE: 'Urinalysis'
};
// Database error handling
class BloodworkDataError extends Error {
    code;
    details;
    constructor(message, code = 'BLOODWORK_ERROR', details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'BloodworkDataError';
    }
}
exports.BloodworkDataError = BloodworkDataError;
// Constants
exports.DEFAULT_QUERY_LIMIT = 50;
exports.MAX_QUERY_LIMIT = 1000;
// Common lab test categories
exports.LAB_CATEGORIES = {
    // Complete Blood Count
    CBC: [
        'WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC', 'RDW',
        'Platelet Count', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'
    ],
    // Lipid Panel
    LIPID: [
        'Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides',
        'Non-HDL Cholesterol', 'Cholesterol/HDL Ratio'
    ],
    // Comprehensive Metabolic Panel
    CMP: [
        'Glucose', 'BUN', 'Creatinine', 'eGFR', 'BUN/Creatinine Ratio',
        'Sodium', 'Potassium', 'Chloride', 'CO2', 'Anion Gap',
        'Calcium', 'Total Protein', 'Albumin', 'Globulin', 'A/G Ratio',
        'Bilirubin Total', 'Alkaline Phosphatase', 'AST', 'ALT'
    ],
    // Liver Function
    LIVER: [
        'AST', 'ALT', 'Alkaline Phosphatase', 'Bilirubin Total', 'Bilirubin Direct',
        'GGT', 'Total Protein', 'Albumin', 'Globulin', 'A/G Ratio'
    ],
    // Kidney Function
    KIDNEY: [
        'BUN', 'Creatinine', 'eGFR', 'BUN/Creatinine Ratio', 'Uric Acid',
        'Cystatin C', 'Microalbumin'
    ],
    // Thyroid Function
    THYROID: [
        'TSH', 'Free T4', 'Free T3', 'Reverse T3', 'TPO Antibodies', 'Thyroglobulin Antibodies'
    ],
    // Hormone Panel
    HORMONE: [
        'Testosterone Total', 'Testosterone Free', 'SHBG', 'PSA', 'DHEA-S',
        'Cortisol', 'Insulin', 'IGF-1'
    ],
    // Urinalysis
    URINE: [
        'Urine Specific Gravity', 'Urine pH', 'Urine Protein', 'Urine Glucose',
        'Urine Ketones', 'Urine Blood', 'Urine Leukocyte Esterase', 'Urine Nitrites'
    ]
};
// Risk level thresholds
exports.RISK_THRESHOLDS = {
    DEVIATION_MILD: 1.2, // 20% outside normal range
    DEVIATION_MODERATE: 1.5, // 50% outside normal range  
    DEVIATION_SEVERE: 2.0, // 100% outside normal range
    DEVIATION_CRITICAL: 3.0 // 200% outside normal range
};
// Utility functions
function calculateDeviationScore(value, rangeMin, rangeMax) {
    if (!rangeMin || !rangeMax)
        return 0;
    if (value >= rangeMin && value <= rangeMax)
        return 0;
    if (value < rangeMin) {
        return Math.abs((rangeMin - value) / rangeMin);
    }
    else {
        return Math.abs((value - rangeMax) / rangeMax);
    }
}
function getRiskLevel(deviationScore) {
    if (deviationScore === 0)
        return 'normal';
    if (deviationScore < exports.RISK_THRESHOLDS.DEVIATION_MILD)
        return 'low';
    if (deviationScore < exports.RISK_THRESHOLDS.DEVIATION_MODERATE)
        return 'elevated';
    if (deviationScore < exports.RISK_THRESHOLDS.DEVIATION_SEVERE)
        return 'high';
    return 'critical';
}
function calculateTrendDirection(current, previous, threshold = 0.05) {
    const changePercent = Math.abs((current - previous) / previous);
    if (changePercent < threshold)
        return 'stable';
    return current > previous ? 'increasing' : 'decreasing';
}
//# sourceMappingURL=bloodwork.js.map