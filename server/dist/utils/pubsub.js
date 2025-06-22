"use strict";
/**
 * Pub/Sub System - Issue #5
 *
 * Centralized publish/subscribe system for real-time widget updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishWebhookReceived = exports.publishDatasetRefresh = exports.publishWidgetUpdate = exports.SUBSCRIPTION_EVENTS = exports.pubsub = void 0;
const graphql_subscriptions_1 = require("graphql-subscriptions");
// Create singleton PubSub instance
exports.pubsub = new graphql_subscriptions_1.PubSub();
// Subscription event types
exports.SUBSCRIPTION_EVENTS = {
    WIDGET_UPDATED: 'WIDGET_UPDATED',
    DATASET_REFRESHED: 'DATASET_REFRESHED',
    WEBHOOK_RECEIVED: 'WEBHOOK_RECEIVED'
};
// Helper functions for publishing events
const publishWidgetUpdate = (widgetType, data) => {
    return exports.pubsub.publish(exports.SUBSCRIPTION_EVENTS.WIDGET_UPDATED, {
        widgetUpdated: {
            widgetType,
            data,
            timestamp: new Date().toISOString()
        }
    });
};
exports.publishWidgetUpdate = publishWidgetUpdate;
const publishDatasetRefresh = (datasetName, affectedWidgets) => {
    return exports.pubsub.publish(exports.SUBSCRIPTION_EVENTS.DATASET_REFRESHED, {
        datasetRefreshed: {
            datasetName,
            affectedWidgets,
            timestamp: new Date().toISOString()
        }
    });
};
exports.publishDatasetRefresh = publishDatasetRefresh;
const publishWebhookReceived = (source, payload) => {
    return exports.pubsub.publish(exports.SUBSCRIPTION_EVENTS.WEBHOOK_RECEIVED, {
        webhookReceived: {
            source,
            payload,
            timestamp: new Date().toISOString()
        }
    });
};
exports.publishWebhookReceived = publishWebhookReceived;
//# sourceMappingURL=pubsub.js.map