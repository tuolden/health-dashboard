/**
 * Kidney Panel Widget - Issue #13 Widget #7
 * 
 * Kidney function tests (BUN, Creatinine, eGFR)
 */

import React from 'react'
import { Droplets } from 'lucide-react'
import { LabPanelWidget } from './LabPanelWidget'
import { LabWidgetProps } from './types'

interface KidneyPanelWidgetProps extends LabWidgetProps {
  collectedOn?: string
  showOnlyAbnormal?: boolean
}

export const KidneyPanelWidget: React.FC<KidneyPanelWidgetProps> = ({
  collectedOn,
  showOnlyAbnormal = false,
  className,
  refreshInterval,
  showRefreshButton,
  onError,
  onDataUpdate
}) => {
  return (
    <LabPanelWidget
      panelType="KIDNEY"
      title="Kidney Function"
      collectedOn={collectedOn}
      showOnlyAbnormal={showOnlyAbnormal}
      className={className}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
    />
  )
}

export default KidneyPanelWidget
