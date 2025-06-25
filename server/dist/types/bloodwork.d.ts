/**
 * Bloodwork Lab Data Types - Issue #13
 *
 * TypeScript interfaces for bloodwork lab visualization system
 */
export interface LabResult {
    id?: number;
    test_name: string;
    value: string | number;
    collected_on: string;
    numeric_value?: number;
    is_numeric?: boolean;
}
export interface LabMetric {
    id?: number;
    test_name: string;
    range_min?: number;
    range_max?: number;
    units?: string;
    category?: string;
    description?: string;
}
export interface EnhancedLabResult extends LabResult {
    metric?: LabMetric;
    is_in_range?: boolean;
    deviation_score?: number;
    risk_level?: 'low' | 'normal' | 'elevated' | 'high' | 'critical';
    trend_direction?: 'increasing' | 'decreasing' | 'stable';
    change_from_previous?: number;
    change_percentage?: number;
}
export interface LabPanel {
    panel_name: string;
    tests: EnhancedLabResult[];
    overall_status: 'normal' | 'abnormal' | 'critical';
    abnormal_count: number;
    total_count: number;
}
export declare const LAB_PANELS: {
    readonly CBC: "Complete Blood Count";
    readonly LIPID: "Lipid Panel";
    readonly CMP: "Comprehensive Metabolic Panel";
    readonly LIVER: "Liver Function";
    readonly KIDNEY: "Kidney Function";
    readonly THYROID: "Thyroid Function";
    readonly HORMONE: "Hormone Panel";
    readonly URINE: "Urinalysis";
};
export type LabPanelType = keyof typeof LAB_PANELS;
export interface LabSummary {
    collected_on: string;
    total_tests: number;
    in_range_count: number;
    out_of_range_count: number;
    critical_count: number;
    panels: LabPanel[];
    top_concerns: EnhancedLabResult[];
    overall_health_score?: number;
}
export interface LabTrend {
    test_name: string;
    values: Array<{
        date: string;
        value: number;
        is_in_range: boolean;
    }>;
    trend_direction: 'increasing' | 'decreasing' | 'stable';
    slope?: number;
    correlation?: number;
    latest_value: number;
    previous_value?: number;
    change_amount?: number;
    change_percentage?: number;
}
export interface RiskAssessment {
    test_name: string;
    current_value: number;
    risk_level: 'low' | 'normal' | 'elevated' | 'high' | 'critical';
    risk_score: number;
    risk_factors: string[];
    recommendations: string[];
}
export interface BloodworkQueryFilters {
    startDate?: string;
    endDate?: string;
    testNames?: string[];
    panelType?: LabPanelType;
    limit?: number;
    offset?: number;
    onlyAbnormal?: boolean;
    riskLevel?: string[];
}
export declare class BloodworkDataError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code?: string, details?: any | undefined);
}
export declare const DEFAULT_QUERY_LIMIT = 50;
export declare const MAX_QUERY_LIMIT = 1000;
export declare const LAB_CATEGORIES: {
    readonly CBC: readonly ["WBC", "RBC", "Hemoglobin", "Hematocrit", "MCV", "MCH", "MCHC", "RDW", "Platelet Count", "Neutrophils", "Lymphocytes", "Monocytes", "Eosinophils", "Basophils"];
    readonly LIPID: readonly ["Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol", "Triglycerides", "Non-HDL Cholesterol", "Cholesterol/HDL Ratio"];
    readonly CMP: readonly ["Glucose", "BUN", "Creatinine", "eGFR", "BUN/Creatinine Ratio", "Sodium", "Potassium", "Chloride", "CO2", "Anion Gap", "Calcium", "Total Protein", "Albumin", "Globulin", "A/G Ratio", "Bilirubin Total", "Alkaline Phosphatase", "AST", "ALT"];
    readonly LIVER: readonly ["AST", "ALT", "Alkaline Phosphatase", "Bilirubin Total", "Bilirubin Direct", "GGT", "Total Protein", "Albumin", "Globulin", "A/G Ratio"];
    readonly KIDNEY: readonly ["BUN", "Creatinine", "eGFR", "BUN/Creatinine Ratio", "Uric Acid", "Cystatin C", "Microalbumin"];
    readonly THYROID: readonly ["TSH", "Free T4", "Free T3", "Reverse T3", "TPO Antibodies", "Thyroglobulin Antibodies"];
    readonly HORMONE: readonly ["Testosterone Total", "Testosterone Free", "SHBG", "PSA", "DHEA-S", "Cortisol", "Insulin", "IGF-1"];
    readonly URINE: readonly ["Urine Specific Gravity", "Urine pH", "Urine Protein", "Urine Glucose", "Urine Ketones", "Urine Blood", "Urine Leukocyte Esterase", "Urine Nitrites"];
};
export declare const RISK_THRESHOLDS: {
    readonly DEVIATION_MILD: 1.2;
    readonly DEVIATION_MODERATE: 1.5;
    readonly DEVIATION_SEVERE: 2;
    readonly DEVIATION_CRITICAL: 3;
};
export declare function calculateDeviationScore(value: number, rangeMin?: number, rangeMax?: number): number;
export declare function getRiskLevel(deviationScore: number): 'low' | 'normal' | 'elevated' | 'high' | 'critical';
export declare function calculateTrendDirection(current: number, previous: number, threshold?: number): 'increasing' | 'decreasing' | 'stable';
//# sourceMappingURL=bloodwork.d.ts.map