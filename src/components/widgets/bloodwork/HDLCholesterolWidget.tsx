/**
 * HDL Cholesterol Widget - Issue #13 Widget #13
 * 
 * HDL (Good) Cholesterol levels
 */

import React from 'react'
import { Heart } from 'lucide-react'
import { LabNumberWidget } from './LabNumberWidget'
import { LabWidgetProps } from './types'

interface HDLCholesterolWidgetProps extends LabWidgetProps {
  showTrend?: boolean
  showReferenceRange?: boolean
}

export const HDLCholesterolWidget: React.FC<HDLCholesterolWidgetProps> = ({
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
      testName="HDL Cholesterol"
      title="HDL (Good) Cholesterol"
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

export default HDLCholesterolWidget
