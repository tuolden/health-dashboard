/**
 * WebSocket Hook - Issue #8
 * 
 * Custom React hook for managing WebSocket connections with automatic
 * reconnection, error handling, and message processing.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useWebSocketStore, WebSocketMessage } from '../stores/websocketStore'

interface UseWebSocketOptions {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

const DEFAULT_OPTIONS: Required<UseWebSocketOptions> = {
  url: import.meta.env.VITE_WS_URL || (
    import.meta.env.PROD
      ? 'ws://api.dashboard.home/ws'
      : 'ws://localhost:4000/ws'
  ),
  reconnectInterval: 3000, // 3 seconds
  maxReconnectAttempts: 10,
  onMessage: () => {},
  onConnect: () => {},
  onDisconnect: () => {},
  onError: () => {}
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isManualClose = useRef(false)
  
  const {
    isConnected,
    isConnecting,
    reconnectAttempts,
    setConnectionState,
    setConnectionError,
    addMessage,
    incrementReconnectAttempts,
    resetReconnectAttempts
  } = useWebSocketStore()

  // Clear any existing reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket already connected')
      return
    }

    console.log(`🔌 Connecting to WebSocket: ${config.url}`)
    setConnectionState(false, true)
    clearReconnectTimeout()

    try {
      const socket = new WebSocket(config.url)
      socketRef.current = socket

      socket.onopen = () => {
        console.log('✅ WebSocket connected successfully')
        setConnectionState(true, false)
        setConnectionError(null)
        resetReconnectAttempts()
        config.onConnect()
      }

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('📨 WebSocket message received:', message)
          
          addMessage(message)
          config.onMessage(message)
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error)
          setConnectionError('Failed to parse message')
        }
      }

      socket.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason)
        setConnectionState(false, false)
        socketRef.current = null
        config.onDisconnect()

        // Only attempt reconnection if it wasn't a manual close
        if (!isManualClose.current && reconnectAttempts < config.maxReconnectAttempts) {
          console.log(`🔄 Scheduling reconnect attempt ${reconnectAttempts + 1}/${config.maxReconnectAttempts}`)
          incrementReconnectAttempts()
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, config.reconnectInterval)
        } else if (reconnectAttempts >= config.maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached')
          setConnectionError('Max reconnection attempts reached')
        }
      }

      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setConnectionError('Connection error occurred')
        config.onError(error)
      }

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error)
      setConnectionState(false, false)
      setConnectionError('Failed to create connection')
    }
  }, [config, reconnectAttempts, setConnectionState, setConnectionError, addMessage, incrementReconnectAttempts, resetReconnectAttempts, clearReconnectTimeout])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log('🔌 Manually disconnecting WebSocket')
    isManualClose.current = true
    clearReconnectTimeout()
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect')
      socketRef.current = null
    }
    
    setConnectionState(false, false)
    
    // Reset manual close flag after a short delay
    setTimeout(() => {
      isManualClose.current = false
    }, 1000)
  }, [setConnectionState, clearReconnectTimeout])

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message)
      socketRef.current.send(messageStr)
      console.log('📤 WebSocket message sent:', message)
      return true
    } else {
      console.warn('⚠️ Cannot send message: WebSocket not connected')
      return false
    }
  }, [])

  // Auto-connect on mount and cleanup on unmount
  useEffect(() => {
    connect()

    return () => {
      console.log('🧹 Cleaning up WebSocket connection')
      isManualClose.current = true
      clearReconnectTimeout()
      
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmount')
      }
    }
  }, []) // Empty dependency array - only run on mount/unmount

  return {
    isConnected,
    isConnecting,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
    connectionError: useWebSocketStore(state => state.connectionError)
  }
}
