/**
 * Platelet Count Widget - Issue #13 Widget #15
 * 
 * Platelet count for bleeding/clotting assessment
 */

import React from 'react'
import { Droplets } from 'lucide-react'
import { LabNumberWidget } from './LabNumberWidget'
import { LabWidgetProps } from './types'

interface PlateletCountWidgetProps extends LabWidgetProps {
  showTrend?: boolean
  showReferenceRange?: boolean
}

export const PlateletCountWidget: React.FC<PlateletCountWidgetProps> = ({
  showTrend = true,
  showReferenceRange = true,
  className,
  refreshInterval,
  showRefreshButton,
  onError,
  onDataUpdate
}) => {
  return (
    <LabNumberWidget
      testName="Platelet Count"
      title="Platelet Count"
      showTrend={showTrend}
      showReferenceRange={showReferenceRange}
      precision={0}
      className={className}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
    />
  )
}

export default PlateletCountWidget
