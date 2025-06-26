/**
 * Pub/Sub System - Simplified
 *
 * Note: Real-time WebSocket functionality removed.
 * Keeping minimal PubSub for GraphQL compatibility.
 */

import { PubSub } from 'graphql-subscriptions'

// Create singleton PubSub instance for GraphQL compatibility
export const pubsub = new PubSub()

// Note: Subscription events removed - using simple auto-refresh instead

// Placeholder functions for compatibility (no-op)
export const publishDatasetRefresh = (datasetName: string, affectedWidgets: string[]) => {
  console.log(`📡 Dataset refresh (no-op): ${datasetName}, widgets: ${affectedWidgets.join(', ')}`)
}

export const publishWidgetUpdate = (widgetType: string, _data: string) => {
  console.log(`📡 Widget update (no-op): ${widgetType}`)
}

export const publishWebhookReceived = (source: string, _payload: string) => {
  console.log(`📡 Webhook received (no-op): ${source}`)
}
