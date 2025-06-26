"use strict";
/**
 * Pub/Sub System - Simplified
 *
 * Note: Real-time WebSocket functionality removed.
 * Keeping minimal PubSub for GraphQL compatibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishWebhookReceived = exports.publishWidgetUpdate = exports.publishDatasetRefresh = exports.pubsub = void 0;
const graphql_subscriptions_1 = require("graphql-subscriptions");
// Create singleton PubSub instance for GraphQL compatibility
exports.pubsub = new graphql_subscriptions_1.PubSub();
// Note: Subscription events removed - using simple auto-refresh instead
// Placeholder functions for compatibility (no-op)
const publishDatasetRefresh = (datasetName, affectedWidgets) => {
    console.log(`📡 Dataset refresh (no-op): ${datasetName}, widgets: ${affectedWidgets.join(', ')}`);
};
exports.publishDatasetRefresh = publishDatasetRefresh;
const publishWidgetUpdate = (widgetType, _data) => {
    console.log(`📡 Widget update (no-op): ${widgetType}`);
};
exports.publishWidgetUpdate = publishWidgetUpdate;
const publishWebhookReceived = (source, _payload) => {
    console.log(`📡 Webhook received (no-op): ${source}`);
};
exports.publishWebhookReceived = publishWebhookReceived;
//# sourceMappingURL=pubsub.js.map