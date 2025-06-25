/**
 * Hemoglobin Widget - Issue #13 Widget #3
 * 
 * Hemoglobin levels with anemia risk assessment
 */

import React from 'react'
import { Heart } from 'lucide-react'
import { LabNumberWidget } from './LabNumberWidget'
import { LabWidgetProps } from './types'

interface HemoglobinWidgetProps extends LabWidgetProps {
  showTrend?: boolean
  showReferenceRange?: boolean
}

export const HemoglobinWidget: React.FC<HemoglobinWidgetProps> = ({
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
      testName="Hemoglobin"
      title="Hemoglobin Level"
      showTrend={showTrend}
      showReferenceRange={showReferenceRange}
      precision={1}
      className={className}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
    />
  )
}

export default HemoglobinWidget
