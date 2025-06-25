/**
 * Glucose Widget - Issue #13 Widget #5
 * 
 * Blood glucose levels with diabetes risk assessment
 */

import React from 'react'
import { Zap } from 'lucide-react'
import { LabNumberWidget } from './LabNumberWidget'
import { LabWidgetProps } from './types'

interface GlucoseWidgetProps extends LabWidgetProps {
  showTrend?: boolean
  showReferenceRange?: boolean
}

export const GlucoseWidget: React.FC<GlucoseWidgetProps> = ({
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
      testName="Glucose"
      title="Blood Glucose"
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

export default GlucoseWidget
