/**
 * CBC Summary Widget - Issue #13 Widget #1
 * 
 * Complete Blood Count overview with key metrics
 */

import React from 'react'
import { Droplets } from 'lucide-react'
import { LabPanelWidget } from './LabPanelWidget'
import { LabWidgetProps } from './types'

interface CBCSummaryWidgetProps extends LabWidgetProps {
  collectedOn?: string
}

export const CBCSummaryWidget: React.FC<CBCSummaryWidgetProps> = ({
  collectedOn,
  className,
  refreshInterval,
  showRefreshButton,
  onError,
  onDataUpdate
}) => {
  return (
    <LabPanelWidget
      panelType="CBC"
      title="CBC Summary"
      collectedOn={collectedOn}
      className={className}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
    />
  )
}

export default CBCSummaryWidget
