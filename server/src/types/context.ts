/**
 * GraphQL Context Types - Issue #5
 * 
 * TypeScript definitions for GraphQL context and request handling
 */

import { Request } from 'express'
import { PubSub } from 'graphql-subscriptions'

export interface ContextValue {
  pubsub: PubSub
  req?: Request
}

export interface WebhookContext {
  source: string
  timestamp: Date
  payload: any
}
