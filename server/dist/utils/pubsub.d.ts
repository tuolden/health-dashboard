/**
 * Pub/Sub System - Simplified
 *
 * Note: Real-time WebSocket functionality removed.
 * Keeping minimal PubSub for GraphQL compatibility.
 */
import { PubSub } from 'graphql-subscriptions';
export declare const pubsub: PubSub;
export declare const publishDatasetRefresh: (datasetName: string, affectedWidgets: string[]) => void;
export declare const publishWidgetUpdate: (widgetType: string, _data: string) => void;
export declare const publishWebhookReceived: (source: string, _payload: string) => void;
//# sourceMappingURL=pubsub.d.ts.map