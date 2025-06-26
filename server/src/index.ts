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
import { testBloodworkConnection, initializeBloodworkTables } from './database/bloodworkDatabase'
import cpapRoutes from './routes/cpapRoutes'
import workoutRoutes from './routes/workoutRoutes'
import scaleRoutes from './routes/scaleRoutes'
import bloodworkRoutes from './routes/bloodworkRoutes'

const PORT = process.env['PORT'] || 4000
const FRONTEND_URL = process.env['FRONTEND_URL'] || 'http://localhost:3000'

async function startServer() {
  console.log('🚀 Starting Health Dashboard GraphQL Server...')

  // Test database connections on startup
  console.log('🔌 Testing CPAP database connection...')
  await testCpapConnection()

  console.log('🧬 Testing Bloodwork database connection...')
  await testBloodworkConnection()

  console.log('🧬 Initializing Bloodwork database tables...')
  await initializeBloodworkTables()

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

  // Note: WebSocket functionality removed - using simple auto-refresh instead

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

  // Bloodwork Lab REST API routes - Issue #13
  app.use('/api/labs', bloodworkRoutes)

  // Note: Widget refresh test endpoint removed - using auto-refresh instead

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
        labs: {
          summary: '/api/labs/summary/:date',
          results: '/api/labs/results',
          latest: '/api/labs/latest',
          trends: '/api/labs/trends/:testName',
          metrics: '/api/labs/metrics',
          dates: '/api/labs/dates',
          health: '/api/labs/health'
        },
        health: '/health'
      },
      documentation: 'See GitHub Issue #7 for CPAP API details, Issue #9 for Workout API details, Issue #11 for Scale API details, Issue #13 for Bloodwork Lab API details'
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
