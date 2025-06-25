/**
 * GraphQL Resolvers - Issue #5 + #7
 *
 * Main resolver functions for all widget queries, mutations, and subscriptions
 * Extended with CPAP data resolvers for Issue #7
 */
import { GraphQLScalarType } from 'graphql';
export declare const resolvers: {
    DateTime: GraphQLScalarType<Date, string>;
    Query: {
        steps: (_: any, args: any) => Promise<{
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
        }>;
        waterIntake: (_: any, args: any) => Promise<{
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
        }>;
        weightHistory: (_: any, args: any) => Promise<{
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
        }>;
        heartRate: (_: any, args: any) => Promise<{
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
        }>;
        nutrition: (_: any, args: any) => Promise<{
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
        }>;
        sleep: (_: any, args: any) => Promise<{
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
        }>;
        activity: (_: any, args: any) => Promise<{
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
        }>;
        getCPAPMetricsRange: (_: any, args: {
            start: string;
            end: string;
        }) => Promise<import("../../types/cpap").CpapMetricsGraphQL[]>;
        getCPAPSpo2Trend: (_: any, args: {
            start: string;
            end: string;
        }) => Promise<import("../../types/cpap").Spo2TrendData[]>;
        getCPAPSpo2Pulse: (_: any, args: {
            start: string;
            end: string;
        }) => Promise<import("../../types/cpap").Spo2PulseData[]>;
        getCPAPLeakRate: (_: any, args: {
            start: string;
            end: string;
        }) => Promise<import("../../types/cpap").LeakRateData[]>;
        getCPAPSleepSessions: (_: any, args: {
            start: string;
            end: string;
        }) => Promise<import("../../types/cpap").SleepSessionData[]>;
        getWorkoutSessions: (_: any, args: {
            start: string;
            end: string;
        }) => Promise<import("../../types/polar").WorkoutSession[]>;
        getWeeklyZoneBreakdown: (_: any, args: {
            weekStart: string;
        }) => Promise<{
            Z1: number;
            Z2: number;
            Z3: number;
            Z4: number;
            Z5: number;
        }>;
        getTrainingLoadTrend: (_: any, args: {
            days: number;
        }) => Promise<{
            date: string;
            trimp_score: number;
        }[]>;
        getWeightSessions: (_: any, args: {
            start: string;
            end: string;
        }) => Promise<import("../../types/scale").WeightSession[]>;
        getWeightDelta: (_: any, args: {
            days: number;
        }) => Promise<import("../../types/scale").WeightTrend | null>;
        getHealthScoreTrend: (_: any, args: {
            start: string;
            end: string;
        }) => Promise<{
            date: string;
            health_score: number | undefined;
        }[]>;
        getLatestHealthSnapshot: () => Promise<import("../../types/scale").HealthSnapshot | null>;
        getLabResults: (_: any, args: any) => Promise<import("../../types/bloodwork").LabResult[]>;
        getEnhancedLabResults: (_: any, args: any) => Promise<import("../../types/bloodwork").EnhancedLabResult[]>;
        getLabSummary: (_: any, args: {
            collectedOn: string;
        }) => Promise<import("../../types/bloodwork").LabSummary | null>;
        getLabTrend: (_: any, args: {
            testName: string;
            days?: number;
        }) => Promise<import("../../types/bloodwork").LabTrend | null>;
        getLatestLabResults: () => Promise<import("../../types/bloodwork").EnhancedLabResult[]>;
        getLabMetrics: (_: any, args: {
            testNames?: string[];
        }) => Promise<import("../../types/bloodwork").LabMetric[]>;
        getAvailableLabDates: () => Promise<string[]>;
        health: () => string;
        widgetRegistry: () => import("../widgetRegistry").WidgetRegistryEntry[];
    };
    Mutation: {
        refreshWidget: (_: any, args: any, context: any) => Promise<boolean>;
        refreshCPAPData: (_: any, _args: any, context: any) => Promise<boolean>;
    };
    Subscription: {
        widgetUpdated: {
            subscribe: (_: any, args: any, context: any) => any;
        };
        datasetRefreshed: {
            subscribe: (_: any, args: any, context: any) => any;
        };
        webhookReceived: {
            subscribe: (_: any, args: any, context: any) => any;
        };
        cpapDataUpdated: {
            subscribe: (_: any, args: any, context: any) => any;
        };
    };
};
//# sourceMappingURL=index.d.ts.map