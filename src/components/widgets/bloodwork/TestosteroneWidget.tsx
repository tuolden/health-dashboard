/**
 * Testosterone Widget - Issue #13 Widget #8
 * 
 * Testosterone levels with trend analysis
 */

import React from 'react'
import { User } from 'lucide-react'
import { LabNumberWidget } from './LabNumberWidget'
import { LabWidgetProps } from './types'

interface TestosteroneWidgetProps extends LabWidgetProps {
  testType?: 'total' | 'free'
  showTrend?: boolean
  showReferenceRange?: boolean
}

export const TestosteroneWidget: React.FC<TestosteroneWidgetProps> = ({
  testType = 'total',
  showTrend = true,
  showReferenceRange = true,
  className,
  refreshInterval,
  showRefreshButton,
  onError,
  onDataUpdate
}) => {
  const testName = testType === 'total' ? 'Testosterone Total' : 'Testosterone Free'
  const title = testType === 'total' ? 'Total Testosterone' : 'Free Testosterone'

  return (
    <LabNumberWidget
      testName={testName}
      title={title}
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

export default TestosteroneWidget
