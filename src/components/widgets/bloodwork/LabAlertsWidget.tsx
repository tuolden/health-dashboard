/**
 * Lab Alerts Widget - Issue #13 Widget #16
 * 
 * Comprehensive lab alerts dashboard with priority sorting
 */

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { LabAlertWidget } from './LabAlertWidget'
import { LabWidgetProps } from './types'

interface LabAlertsWidgetProps extends LabWidgetProps {
  maxAlerts?: number
  riskLevels?: ('elevated' | 'high' | 'critical')[]
  collectedOn?: string
}

export const LabAlertsWidget: React.FC<LabAlertsWidgetProps> = ({
  maxAlerts = 10,
  riskLevels = ['elevated', 'high', 'critical'],
  collectedOn,
  className,
  refreshInterval,
  showRefreshButton,
  onError,
  onDataUpdate
}) => {
  return (
    <LabAlertWidget
      title="Lab Alerts Dashboard"
      maxAlerts={maxAlerts}
      riskLevels={riskLevels}
      collectedOn={collectedOn}
      className={className}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
    />
  )
}

export default LabAlertsWidget
