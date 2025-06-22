/**
 * Webhook Handler System - Issue #5
 *
 * Handles incoming webhook requests from K3s batch jobs and routes them
 * to appropriate widgets via the registry system
 */
import { Express } from 'express';
import { PubSub } from 'graphql-subscriptions';
/**
 * Setup webhook endpoints on Express app
 */
export declare const setupWebhooks: (app: Express, pubsub: PubSub) => void;
//# sourceMappingURL=handler.d.ts.map