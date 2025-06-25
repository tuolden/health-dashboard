/**
 * LDL Cholesterol Widget - Issue #13 Widget #14
 * 
 * LDL (Bad) Cholesterol levels
 */

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { LabNumberWidget } from './LabNumberWidget'
import { LabWidgetProps } from './types'

interface LDLCholesterolWidgetProps extends LabWidgetProps {
  showTrend?: boolean
  showReferenceRange?: boolean
}

export const LDLCholesterolWidget: React.FC<LDLCholesterolWidgetProps> = ({
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
      testName="LDL Cholesterol"
      title="LDL (Bad) Cholesterol"
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

export default LDLCholesterolWidget
