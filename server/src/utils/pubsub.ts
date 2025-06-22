/**
 * Pub/Sub System - Issue #5
 * 
 * Centralized publish/subscribe system for real-time widget updates
 */

import { PubSub } from 'graphql-subscriptions'

// Create singleton PubSub instance
export const pubsub = new PubSub()

// Subscription event types
export const SUBSCRIPTION_EVENTS = {
  WIDGET_UPDATED: 'WIDGET_UPDATED',
  DATASET_REFRESHED: 'DATASET_REFRESHED',
  WEBHOOK_RECEIVED: 'WEBHOOK_RECEIVED'
} as const

export type SubscriptionEvent = typeof SUBSCRIPTION_EVENTS[keyof typeof SUBSCRIPTION_EVENTS]

// Helper functions for publishing events
export const publishWidgetUpdate = (widgetType: string, data: any) => {
  return pubsub.publish(SUBSCRIPTION_EVENTS.WIDGET_UPDATED, {
    widgetUpdated: {
      widgetType,
      data,
      timestamp: new Date().toISOString()
    }
  })
}

export const publishDatasetRefresh = (datasetName: string, affectedWidgets: string[]) => {
  return pubsub.publish(SUBSCRIPTION_EVENTS.DATASET_REFRESHED, {
    datasetRefreshed: {
      datasetName,
      affectedWidgets,
      timestamp: new Date().toISOString()
    }
  })
}

export const publishWebhookReceived = (source: string, payload: any) => {
  return pubsub.publish(SUBSCRIPTION_EVENTS.WEBHOOK_RECEIVED, {
    webhookReceived: {
      source,
      payload,
      timestamp: new Date().toISOString()
    }
  })
}
