/**
 * Pub/Sub System - Issue #5
 *
 * Centralized publish/subscribe system for real-time widget updates
 */
import { PubSub } from 'graphql-subscriptions';
export declare const pubsub: PubSub;
export declare const SUBSCRIPTION_EVENTS: {
    WIDGET_UPDATED: string;
    DATASET_REFRESHED: string;
    WEBHOOK_RECEIVED: string;
};
export declare const publishWidgetUpdate: (widgetType: string, data: string) => Promise<void>;
export declare const publishDatasetRefresh: (datasetName: string, affectedWidgets: string[]) => Promise<void>;
export declare const publishWebhookReceived: (source: string, payload: string) => Promise<void>;
//# sourceMappingURL=pubsub.d.ts.map