"use strict";
/**
 * GraphQL Resolvers - Issue #5
 *
 * Main resolver functions for all widget queries, mutations, and subscriptions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const graphql_1 = require("graphql");
const widgetRegistry_1 = require("../widgetRegistry");
const pubsub_1 = require("../../utils/pubsub");
const mockData_1 = require("../../utils/mockData");
// Custom DateTime scalar
const DateTimeScalar = new graphql_1.GraphQLScalarType({
    name: 'DateTime',
    description: 'Date custom scalar type',
    serialize(value) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        throw new Error('Value is not an instance of Date: ' + value);
    },
    parseValue(value) {
        if (typeof value === 'string') {
            return new Date(value);
        }
        throw new Error('Value is not a valid date string: ' + value);
    },
    parseLiteral(ast) {
        if (ast.kind === graphql_1.Kind.STRING) {
            return new Date(ast.value);
        }
        throw new Error('Can only parse strings to dates but got a: ' + ast.kind);
    }
});
// Query Resolvers
const Query = {
    // Widget Data Queries
    steps: async (_, args, context) => {
        try {
            console.log('📊 Fetching steps data...', args.timeRange ? 'with time range' : 'default range');
            return (0, mockData_1.generateStepsData)(args.timeRange);
        }
        catch (error) {
            console.error('❌ Error fetching steps data:', error);
            throw new Error('Failed to fetch steps data');
        }
    },
    waterIntake: async (_, args, context) => {
        try {
            console.log('💧 Fetching water intake data for:', args.date || 'today');
            return (0, mockData_1.generateWaterIntakeData)(args.date);
        }
        catch (error) {
            console.error('❌ Error fetching water intake data:', error);
            throw new Error('Failed to fetch water intake data');
        }
    },
    weightHistory: async (_, args, context) => {
        try {
            console.log('⚖️ Fetching weight history...', args.timeRange ? 'with time range' : 'default range');
            return (0, mockData_1.generateWeightData)(args.timeRange);
        }
        catch (error) {
            console.error('❌ Error fetching weight data:', error);
            throw new Error('Failed to fetch weight data');
        }
    },
    heartRate: async (_, args, context) => {
        try {
            console.log('❤️ Fetching heart rate data...', args.timeRange ? 'with time range' : 'default range');
            return (0, mockData_1.generateHeartRateData)(args.timeRange);
        }
        catch (error) {
            console.error('❌ Error fetching heart rate data:', error);
            throw new Error('Failed to fetch heart rate data');
        }
    },
    nutrition: async (_, args, context) => {
        try {
            console.log('🍎 Fetching nutrition data for:', args.date || 'today');
            return (0, mockData_1.generateNutritionData)(args.date);
        }
        catch (error) {
            console.error('❌ Error fetching nutrition data:', error);
            throw new Error('Failed to fetch nutrition data');
        }
    },
    sleep: async (_, args, context) => {
        try {
            console.log('😴 Fetching sleep data...', args.timeRange ? 'with time range' : 'default range');
            return (0, mockData_1.generateSleepData)(args.timeRange);
        }
        catch (error) {
            console.error('❌ Error fetching sleep data:', error);
            throw new Error('Failed to fetch sleep data');
        }
    },
    activity: async (_, args, context) => {
        try {
            console.log('🏃 Fetching activity data for:', args.date || 'today');
            return (0, mockData_1.generateActivityData)(args.date);
        }
        catch (error) {
            console.error('❌ Error fetching activity data:', error);
            throw new Error('Failed to fetch activity data');
        }
    },
    // System Queries
    health: () => {
        return 'GraphQL Health Dashboard API is running! 🚀';
    },
    widgetRegistry: () => {
        console.log('📋 Fetching widget registry...');
        return widgetRegistry_1.widgetRegistry.getFullRegistry();
    }
};
// Mutation Resolvers
const Mutation = {
    refreshWidget: async (_, args, context) => {
        try {
            console.log(`🔄 Refreshing widget: ${args.widgetType}`);
            // Simulate widget refresh
            const datasetName = widgetRegistry_1.widgetRegistry.getDatasetByWidget(args.widgetType);
            if (!datasetName) {
                throw new Error(`Unknown widget type: ${args.widgetType}`);
            }
            // Update timestamp in registry
            widgetRegistry_1.widgetRegistry.updateDatasetTimestamp(datasetName);
            // Publish update event
            await context.pubsub.publish(pubsub_1.SUBSCRIPTION_EVENTS.WIDGET_UPDATED, {
                widgetUpdated: {
                    widgetType: args.widgetType,
                    data: JSON.stringify({ refreshed: true, timestamp: new Date() }),
                    timestamp: new Date().toISOString()
                }
            });
            console.log(`✅ Widget ${args.widgetType} refreshed successfully`);
            return true;
        }
        catch (error) {
            console.error(`❌ Error refreshing widget ${args.widgetType}:`, error);
            throw new Error(`Failed to refresh widget: ${args.widgetType}`);
        }
    }
};
// Subscription Resolvers
const Subscription = {
    widgetUpdated: {
        subscribe: (_, args, context) => {
            console.log(`🔔 Client subscribed to widget updates${args.widgetType ? ` for ${args.widgetType}` : ' (all widgets)'}`);
            if (args.widgetType) {
                // Filter by specific widget type
                return context.pubsub.asyncIterator([pubsub_1.SUBSCRIPTION_EVENTS.WIDGET_UPDATED]);
            }
            return context.pubsub.asyncIterator([pubsub_1.SUBSCRIPTION_EVENTS.WIDGET_UPDATED]);
        }
    },
    datasetRefreshed: {
        subscribe: (_, args, context) => {
            console.log(`🔔 Client subscribed to dataset updates${args.datasetName ? ` for ${args.datasetName}` : ' (all datasets)'}`);
            return context.pubsub.asyncIterator([pubsub_1.SUBSCRIPTION_EVENTS.DATASET_REFRESHED]);
        }
    },
    webhookReceived: {
        subscribe: (_, args, context) => {
            console.log(`🔔 Client subscribed to webhook events${args.source ? ` for ${args.source}` : ' (all sources)'}`);
            return context.pubsub.asyncIterator([pubsub_1.SUBSCRIPTION_EVENTS.WEBHOOK_RECEIVED]);
        }
    }
};
// Export all resolvers
exports.resolvers = {
    DateTime: DateTimeScalar,
    Query,
    Mutation,
    Subscription
};
//# sourceMappingURL=index.js.map