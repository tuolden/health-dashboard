/**
 * Liver Enzymes Widget - Issue #13 Widget #10
 * 
 * Liver function enzymes (AST, ALT, Alkaline Phosphatase)
 */

import React from 'react'
import { Activity } from 'lucide-react'
import { LabPanelWidget } from './LabPanelWidget'
import { LabWidgetProps } from './types'

interface LiverEnzymesWidgetProps extends LabWidgetProps {
  collectedOn?: string
  showOnlyAbnormal?: boolean
}

export const LiverEnzymesWidget: React.FC<LiverEnzymesWidgetProps> = ({
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
      panelType="LIVER"
      title="Liver Enzymes"
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

export default LiverEnzymesWidget
