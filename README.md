# Health Dashboard - CPAP Monitoring System

A comprehensive health dashboard with real-time CPAP machine data monitoring, built with React, TypeScript, and a full-stack backend. Features live health widgets displaying oxygen saturation, pulse rates, leak detection, and sleep pattern analysis.

## 🎯 Features

### 🏥 CPAP Health Widgets
- **SpO2 Trend Widget**: Real-time oxygen saturation monitoring with trend analysis
- **SpO2 & Pulse Widget**: Heart rate and oxygen correlation with health indicators
- **Leak Rate Widget**: CPAP mask leak detection with severity alerts
- **Sleep Session Widget**: Sleep pattern tracking and bedtime consistency analysis

### 🔧 Technical Features
- **Real-time Data**: Live updates from CPAP machine database
- **Responsive Design**: Optimized for vertical/portrait screens
- **Dark Mode**: Automatic dark/light mode based on time of day
- **REST API**: Full backend API for health data access
- **GraphQL**: Advanced querying with WebSocket subscriptions
- **Database Integration**: PostgreSQL connection to CPAP health data

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript and Vite
- **Tailwind CSS** for responsive styling
- **Recharts** for health data visualization
- **Zustand** for state management
- **Docker** containerization with Nginx

### Backend
- **Node.js/TypeScript** with Express server
- **Apollo Server** for GraphQL with WebSocket support
- **PostgreSQL** database with CPAP health data
- **CORS** configuration for cross-origin requests
- **Docker** multi-stage builds for production

### Infrastructure
- **Kubernetes** deployment with ArgoCD
- **Ingress** routing: `dashboard.home` (frontend) + `api.dashboard.home` (backend)
- **Health checks** and monitoring endpoints
- **Horizontal scaling** support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Kubernetes cluster (optional)
- PostgreSQL with CPAP data (for full functionality)

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/tuolden/health-dashboard.git
cd health-dashboard
```

2. **Start the frontend:**
```bash
npm install
npm run dev
```

3. **Start the backend:**
```bash
cd server
npm install
npm run dev
```

4. **Access the dashboard:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:4000/api](http://localhost:4000/api)
- GraphQL Playground: [http://localhost:4000/graphql](http://localhost:4000/graphql)

### Docker Deployment

```bash
# Build and run frontend
docker build -t health-dashboard .
docker run -p 3000:5301 health-dashboard

# Build and run backend
cd server
docker build -t health-dashboard-api .
docker run -p 4000:4000 health-dashboard-api
```

### Kubernetes Deployment

```bash
# Deploy frontend
kubectl apply -f kubernetes/

# Deploy backend
kubectl apply -f server/kubernetes/
```

## 📊 API Endpoints

### CPAP Health API
- `GET /api/cpap/health` - Database health and statistics
- `GET /api/cpap/spo2-trend` - SpO2 trend data with date filtering
- `GET /api/cpap/spo2-pulse` - SpO2 and pulse correlation analysis
- `GET /api/cpap/leak-rate` - CPAP leak rate monitoring
- `GET /api/cpap/sleep-sessions` - Sleep session tracking

### GraphQL Schema
```graphql
type Query {
  healthWidgets: [HealthWidget!]!
  cpapData(startDate: String, endDate: String): CpapData
}

type Subscription {
  widgetUpdated: HealthWidget!
}
```

## 🗄️ Database Schema

The system connects to a PostgreSQL database with CPAP health data:

```sql
-- Example CPAP data structure
CREATE TABLE cpap_sessions (
  id SERIAL PRIMARY KEY,
  session_date DATE,
  session_start TIMESTAMP,
  spo2_avg DECIMAL,
  pulse_rate_avg DECIMAL,
  leak_rate DECIMAL,
  -- Additional CPAP metrics...
);
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```

**Backend (.env):**
```env
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/cpap_db
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## 📱 Widget System

### Widget Architecture
Each CPAP widget is a self-contained React component with:
- **Data fetching** with error handling and loading states
- **Real-time updates** via API polling or WebSocket subscriptions
- **Interactive charts** with zoom, filter, and export capabilities
- **Health indicators** with color-coded severity levels
- **Responsive design** optimized for portrait viewing

### Adding New Widgets
1. Create widget component in `src/widgets/`
2. Add API endpoint in `server/src/routes/cpapRoutes.ts`
3. Register widget in the dashboard layout
4. Add tests and documentation

## 🧪 Testing

```bash
# Frontend tests
npm run test

# Backend tests
cd server && npm run test

# E2E tests
npm run test:e2e
```

## 📈 Monitoring & Health Checks

- **Frontend**: Health check at `/health`
- **Backend**: Health check at `/health` with database status
- **Database**: Connection monitoring with retry logic
- **Kubernetes**: Liveness and readiness probes configured

## 🔒 Security

- **CORS** properly configured for production domains
- **Helmet** security headers on backend
- **Input validation** on all API endpoints
- **Rate limiting** on API routes
- **Environment-based** configuration

## 🚀 Production Deployment

The system is deployed on Kubernetes with:
- **ArgoCD** for GitOps deployment
- **Ingress** with SSL termination
- **Horizontal Pod Autoscaling** based on CPU/memory
- **Persistent volumes** for database storage
- **Monitoring** with Prometheus and Grafana

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the [documentation](docs/)
- Review the API documentation at `/api`