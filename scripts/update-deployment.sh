#!/bin/bash

# Update Deployment Script for ArgoCD
# This script updates all deployment-related timestamps and versions to trigger ArgoCD sync

set -e

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VERSION="v-$(date -u +"%Y-%m-%d-%H-%M")-$(git rev-parse --short HEAD)"

echo "🚀 Updating deployment configuration..."
echo "📅 Timestamp: $TIMESTAMP"
echo "🏷️  Version: $VERSION"

# Update ConfigMap
echo "📝 Updating ConfigMap..."
sed -i.bak "s/DEPLOYMENT_VERSION: .*/DEPLOYMENT_VERSION: \"$VERSION\"/" kubernetes/configmap.yaml
sed -i.bak "s/DEPLOYMENT_TIMESTAMP: .*/DEPLOYMENT_TIMESTAMP: \"$TIMESTAMP\"/" kubernetes/configmap.yaml

# Update Deployment annotations
echo "📝 Updating Deployment annotations..."
sed -i.bak "s/deployment.kubernetes.io\/revision: .*/deployment.kubernetes.io\/revision: \"$VERSION\"/" kubernetes/deployment.yaml
sed -i.bak "s/kubectl.kubernetes.io\/restartedAt: .*/kubectl.kubernetes.io\/restartedAt: \"$TIMESTAMP\"/" kubernetes/deployment.yaml

# Update Kustomization
echo "📝 Updating Kustomization..."
sed -i.bak "s/deployment.kubernetes.io\/revision: .*/deployment.kubernetes.io\/revision: \"$VERSION\"/" kubernetes/kustomization.yaml
sed -i.bak "s/kubectl.kubernetes.io\/restartedAt: .*/kubectl.kubernetes.io\/restartedAt: \"$TIMESTAMP\"/" kubernetes/kustomization.yaml

# Clean up backup files
rm -f kubernetes/*.bak

echo "✅ Deployment configuration updated!"
echo ""
echo "📋 Next steps:"
echo "1. git add ."
echo "2. git commit -m 'deploy: Update deployment to $VERSION'"
echo "3. git push origin main"
echo "4. ArgoCD should automatically sync the changes"
echo ""
echo "🔍 If ArgoCD doesn't sync automatically:"
echo "- Check ArgoCD UI at your ArgoCD dashboard"
echo "- Click 'Refresh' then 'Sync' if needed"
echo "- The new version should be: $VERSION"
