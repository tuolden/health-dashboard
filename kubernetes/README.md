# Health Dashboard Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the complete Health Dashboard application (Frontend + Backend).

## Prerequisites

- Kubernetes cluster (tested with K3s)
- kubectl configured to access your cluster
- Docker images built and pushed to your registry

## Quick Deployment

### Option 1: Using Kustomize (Recommended)

Deploy everything with a single command from the root directory:

```bash
# Deploy both frontend and backend
kubectl apply -k .
```

Or deploy just the frontend:

```bash
# Deploy frontend only
kubectl apply -k kubernetes/
```

The complete deployment includes:

- Frontend (health-dashboard) on dashboard.home
- Backend API (health-dashboard-api) on api.dashboard.home
- All necessary services and ingress configurations

### Option 2: Manual YAML Application

```bash
# Create namespace
kubectl create namespace goal-app

# Deploy Frontend
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/ingress.yaml

# Deploy Backend
kubectl apply -f server/kubernetes/deployment.yaml
kubectl apply -f server/kubernetes/service.yaml
kubectl apply -f server/kubernetes/ingress.yaml
```

## Building and Pushing Images

Before deployment, build and push both images:

```bash
# Frontend
docker build --platform linux/amd64 -t health-dashboard:latest .
docker tag health-dashboard:latest black:32003/health-dashboard:latest
docker push black:32003/health-dashboard:latest

# Backend
cd server
docker build --platform linux/amd64 -t health-dashboard-api:latest .
docker tag health-dashboard-api:latest black:32003/health-dashboard-api:latest
docker push black:32003/health-dashboard-api:latest
```

## Configuration

### Frontend

- **Image**: `black:32003/health-dashboard:latest`
- **Port**: 5301 (internal), 80 (service)
- **URL**: <https://dashboard.home>

### Backend

- **Image**: `black:32003/health-dashboard-api:latest`
- **Port**: 4000 (internal), 4000 (service)
- **URL**: <https://api.dashboard.home>

## Monitoring

Check deployment status:

```bash
kubectl get pods -n goal-app
kubectl get services -n goal-app
kubectl get ingress -n goal-app
```

View logs:

```bash
# Frontend logs
kubectl logs -f deployment/health-dashboard -n goal-app

# Backend logs
kubectl logs -f deployment/health-dashboard-api -n goal-app
```

## Updating Deployments

To update with new images:

```bash
# Restart deployments to pull latest images
kubectl rollout restart deployment health-dashboard -n goal-app
kubectl rollout restart deployment health-dashboard-api -n goal-app

# Or redeploy everything
kubectl apply -k .
```

## Troubleshooting

1. **Pod not starting**: Check logs with `kubectl describe pod <pod-name> -n goal-app`
2. **Image pull errors**: Ensure Docker images are available in your registry
3. **API calls failing**: Verify backend is running and ingress is configured correctly
4. **Architecture errors**: Ensure images are built with `--platform linux/amd64`

## Development

For local development with port forwarding:

```bash
# Frontend
kubectl port-forward deployment/health-dashboard 8080:5301 -n goal-app

# Backend
kubectl port-forward deployment/health-dashboard-api 4000:4000 -n goal-app
```

Then access:

- Frontend: <http://localhost:8080>
- Backend API: <http://localhost:4000>

## CI/CD Integration

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds both frontend and backend images. After the workflow completes:

1. Download the image artifacts (optional)
2. Build and push images to your local registry
3. Deploy using: `kubectl apply -k .`

The workflow provides detailed deployment instructions in the GitHub Actions output.
