#!/bin/bash

# Health Dashboard Deployment Script
# This script deploys the complete Health Dashboard with nginx ingress controller

set -e

echo "🚀 Starting Health Dashboard deployment..."

# Check if local registry has the image
if curl -s http://black:32003/v2/health-dashboard/tags/list | grep -q "latest"; then
    echo "📦 Using local registry image: black:32003/health-dashboard:latest"
else
    echo "❌ Error: Docker image not found in local registry!"
    echo "🔧 Please build and push the image first:"
    echo "   docker build -t health-dashboard:latest ."
    echo "   docker tag health-dashboard:latest black:32003/health-dashboard:latest"
    echo "   docker push black:32003/health-dashboard:latest"
    exit 1
fi

# 1. Deploy nginx ingress controller first (if not already installed)
echo "📡 Checking nginx ingress controller..."
if ! kubectl get namespace ingress-nginx >/dev/null 2>&1; then
    echo "🔧 Installing nginx ingress controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

    # Wait for nginx ingress controller to be ready
    echo "⏳ Waiting for nginx ingress controller to be ready..."
    kubectl wait --namespace ingress-nginx \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller \
      --timeout=300s
else
    echo "✅ Nginx ingress controller already installed"
fi

# 2. Create goal-app namespace
echo "📁 Creating goal-app namespace..."
kubectl create namespace goal-app --dry-run=client -o yaml | kubectl apply -f -

# 3. Deploy Health Dashboard
echo "🏥 Deploying Health Dashboard application..."
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# 4. Wait for Health Dashboard to be ready
echo "⏳ Waiting for Health Dashboard to be ready..."
kubectl wait --namespace goal-app \
  --for=condition=ready pod \
  --selector=app=health-dashboard \
  --timeout=300s

# 5. Show deployment status
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
