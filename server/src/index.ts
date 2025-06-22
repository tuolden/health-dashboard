/**
 * Health Dashboard GraphQL Server - Issue #5
 * 
 * Main server entry point with Apollo Server, Express, and WebSocket support
 * for real-time widget updates and webhook integration.
 */

import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { typeDefs } from './graphql/schema'
import { resolvers } from './graphql/resolvers'
import { setupWebhooks } from './webhooks/handler'
import { pubsub } from './utils/pubsub'
import { ContextValue } from './types/context'

const PORT = process.env.PORT || 4000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

async function startServer() {
  console.log('🚀 Starting Health Dashboard GraphQL Server...')

  // Create Express app
  const app = express()
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allow GraphQL Playground
    crossOriginEmbedderPolicy: false
  }))
  
  // CORS configuration
  app.use(cors({
    origin: [FRONTEND_URL, 'http://localhost:3000'],
    credentials: true
  }))

  // JSON body parsing middleware
  app.use(express.json({ limit: '10mb' }))

  // Create HTTP server
  const httpServer = createServer(app)

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  })

  // Create Apollo Server
  const server = new ApolloServer<ContextValue>({
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
    introspection: process.env.NODE_ENV !== 'production',
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production'
  })

  // Set up GraphQL WebSocket server
  const serverDispose = useServer(
    {
      schema: server.schema,
      context: async () => ({
        pubsub
      })
    },
    wsServer
  )

  // Start Apollo Server
  await server.start()

  // Apply GraphQL middleware
  app.use(
    '/graphql',
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

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'health-dashboard-graphql'
    })
  })

  // Start HTTP server
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, resolve)
  })

  console.log(`🎯 GraphQL Server ready at http://localhost:${PORT}/graphql`)
  console.log(`🔗 WebSocket Server ready at ws://localhost:${PORT}/graphql`)
  console.log(`📡 Webhook endpoints ready at http://localhost:${PORT}/api/webhook/*`)
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
