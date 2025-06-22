/**
 * Pub/Sub System - Issue #5
 *
 * Centralized publish/subscribe system for real-time widget updates
 */
import { PubSub } from 'graphql-subscriptions';
export declare const pubsub: PubSub;
export declare const SUBSCRIPTION_EVENTS: {
    readonly WIDGET_UPDATED: "WIDGET_UPDATED";
    readonly DATASET_REFRESHED: "DATASET_REFRESHED";
    readonly WEBHOOK_RECEIVED: "WEBHOOK_RECEIVED";
};
export type SubscriptionEvent = typeof SUBSCRIPTION_EVENTS[keyof typeof SUBSCRIPTION_EVENTS];
export declare const publishWidgetUpdate: (widgetType: string, data: any) => Promise<void>;
export declare const publishDatasetRefresh: (datasetName: string, affectedWidgets: string[]) => Promise<void>;
export declare const publishWebhookReceived: (source: string, payload: any) => Promise<void>;
//# sourceMappingURL=pubsub.d.ts.map