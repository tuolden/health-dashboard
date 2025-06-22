/**
 * WebSocket Status Component - Issue #8
 * 
 * Displays WebSocket connection status and provides manual controls
 * for testing and debugging the push notification system.
 */

import React, { useState } from 'react'
import { useWebSocketConnection, useWebSocketMessages } from '../stores/websocketStore'
import { useWidgetManager } from '../hooks/useWidgetManager'

interface WebSocketStatusProps {
  showDetails?: boolean
  showControls?: boolean
  className?: string
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  showDetails = false,
  showControls = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { 
    isConnected, 
    isConnecting, 
    connectionError, 
    lastConnectedAt, 
    reconnectAttempts 
  } = useWebSocketConnection()
  
  const { lastMessage, messageHistory } = useWebSocketMessages()
  const { manualRefresh, refreshingWidgets, registeredWidgets } = useWidgetManager()

  // Connection status indicator
  const getStatusColor = () => {
    if (isConnected) return 'text-green-500'
    if (isConnecting) return 'text-yellow-500'
    if (connectionError) return 'text-red-500'
    return 'text-gray-500'
  }

  const getStatusText = () => {
    if (isConnected) return 'Connected'
    if (isConnecting) return 'Connecting...'
    if (connectionError) return 'Error'
    return 'Disconnected'
  }

  const getStatusIcon = () => {
    if (isConnected) return '🟢'
    if (isConnecting) return '🟡'
    if (connectionError) return '🔴'
    return '⚫'
  }

  return (
    <div className={`bg-white dark:bg-dark-card rounded-lg shadow-sm border-2 border-blue-500 ${className}`}>
      {/* Debug Banner */}
      <div className="bg-blue-100 dark:bg-blue-900 p-2 text-center">
        <span className="text-xs font-bold text-blue-800 dark:text-blue-200">
          🔧 WebSocket Status Component - Issue #8 (Debug Mode)
        </span>
      </div>

      {/* Header */}
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{getStatusIcon()}</span>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              WebSocket Status
            </h3>
            <p className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        {/* Expand/Collapse Icon */}
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {/* Connection Details */}
          {showDetails && (
            <div className="mt-4 space-y-2">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Last Connected:</span>
                  <span>{lastConnectedAt ? lastConnectedAt.toLocaleTimeString() : 'Never'}</span>
                </div>
                {reconnectAttempts > 0 && (
                  <div className="flex justify-between">
                    <span>Reconnect Attempts:</span>
                    <span>{reconnectAttempts}</span>
                  </div>
                )}
                {connectionError && (
                  <div className="flex justify-between text-red-500">
                    <span>Error:</span>
                    <span className="truncate ml-2">{connectionError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Widget Status */}
          <div className="mt-4">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Widget Status
            </h4>
            <div className="space-y-1">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Registered Widgets:</span>
                  <span>{registeredWidgets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Currently Refreshing:</span>
                  <span>{refreshingWidgets.length}</span>
                </div>
              </div>
              
              {refreshingWidgets.length > 0 && (
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Refreshing: {refreshingWidgets.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Last Message */}
          {lastMessage && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Message
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono">
                <div className="text-gray-600 dark:text-gray-400">
                  {lastMessage.timestamp && new Date(lastMessage.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-gray-900 dark:text-gray-100">
                  {JSON.stringify(lastMessage, null, 2)}
                </div>
              </div>
            </div>
          )}

          {/* Manual Controls */}
          {showControls && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manual Controls
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => manualRefresh('cpap')}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  Refresh CPAP
                </button>
                <button
                  onClick={() => manualRefresh('all')}
                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                >
                  Refresh All
                </button>
              </div>
            </div>
          )}

          {/* Message History */}
          {showDetails && messageHistory.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recent Messages ({messageHistory.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {messageHistory.slice(-5).map((msg, index) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-mono">
                      {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="ml-2">
                      {msg.event} {msg.widgetType && `(${msg.widgetType})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
