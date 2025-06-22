# Health Dashboard - CI/CD + Docker + K3s Deployment

This directory contains Kubernetes manifests for deploying the Health Dashboard application using ArgoCD on a K3s cluster.

## 🚀 CI/CD Pipeline Overview

### GitHub Actions Workflow
- **Trigger**: Push to `main` branch
- **Steps**:
  1. Checkout code
  2. Install Node.js 18
  3. Install dependencies
  4. Run ESLint
  5. Run tests (Jest)
  6. Build React application
  7. Build Docker image
  8. Push to local registry (`black:32003`)

### Docker Container
- **Base Image**: `node:18-alpine` (builder) + `nginx:alpine` (runtime)
- **Port**: 5301 (as specified in requirements)
- **Build**: Multi-stage build for optimized production image
- **Registry**: `black:32003/health-dashboard:latest`

## 📁 Kubernetes Manifests

### `application.yaml`
ArgoCD Application manifest that:
- Monitors this GitHub repository
- Deploys to `goal-app` namespace
- Auto-syncs changes with pruning and self-healing

### `deployment.yaml`
Kubernetes Deployment with:
- 1 replica of the health dashboard
- Container port 5301
- Inline environment variables (no ConfigMap)
- Always pull latest image policy

### `service.yaml`
ClusterIP Service that:
- Exposes the deployment on port 80
- Routes traffic to container port 5301

### `ingress.yaml`
Ingress configuration for:
- Host: `dashboard.home`
- TLS certificate via cert-manager
- Force SSL redirect
- Nginx ingress controller

## 🔧 Deployment Instructions

### Prerequisites
- K3s cluster running
- Local Docker registry at `black:32003`
- cert-manager for TLS certificates (optional)

### 🚀 Automated Deployment (Recommended)
The easiest way to deploy everything including nginx ingress controller:

```bash
# Clone the repository
git clone https://github.com/tuolden/health-dashboard.git
cd health-dashboard

# Build and push Docker image
docker build -t health-dashboard:latest .
docker tag health-dashboard:latest black:32003/health-dashboard:latest
docker push black:32003/health-dashboard:latest

# Deploy everything with one command
cd kubernetes
./deploy.sh
```

This script will:
1. Deploy nginx ingress controller
2. Wait for it to be ready
3. Create goal-app namespace
4. Deploy Health Dashboard
5. Show deployment status

### Deploy with ArgoCD (GitOps)
1. Apply the ArgoCD Application:
   ```bash
   kubectl apply -f kubernetes/application.yaml
   ```

2. ArgoCD will automatically:
   - Monitor the GitHub repository
   - Deploy all manifests in the `kubernetes/` directory
   - Keep the deployment in sync with the repository

### Manual Deployment (Step by Step)
```bash
# 1. Deploy nginx ingress controller
kubectl apply -f kubernetes/nginx-ingress-controller.yaml
kubectl apply -f kubernetes/nginx-ingress-deployment.yaml

# 2. Wait for nginx ingress to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

# 3. Create namespace and deploy Health Dashboard
kubectl create namespace goal-app
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/ingress.yaml
```

## 🌐 Access the Application

Once deployed, the Health Dashboard will be available at:
- **URL**: https://dashboard.home
- **Port**: 443 (HTTPS with TLS certificate)
- **Internal**: Service runs on port 80, container on 5301

## 🔄 CI/CD Flow

1. **Developer pushes to main branch**
2. **GitHub Actions triggers**:
   - Lints and tests the code
   - Builds the React application
   - Creates Docker image
   - Pushes to `black:32003/health-dashboard:latest`
3. **ArgoCD detects changes**:
   - Pulls latest manifests from GitHub
   - Updates deployment with new image
   - Ensures desired state matches repository

## 📊 Monitoring & Health Checks

### Application Health
- Nginx serves static files from `/usr/share/nginx/html`
- Health check: `curl http://localhost:5301`
- Container logs: `kubectl logs -f deployment/health-dashboard -n goal-app`

### ArgoCD Monitoring
- ArgoCD UI shows deployment status
- Auto-sync ensures consistency
- Rollback capabilities available

## 🛠️ Development Workflow

### Local Development
```bash
npm run dev          # Start development server
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run build        # Build for production
```

### Docker Testing
```bash
# Build image locally
docker build -t health-dashboard:latest .

# Test container
docker run -p 5301:5301 health-dashboard:latest

# Access at http://localhost:5301
```

### Deployment Testing
```bash
# Check ArgoCD application status
kubectl get application health-dashboard -n argocd

# Check deployment status
kubectl get deployment health-dashboard -n goal-app

# Check service and ingress
kubectl get svc,ingress -n goal-app
```

## 🔐 Security Features

- **TLS Encryption**: Automatic HTTPS with cert-manager
- **Force SSL**: All HTTP traffic redirected to HTTPS
- **Nginx Security**: Production-ready nginx configuration
- **Container Security**: Non-root user, minimal attack surface

## 📝 Environment Variables

The deployment includes inline environment variables:
- `APP_ENV=production`
- `FORCE_REDEPLOY=v-2025-06-22` (for forcing updates)

## 🚨 Troubleshooting

### Common Issues
1. **Image pull errors**: Ensure `black:32003` registry is accessible
2. **Ingress not working**: Check nginx-ingress-controller status
3. **TLS certificate issues**: Verify cert-manager configuration
4. **ArgoCD sync issues**: Check repository access and webhook configuration

### Useful Commands
```bash
# Check pod logs
kubectl logs -f deployment/health-dashboard -n goal-app

# Describe deployment
kubectl describe deployment health-dashboard -n goal-app

# Check ArgoCD application
kubectl get application health-dashboard -n argocd -o yaml

# Force ArgoCD sync
argocd app sync health-dashboard
```
