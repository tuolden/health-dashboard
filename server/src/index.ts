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

  // CORS configuration - Allow both 3000 and 3001 for development
  app.use(cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }))

  console.log('🌐 CORS configured for origins:', [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'])

  // JSON body parsing middleware
  app.use(express.json({ limit: '10mb' }))

  // Create HTTP server
  const httpServer = createServer(app)

  // Create executable schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  })

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  })

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
        health: '/health'
      },
      documentation: 'See GitHub Issue #7 for CPAP API details'
    })
  })

  // Start HTTP server
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, resolve)
  })

  console.log(`🎯 GraphQL Server ready at http://localhost:${PORT}/graphql`)
  console.log(`🔗 WebSocket Server ready at ws://localhost:${PORT}/graphql`)
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
