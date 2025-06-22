"use strict";
/**
 * Health Dashboard GraphQL Server - Issue #5 + #7
 *
 * Main server entry point with Apollo Server, Express, WebSocket support
 * for real-time widget updates, webhook integration, and CPAP REST API.
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
const schema_1 = require("@graphql-tools/schema");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const schema_2 = require("./graphql/schema");
const resolvers_1 = require("./graphql/resolvers");
const handler_1 = require("./webhooks/handler");
const pubsub_1 = require("./utils/pubsub");
const cpapDatabase_1 = require("./database/cpapDatabase");
const cpapRoutes_1 = __importDefault(require("./routes/cpapRoutes"));
const PORT = process.env['PORT'] || 4000;
const FRONTEND_URL = process.env['FRONTEND_URL'] || 'http://localhost:3000';
async function startServer() {
    console.log('🚀 Starting Health Dashboard GraphQL Server...');
    // Test CPAP database connection on startup
    console.log('🔌 Testing CPAP database connection...');
    await (0, cpapDatabase_1.testCpapConnection)();
    // Create Express app
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Allow GraphQL Playground
        crossOriginEmbedderPolicy: false
    }));
    // CORS configuration - Allow development and production origins
    const allowedOrigins = [
        FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://dashboard.home',
        'http://dashboard.home'
    ];
    app.use((0, cors_1.default)({
        origin: allowedOrigins,
        credentials: true
    }));
    console.log('🌐 CORS configured for origins:', allowedOrigins);
    // JSON body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    // Create HTTP server
    const httpServer = (0, http_1.createServer)(app);
    // Create executable schema
    const schema = (0, schema_1.makeExecutableSchema)({
        typeDefs: schema_2.typeDefs,
        resolvers: resolvers_1.resolvers
    });
    // Create WebSocket server for GraphQL subscriptions
    const wsServer = new ws_1.WebSocketServer({
        server: httpServer,
        path: '/graphql'
    });
    // Create WebSocket server for widget push notifications - Issue #8
    const widgetWsServer = new ws_1.WebSocketServer({
        server: httpServer,
        path: '/ws'
    });
    // Handle widget WebSocket connections
    widgetWsServer.on('connection', (ws, req) => {
        console.log('🔌 Widget WebSocket client connected from:', req.socket.remoteAddress);
        // Send welcome message
        ws.send(JSON.stringify({
            event: 'connected',
            message: 'Widget WebSocket connection established',
            timestamp: new Date().toISOString()
        }));
        // Handle incoming messages
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Widget WebSocket message received:', message);
                // Echo back for testing
                if (message.event === 'ping') {
                    ws.send(JSON.stringify({
                        event: 'pong',
                        timestamp: new Date().toISOString()
                    }));
                }
            }
            catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
            }
        });
        // Handle connection close
        ws.on('close', () => {
            console.log('🔌 Widget WebSocket client disconnected');
        });
        // Handle errors
        ws.on('error', (error) => {
            console.error('❌ Widget WebSocket error:', error);
        });
    });
    // Function to broadcast widget refresh messages
    const broadcastWidgetRefresh = (widgetType, data) => {
        const message = {
            event: 'newDataFor',
            widgetType,
            data,
            timestamp: new Date().toISOString()
        };
        console.log('📡 Broadcasting widget refresh:', message);
        widgetWsServer.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    };
    // Store broadcast function for use in routes
    app.locals['broadcastWidgetRefresh'] = broadcastWidgetRefresh;
    // Set up GraphQL WebSocket server
    const serverDispose = (0, ws_2.useServer)({
        schema,
        context: async () => ({
            pubsub: pubsub_1.pubsub
        })
    }, wsServer);
    // Create Apollo Server
    const server = new server_1.ApolloServer({
        typeDefs: schema_2.typeDefs,
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
        introspection: process.env['NODE_ENV'] !== 'production',
        includeStacktraceInErrorResponses: process.env['NODE_ENV'] !== 'production'
    });
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
    // CPAP REST API routes - Issue #7
    app.use('/api/cpap', cpapRoutes_1.default);
    // Test endpoint for triggering widget refresh - Issue #8
    app.post('/api/test/refresh-widget', (req, res) => {
        const { widgetType = 'cpap', data } = req.body;
        console.log(`🧪 Test endpoint: Triggering refresh for widget type: ${widgetType}`);
        if (app.locals['broadcastWidgetRefresh']) {
            app.locals['broadcastWidgetRefresh'](widgetType, data);
            res.json({
                success: true,
                message: `Refresh triggered for widget type: ${widgetType}`,
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Broadcast function not available'
            });
        }
    });
    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'health-dashboard-graphql'
        });
    });
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
                health: '/health'
            },
            documentation: 'See GitHub Issue #7 for CPAP API details'
        });
    });
    // Start HTTP server
    await new Promise((resolve) => {
        httpServer.listen(PORT, resolve);
    });
    console.log(`🎯 GraphQL Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🔗 GraphQL WebSocket ready at ws://localhost:${PORT}/graphql`);
    console.log(`🔄 Widget WebSocket ready at ws://localhost:${PORT}/ws`);
    console.log(`📡 Webhook endpoints ready at http://localhost:${PORT}/api/webhook/*`);
    console.log(`🩺 CPAP REST API ready at http://localhost:${PORT}/api/cpap/*`);
    console.log(`📋 API documentation at http://localhost:${PORT}/api`);
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