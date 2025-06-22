/**
 * Webhook Handler System - Issue #5
 * 
 * Handles incoming webhook requests from K3s batch jobs and routes them
 * to appropriate widgets via the registry system
 */

import { Express, Request, Response } from 'express'
import Joi from 'joi'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { isValidDataset, getAffectedWidgets, widgetRegistry } from '../graphql/widgetRegistry'
import { publishDatasetRefresh, publishWidgetUpdate, publishWebhookReceived } from '../utils/pubsub'

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
})

// Webhook payload validation schema
const webhookPayloadSchema = Joi.object({
  source: Joi.string().required().min(1).max(100),
  dataset: Joi.string().required().min(1).max(100),
  timestamp: Joi.date().iso().optional(),
  data: Joi.object().required(),
  metadata: Joi.object().optional(),
  batchJobId: Joi.string().optional(),
  version: Joi.string().optional()
})

// Webhook authentication (simple token-based for now)
const WEBHOOK_SECRET = process.env['WEBHOOK_SECRET'] || 'health-dashboard-webhook-secret'

/**
 * Authenticate webhook request
 */
const authenticateWebhook = (req: Request): boolean => {
  const authHeader = req.headers.authorization
  const providedSecret = req.headers['x-webhook-secret'] as string

  // Check for Bearer token or webhook secret header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return token === WEBHOOK_SECRET
  }

  if (providedSecret) {
    return providedSecret === WEBHOOK_SECRET
  }

  return false
}

/**
 * Process webhook payload and trigger updates
 */
const processWebhookPayload = async (payload: any, _pubsub: any) => {
  const { source, dataset, data, timestamp, metadata, batchJobId } = payload

  console.log(`📡 Processing webhook from ${source} for dataset: ${dataset}`)

  // Validate dataset exists in registry
  if (!isValidDataset(dataset)) {
    throw new Error(`Unknown dataset: ${dataset}`)
  }

  // Get affected widgets
  const affectedWidgets = getAffectedWidgets(dataset)
  console.log(`🎯 Affected widgets: [${affectedWidgets.join(', ')}]`)

  // Update registry timestamp
  widgetRegistry.updateDatasetTimestamp(dataset)

  // Publish dataset refresh event
  await publishDatasetRefresh(dataset, affectedWidgets)

  // Publish individual widget updates
  for (const widgetType of affectedWidgets) {
    await publishWidgetUpdate(widgetType, JSON.stringify({
      source,
      dataset,
      data,
      timestamp: timestamp || new Date().toISOString(),
      metadata,
      batchJobId
    }))
  }

  // Publish webhook received event
  await publishWebhookReceived(source, JSON.stringify(payload))

  console.log(`✅ Webhook processed successfully: ${affectedWidgets.length} widgets updated`)
}

/**
 * Generic webhook handler
 */
const handleWebhook = async (req: Request, res: Response, pubsub: any) => {
  try {
    // Rate limiting
    try {
      await rateLimiter.consume(req.ip || 'unknown')
    } catch (rateLimiterRes: any) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}`)
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000)
      })
      return
    }

    // Authentication
    if (!authenticateWebhook(req)) {
      console.warn(`🚫 Unauthorized webhook attempt from IP: ${req.ip}`)
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook authentication'
      })
      return
    }

    // Validate payload
    const { error, value } = webhookPayloadSchema.validate(req.body)
    if (error) {
      console.warn(`❌ Invalid webhook payload:`, error.details)
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid webhook payload',
        details: error.details
      })
      return
    }

    const payload = value

    // Process webhook
    await processWebhookPayload(payload, pubsub)

    // Success response
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      dataset: payload.dataset,
      affectedWidgets: getAffectedWidgets(payload.dataset),
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process webhook',
      details: process.env['NODE_ENV'] === 'development' ? error.message : undefined
    })
  }
}

/**
 * Setup webhook endpoints on Express app
 */
export const setupWebhooks = (app: Express, pubsub: any) => {
  console.log('🔗 Setting up webhook endpoints...')

  // Middleware for webhook routes (only for POST requests)
  app.use('/api/webhook', (req, res, next) => {
    // Log incoming webhook
    console.log(`📡 Incoming webhook: ${req.method} ${req.path} from ${req.ip}`)

    // Skip content-type check for GET requests
    if (req.method === 'GET') {
      next()
      return
    }

    // Parse JSON with larger limit for webhook payloads
    if (req.headers['content-type']?.includes('application/json')) {
      next()
    } else {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Content-Type must be application/json'
      })
    }
  })

  // Generic webhook endpoint with source parameter
  app.post('/api/webhook/:source', async (req, res) => {
    const source = req.params.source
    console.log(`📡 Webhook from source: ${source}`)

    // Add source to payload if not present
    if (!req.body.source) {
      req.body.source = source
    }

    await handleWebhook(req, res, pubsub)
  })

  // Specific dataset webhook endpoints
  app.post('/api/webhook/dataset/:dataset', async (req, res) => {
    const dataset = req.params.dataset
    console.log(`📡 Direct dataset webhook: ${dataset}`)

    // Add dataset to payload if not present
    if (!req.body.dataset) {
      req.body.dataset = dataset
    }

    // Default source if not provided
    if (!req.body.source) {
      req.body.source = `dataset-${dataset}`
    }

    await handleWebhook(req, res, pubsub)
  })

  // Webhook status endpoint
  app.get('/api/webhook/status', (_req, res) => {
    const stats = widgetRegistry.getStats()
    
    res.json({
      status: 'active',
      webhookEndpoints: [
        '/api/webhook/:source',
        '/api/webhook/dataset/:dataset'
      ],
      registryStats: stats,
      rateLimiting: {
        pointsPerMinute: 100,
        currentTime: new Date().toISOString()
      }
    })
  })

  console.log('✅ Webhook endpoints configured:')
  console.log('   POST /api/webhook/:source')
  console.log('   POST /api/webhook/dataset/:dataset')
  console.log('   GET  /api/webhook/status')
}
