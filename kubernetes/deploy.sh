#!/bin/bash

# Health Dashboard Deployment Script
# This script deploys the complete Health Dashboard with nginx ingress controller

set -e

echo "🚀 Starting Health Dashboard deployment..."

# Check if we should use local or remote image
if curl -s http://black:32003/v2/health-dashboard/tags/list | grep -q "latest"; then
    echo "📦 Using local registry image: black:32003/health-dashboard:latest"
    IMAGE="black:32003/health-dashboard:latest"
else
    echo "📦 Using GitHub Container Registry image: ghcr.io/tuolden/health-dashboard:latest"
    IMAGE="ghcr.io/tuolden/health-dashboard:latest"
fi

# 1. Deploy nginx ingress controller first
echo "📡 Deploying nginx ingress controller..."
kubectl apply -f nginx-ingress-controller.yaml
kubectl apply -f nginx-ingress-deployment.yaml

# 2. Wait for nginx ingress controller to be ready
echo "⏳ Waiting for nginx ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

# 3. Create goal-app namespace
echo "📁 Creating goal-app namespace..."
kubectl create namespace goal-app --dry-run=client -o yaml | kubectl apply -f -

# 4. Update deployment image if using local registry
if [ "$IMAGE" = "black:32003/health-dashboard:latest" ]; then
    echo "🔧 Updating deployment to use local registry image..."
    sed -i.bak "s|ghcr.io/tuolden/health-dashboard:latest|$IMAGE|g" deployment.yaml
fi

# 5. Deploy Health Dashboard
echo "🏥 Deploying Health Dashboard application..."
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Restore original deployment file if we modified it
if [ -f deployment.yaml.bak ]; then
    mv deployment.yaml.bak deployment.yaml
fi

# 6. Wait for Health Dashboard to be ready
echo "⏳ Waiting for Health Dashboard to be ready..."
kubectl wait --namespace goal-app \
  --for=condition=ready pod \
  --selector=app=health-dashboard \
  --timeout=300s

# 7. Show deployment status
echo "✅ Deployment complete! Checking status..."
echo ""
echo "📊 Nginx Ingress Controller:"
kubectl get pods -n ingress-nginx
echo ""
echo "🏥 Health Dashboard:"
kubectl get pods -n goal-app
echo ""
echo "🌐 Ingress Configuration:"
kubectl get ingress -n goal-app
echo ""
echo "🎯 Health Dashboard should be available at: https://dashboard.home"
echo ""
echo "🔍 To check logs:"
echo "  kubectl logs -f deployment/health-dashboard -n goal-app"
echo ""
echo "🧪 To test locally:"
echo "  kubectl port-forward deployment/health-dashboard 8080:5301 -n goal-app"
echo "  Then open: http://localhost:8080"
