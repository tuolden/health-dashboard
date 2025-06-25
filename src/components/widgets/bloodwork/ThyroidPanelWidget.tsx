/**
 * Thyroid Panel Widget - Issue #13 Widget #9
 * 
 * Thyroid function tests (TSH, Free T4, Free T3)
 */

import React from 'react'
import { Zap } from 'lucide-react'
import { LabPanelWidget } from './LabPanelWidget'
import { LabWidgetProps } from './types'

interface ThyroidPanelWidgetProps extends LabWidgetProps {
  collectedOn?: string
  showOnlyAbnormal?: boolean
}

export const ThyroidPanelWidget: React.FC<ThyroidPanelWidgetProps> = ({
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
      panelType="THYROID"
      title="Thyroid Function"
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

export default ThyroidPanelWidget
