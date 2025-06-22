"use strict";
/**
 * Health Dashboard GraphQL Server - Issue #5
 *
 * Main server entry point with Apollo Server, Express, and WebSocket support
 * for real-time widget updates and webhook integration.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const http_1 = require("http");
const ws_1 = require("ws");
const ws_2 = require("graphql-ws/lib/use/ws");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const schema_1 = require("./graphql/schema");
const resolvers_1 = require("./graphql/resolvers");
const handler_1 = require("./webhooks/handler");
const pubsub_1 = require("./utils/pubsub");
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
async function startServer() {
    console.log('🚀 Starting Health Dashboard GraphQL Server...');
    // Create Express app
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Allow GraphQL Playground
        crossOriginEmbedderPolicy: false
    }));
    // CORS configuration
    app.use((0, cors_1.default)({
        origin: [FRONTEND_URL, 'http://localhost:3000'],
        credentials: true
    }));
    // JSON body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    // Create HTTP server
    const httpServer = (0, http_1.createServer)(app);
    // Create WebSocket server for subscriptions
    const wsServer = new ws_1.WebSocketServer({
        server: httpServer,
        path: '/graphql'
    });
    // Create Apollo Server
    const server = new server_1.ApolloServer({
        typeDefs: schema_1.typeDefs,
        resolvers: resolvers_1.resolvers,
        plugins: [
            // Proper shutdown for HTTP server
            (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
            // Proper shutdown for WebSocket server
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverDispose.dispose();
                        }
                    };
                }
            }
        ],
        // Enable introspection and playground in development
        introspection: process.env.NODE_ENV !== 'production',
        includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production'
    });
    // Set up GraphQL WebSocket server
    const serverDispose = (0, ws_2.useServer)({
        schema: server.schema,
        context: async () => ({
            pubsub: pubsub_1.pubsub
        })
    }, wsServer);
    // Start Apollo Server
    await server.start();
    // Apply GraphQL middleware
    app.use('/graphql', express_1.default.json({ limit: '10mb' }), (0, express4_1.expressMiddleware)(server, {
        context: async ({ req }) => ({
            pubsub: pubsub_1.pubsub,
            req
        })
    }));
    // Setup webhook endpoints
    (0, handler_1.setupWebhooks)(app, pubsub_1.pubsub);
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'health-dashboard-graphql'
        });
    });
    // Start HTTP server
    await new Promise((resolve) => {
        httpServer.listen(PORT, resolve);
    });
    console.log(`🎯 GraphQL Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🔗 WebSocket Server ready at ws://localhost:${PORT}/graphql`);
    console.log(`📡 Webhook endpoints ready at http://localhost:${PORT}/api/webhook/*`);
    console.log(`💚 Health check available at http://localhost:${PORT}/health`);
}
// Start server with error handling
startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
//# sourceMappingURL=index.js.map