# ArgoCD Setup and Auto-Sync Configuration

## 🎯 Problem Solved
Fixed ArgoCD requiring manual intervention (pressing refresh/sync buttons or deleting applications) by implementing comprehensive auto-sync configuration.

## 🔧 What Was Fixed

### 1. Enhanced ArgoCD Application Configuration
**File: `kubernetes/application.yaml`**

Added comprehensive sync policies:
- **Automated sync** with prune and self-heal
- **Retry logic** with exponential backoff
- **Proper finalizers** for clean resource management
- **Advanced sync options** for reliable deployment

### 2. Improved Resource Tracking
**Files: `kubernetes/deployment.yaml`, `kubernetes/configmap.yaml`**

- **ConfigMap-based configuration** for better change detection
- **Enhanced annotations** for ArgoCD tracking
- **Sync wave ordering** for controlled deployment sequence
- **Revision tracking** across all resources

### 3. Automated Deployment Updates
**File: `scripts/update-deployment.sh`**

- **Automated version generation** with timestamps and git hashes
- **Consistent updates** across all configuration files
- **Eliminates manual FORCE_REDEPLOY management**

## 🚀 How to Use

### For Regular Deployments
```bash
# 1. Make your code changes
# 2. Run the update script
./scripts/update-deployment.sh

# 3. Commit and push
git add .
git commit -m "deploy: Your deployment message"
git push origin main

# 4. ArgoCD should automatically sync within 3 minutes
```

### For Emergency Deployments
If you need immediate deployment:
```bash
# Update deployment configuration
./scripts/update-deployment.sh

# Force immediate commit and push
git add . && git commit -m "hotfix: Emergency deployment" && git push origin main

# ArgoCD will sync automatically, but you can force it in the UI if needed
```

## 🖥️ ArgoCD UI Actions (If Needed)

### Normal Operation (Should Not Be Needed)
ArgoCD should now automatically:
- ✅ Detect changes within 3 minutes
- ✅ Sync automatically without manual intervention
- ✅ Handle failed deployments with retry logic

### If Manual Intervention Is Still Needed

1. **Open ArgoCD Dashboard**
   - Navigate to your ArgoCD UI
   - Find the `health-dashboard` application

2. **Check Application Status**
   - Status should show "Synced" and "Healthy"
   - If showing "OutOfSync", proceed to step 3

3. **Manual Sync (Last Resort)**
   - Click **"Refresh"** button first
   - If still out of sync, click **"Sync"** button
   - Select **"Synchronize"** in the dialog

4. **If Application Is Broken**
   - **DO NOT DELETE** the entire application
   - Click **"Refresh"** then **"Hard Refresh"**
   - If that fails, click **"Sync"** with **"Force"** option checked

## 📋 Configuration Details

### Sync Policy Configuration
```yaml
syncPolicy:
  automated:
    prune: true           # Remove resources not in Git
    selfHeal: true        # Fix drift automatically
    allowEmpty: false     # Prevent empty deployments
  syncOptions:
    - CreateNamespace=true              # Create namespace if missing
    - PrunePropagationPolicy=foreground # Proper resource cleanup
    - PruneLast=true                    # Prune after sync
    - ApplyOutOfSyncOnly=true          # Only apply changed resources
    - RespectIgnoreDifferences=false   # Don't ignore any differences
    - Replace=false                     # Use patch instead of replace
  retry:
    limit: 5                           # Retry up to 5 times
    backoff:
      duration: 5s                     # Start with 5 second delay
      factor: 2                        # Double delay each retry
      maxDuration: 3m                  # Max 3 minute delay
```

### Resource Ordering
Resources are deployed in this order:
1. **ConfigMap** (sync-wave: 0)
2. **Service** (sync-wave: 1)
3. **Deployment** (sync-wave: 1)
4. **Ingress** (sync-wave: 1)

## 🔍 Troubleshooting

### ArgoCD Still Requires Manual Sync
1. Check if the application has the new configuration:
   ```bash
   kubectl get application health-dashboard -n argocd -o yaml
   ```

2. Verify the ConfigMap is being tracked:
   ```bash
   kubectl get configmap health-dashboard-config -n goal-app
   ```

3. Check ArgoCD logs:
   ```bash
   kubectl logs -n argocd deployment/argocd-application-controller
   ```

### Deployment Not Updating
1. Verify the version changed in ConfigMap:
   ```bash
   kubectl get configmap health-dashboard-config -n goal-app -o yaml | grep DEPLOYMENT_VERSION
   ```

2. Check if pods are restarting:
   ```bash
   kubectl get pods -n goal-app -w
   ```

### Emergency Reset
If everything breaks:
```bash
# 1. Delete the ArgoCD application (NOT the Kubernetes resources)
kubectl delete application health-dashboard -n argocd

# 2. Recreate the application
kubectl apply -f kubernetes/application.yaml

# 3. ArgoCD will resync everything automatically
```

## ✅ Success Indicators

ArgoCD is working correctly when:
- ✅ Application shows "Synced" and "Healthy"
- ✅ Changes are detected within 3 minutes of Git push
- ✅ Deployments happen automatically without manual intervention
- ✅ Failed deployments retry automatically
- ✅ No manual refresh/sync buttons needed

## 📞 Support

If ArgoCD still requires manual intervention after these changes:
1. Check the ArgoCD application configuration
2. Verify all resources have proper annotations
3. Ensure the ConfigMap is being updated by the script
4. Check ArgoCD controller logs for errors
