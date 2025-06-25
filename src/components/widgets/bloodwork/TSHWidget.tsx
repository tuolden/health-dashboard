/**
 * TSH Widget - Issue #13 Widget #11
 * 
 * Thyroid Stimulating Hormone levels
 */

import React from 'react'
import { Zap } from 'lucide-react'
import { LabNumberWidget } from './LabNumberWidget'
import { LabWidgetProps } from './types'

interface TSHWidgetProps extends LabWidgetProps {
  showTrend?: boolean
  showReferenceRange?: boolean
}

export const TSHWidget: React.FC<TSHWidgetProps> = ({
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
      testName="TSH"
      title="TSH (Thyroid Stimulating Hormone)"
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

export default TSHWidget
