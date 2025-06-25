/**
 * Health Dashboard GraphQL Server - Issue #5 + #7
 * 
 * Main server entry point with Apollo Server, Express, WebSocket support
 * for real-time widget updates, webhook integration, and CPAP REST API.
 */

import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import { makeExecutableSchema } from '@graphql-tools/schema'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { typeDefs } from './graphql/schema'
import { resolvers } from './graphql/resolvers'
import { setupWebhooks } from './webhooks/handler'
import { pubsub } from './utils/pubsub'
import { testCpapConnection } from './database/cpapDatabase'
import cpapRoutes from './routes/cpapRoutes'
import workoutRoutes from './routes/workoutRoutes'
import scaleRoutes from './routes/scaleRoutes'

const PORT = process.env['PORT'] || 4000
const FRONTEND_URL = process.env['FRONTEND_URL'] || 'http://localhost:3000'

async function startServer() {
  console.log('🚀 Starting Health Dashboard GraphQL Server...')

  // Test CPAP database connection on startup
  console.log('🔌 Testing CPAP database connection...')
  await testCpapConnection()

  // Create Express app
  const app = express()

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allow GraphQL Playground
    crossOriginEmbedderPolicy: false
  }))

  // CORS configuration - Allow development and production origins
  const allowedOrigins = [
    FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'https://dashboard.home',
    'http://dashboard.home'
  ]

  app.use(cors({
    origin: allowedOrigins,
    credentials: true
  }))

  console.log('🌐 CORS configured for origins:', allowedOrigins)

  // JSON body parsing middleware
  app.use(express.json({ limit: '10mb' }))

  // Create HTTP server
  const httpServer = createServer(app)

  // Create executable schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  })

  // Create WebSocket server for GraphQL subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  })

  // Create WebSocket server for widget push notifications - Issue #8
  const widgetWsServer = new WebSocketServer({
    server: httpServer,
    path: '/ws'
  })

  // Handle widget WebSocket connections
  widgetWsServer.on('connection', (ws, req) => {
    console.log('🔌 Widget WebSocket client connected from:', req.socket.remoteAddress)

    // Send welcome message
    ws.send(JSON.stringify({
      event: 'connected',
      message: 'Widget WebSocket connection established',
      timestamp: new Date().toISOString()
    }))

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        console.log('📨 Widget WebSocket message received:', message)

        // Echo back for testing
        if (message.event === 'ping') {
          ws.send(JSON.stringify({
            event: 'pong',
            timestamp: new Date().toISOString()
          }))
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
      }
    })

    // Handle connection close
    ws.on('close', () => {
      console.log('🔌 Widget WebSocket client disconnected')
    })

    // Handle errors
    ws.on('error', (error) => {
      console.error('❌ Widget WebSocket error:', error)
    })
  })

  // Function to broadcast widget refresh messages
  const broadcastWidgetRefresh = (widgetType: string, data?: any) => {
    const message = {
      event: 'newDataFor',
      widgetType,
      data,
      timestamp: new Date().toISOString()
    }

    console.log('📡 Broadcasting widget refresh:', message)

    widgetWsServer.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  // Store broadcast function for use in routes
  app.locals['broadcastWidgetRefresh'] = broadcastWidgetRefresh

  // Set up GraphQL WebSocket server
  const serverDispose = useServer({
    schema,
    context: async () => ({
      pubsub
    })
  }, wsServer)

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      // Proper shutdown for HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverDispose.dispose()
            }
          }
        }
      }
    ],
    // Enable introspection and playground in development
    introspection: process.env['NODE_ENV'] !== 'production',
    includeStacktraceInErrorResponses: process.env['NODE_ENV'] !== 'production'
  })

  // Start Apollo Server
  await server.start()

  // Apply GraphQL middleware
  app.use('/graphql', 
    express.json({ limit: '10mb' }),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        pubsub,
        req
      })
    })
  )

  // Setup webhook endpoints
  setupWebhooks(app, pubsub)

  // CPAP REST API routes - Issue #7
  app.use('/api/cpap', cpapRoutes)

  // Workout REST API routes - Issue #9
  app.use('/api/workouts', workoutRoutes)

  // HUME Scale REST API routes - Issue #11
  app.use('/api/scale', scaleRoutes)

  // Test endpoint for triggering widget refresh - Issue #8
  app.post('/api/test/refresh-widget', (req, res) => {
    const { widgetType = 'cpap', data } = req.body

    console.log(`🧪 Test endpoint: Triggering refresh for widget type: ${widgetType}`)

    if (app.locals['broadcastWidgetRefresh']) {
      app.locals['broadcastWidgetRefresh'](widgetType, data)
      res.json({
        success: true,
        message: `Refresh triggered for widget type: ${widgetType}`,
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Broadcast function not available'
      })
    }
  })

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'health-dashboard-graphql'
    })
  })

  // API documentation endpoint
  app.get('/api', (_req, res) => {
    res.json({
      service: 'Health Dashboard API',
      version: '1.0.0',
      endpoints: {
        graphql: '/graphql',
        websocket: 'ws://localhost:' + PORT + '/graphql',
        widgetWebSocket: 'ws://localhost:' + PORT + '/ws',
        webhooks: '/api/webhook/*',
        cpap: {
          dailySummary: '/api/cpap/daily-summary',
          spo2Trend: '/api/cpap/spo2-trend',
          spo2Pulse: '/api/cpap/spo2-pulse',
          leakRate: '/api/cpap/leak-rate',
          sleepSessions: '/api/cpap/sleep-sessions',
          health: '/api/cpap/health',
          raw: '/api/cpap/raw'
        },
        workouts: {
          summary: '/api/workouts/summary',
          sessions: '/api/workouts/sessions',
          zones: '/api/workouts/zones',
          sports: '/api/workouts/sports',
          health: '/api/workouts/health',
          raw: '/api/workouts/raw'
        },
        scale: {
          weightSessions: '/api/scale/weight-sessions',
          weightSessionsSummary: '/api/scale/weight-sessions/summary',
          healthSnapshot: '/api/scale/health-snapshot',
          weightDelta: '/api/scale/weight-delta',
          health: '/api/scale/health',
          raw: '/api/scale/raw'
        },
        health: '/health'
      },
      documentation: 'See GitHub Issue #7 for CPAP API details, Issue #9 for Workout API details, Issue #11 for Scale API details'
    })
  })

  // Start HTTP server
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, resolve)
  })

  console.log(`🎯 GraphQL Server ready at http://localhost:${PORT}/graphql`)
  console.log(`🔗 GraphQL WebSocket ready at ws://localhost:${PORT}/graphql`)
  console.log(`🔄 Widget WebSocket ready at ws://localhost:${PORT}/ws`)
  console.log(`📡 Webhook endpoints ready at http://localhost:${PORT}/api/webhook/*`)
  console.log(`🩺 CPAP REST API ready at http://localhost:${PORT}/api/cpap/*`)
  console.log(`📋 API documentation at http://localhost:${PORT}/api`)
  console.log(`💚 Health check available at http://localhost:${PORT}/health`)
}

// Start server with error handling
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})
