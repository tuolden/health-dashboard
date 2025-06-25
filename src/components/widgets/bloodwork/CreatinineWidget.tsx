/**
 * Creatinine Widget - Issue #13 Widget #12
 * 
 * Serum creatinine levels for kidney function
 */

import React from 'react'
import { Droplets } from 'lucide-react'
import { LabNumberWidget } from './LabNumberWidget'
import { LabWidgetProps } from './types'

interface CreatinineWidgetProps extends LabWidgetProps {
  showTrend?: boolean
  showReferenceRange?: boolean
}

export const CreatinineWidget: React.FC<CreatinineWidgetProps> = ({
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
      testName="Creatinine"
      title="Serum Creatinine"
      showTrend={showTrend}
      showReferenceRange={showReferenceRange}
      precision={2}
      className={className}
      refreshInterval={refreshInterval}
      showRefreshButton={showRefreshButton}
      onError={onError}
      onDataUpdate={onDataUpdate}
    />
  )
}

export default CreatinineWidget
