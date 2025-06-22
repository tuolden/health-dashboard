/**
 * GraphQL Resolvers - Issue #5
 *
 * Main resolver functions for all widget queries, mutations, and subscriptions
 */
import { GraphQLScalarType } from 'graphql';
import { ContextValue } from '../../types/context';
import { TimeRange } from '../../types/widgets';
export declare const resolvers: {
    DateTime: GraphQLScalarType<Date, string>;
    Query: {
        steps: (_: any, args: {
            timeRange?: TimeRange;
        }, context: ContextValue) => Promise<import("../../types/widgets").StepsHistory>;
        waterIntake: (_: any, args: {
            date?: Date;
        }, context: ContextValue) => Promise<import("../../types/widgets").WaterIntakeData>;
        weightHistory: (_: any, args: {
            timeRange?: TimeRange;
        }, context: ContextValue) => Promise<import("../../types/widgets").WeightHistory>;
        heartRate: (_: any, args: {
            timeRange?: TimeRange;
        }, context: ContextValue) => Promise<import("../../types/widgets").HeartRateData>;
        nutrition: (_: any, args: {
            date?: Date;
        }, context: ContextValue) => Promise<import("../../types/widgets").NutritionData>;
        sleep: (_: any, args: {
            timeRange?: TimeRange;
        }, context: ContextValue) => Promise<import("../../types/widgets").SleepHistory>;
        activity: (_: any, args: {
            date?: Date;
        }, context: ContextValue) => Promise<import("../../types/widgets").ActivityData>;
        health: () => string;
        widgetRegistry: () => import("../../types/widgets").WidgetRegistryEntry[];
    };
    Mutation: {
        refreshWidget: (_: any, args: {
            widgetType: string;
        }, context: ContextValue) => Promise<boolean>;
    };
    Subscription: {
        widgetUpdated: {
            subscribe: (_: any, args: {
                widgetType?: string;
            }, context: ContextValue) => AsyncIterator<unknown, any, any>;
        };
        datasetRefreshed: {
            subscribe: (_: any, args: {
                datasetName?: string;
            }, context: ContextValue) => AsyncIterator<unknown, any, any>;
        };
        webhookReceived: {
            subscribe: (_: any, args: {
                source?: string;
            }, context: ContextValue) => AsyncIterator<unknown, any, any>;
        };
    };
};
//# sourceMappingURL=index.d.ts.map