/**
 * Lipid Panel Widget - Issue #13 Widget #4
 * 
 * Comprehensive lipid panel with cardiovascular risk assessment
 */

import React from 'react'
import { Heart } from 'lucide-react'
import { LabPanelWidget } from './LabPanelWidget'
import { LabWidgetProps } from './types'

interface LipidPanelWidgetProps extends LabWidgetProps {
  collectedOn?: string
  showOnlyAbnormal?: boolean
}

export const LipidPanelWidget: React.FC<LipidPanelWidgetProps> = ({
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
      panelType="LIPID"
      title="Lipid Panel"
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

export default LipidPanelWidget
