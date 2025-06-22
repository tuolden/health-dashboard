/**
 * WebSocket Store - Issue #8
 * 
 * Zustand store for managing WebSocket connections and push notifications
 * from CPAP ingest services to trigger widget refreshes.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface WebSocketMessage {
  event: string
  widgetType?: string
  data?: any
  timestamp?: string
}

export interface WebSocketState {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  lastConnectedAt: Date | null
  reconnectAttempts: number
  
  // Message handling
  lastMessage: WebSocketMessage | null
  messageHistory: WebSocketMessage[]
  
  // Widget refresh tracking
  refreshingWidgets: Set<string>
  lastRefreshTimes: Record<string, Date>
  
  // Actions
  setConnectionState: (connected: boolean, connecting?: boolean) => void
  setConnectionError: (error: string | null) => void
  addMessage: (message: WebSocketMessage) => void
  setWidgetRefreshing: (widgetType: string, refreshing: boolean) => void
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
  clearMessageHistory: () => void
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      lastConnectedAt: null,
      reconnectAttempts: 0,
      
      lastMessage: null,
      messageHistory: [],
      
      refreshingWidgets: new Set(),
      lastRefreshTimes: {},
      
      // Actions
      setConnectionState: (connected: boolean, connecting = false) => {
        set((state) => ({
          isConnected: connected,
          isConnecting: connecting,
          lastConnectedAt: connected ? new Date() : state.lastConnectedAt,
          connectionError: connected ? null : state.connectionError
        }))
      },
      
      setConnectionError: (error: string | null) => {
        set({ connectionError: error })
      },
      
      addMessage: (message: WebSocketMessage) => {
        set((state) => ({
          lastMessage: message,
          messageHistory: [
            ...state.messageHistory.slice(-49), // Keep last 50 messages
            { ...message, timestamp: message.timestamp || new Date().toISOString() }
          ]
        }))
      },
      
      setWidgetRefreshing: (widgetType: string, refreshing: boolean) => {
        set((state) => {
          const newRefreshingWidgets = new Set(state.refreshingWidgets)
          const newLastRefreshTimes = { ...state.lastRefreshTimes }
          
          if (refreshing) {
            newRefreshingWidgets.add(widgetType)
          } else {
            newRefreshingWidgets.delete(widgetType)
            newLastRefreshTimes[widgetType] = new Date()
          }
          
          return {
            refreshingWidgets: newRefreshingWidgets,
            lastRefreshTimes: newLastRefreshTimes
          }
        })
      },
      
      incrementReconnectAttempts: () => {
        set((state) => ({
          reconnectAttempts: state.reconnectAttempts + 1
        }))
      },
      
      resetReconnectAttempts: () => {
        set({ reconnectAttempts: 0 })
      },
      
      clearMessageHistory: () => {
        set({ messageHistory: [], lastMessage: null })
      }
    }),
    {
      name: 'websocket-store',
      partialize: (state) => ({
        // Only persist certain parts of the state
        lastRefreshTimes: state.lastRefreshTimes,
        messageHistory: state.messageHistory.slice(-10) // Keep last 10 messages
      })
    }
  )
)

// Selectors for common use cases
export const useWebSocketConnection = () => {
  const store = useWebSocketStore()
  return {
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    connectionError: store.connectionError,
    lastConnectedAt: store.lastConnectedAt,
    reconnectAttempts: store.reconnectAttempts
  }
}

export const useWebSocketMessages = () => {
  const store = useWebSocketStore()
  return {
    lastMessage: store.lastMessage,
    messageHistory: store.messageHistory,
    addMessage: store.addMessage,
    clearMessageHistory: store.clearMessageHistory
  }
}

export const useWidgetRefreshState = () => {
  const store = useWebSocketStore()
  return {
    refreshingWidgets: store.refreshingWidgets,
    lastRefreshTimes: store.lastRefreshTimes,
    setWidgetRefreshing: store.setWidgetRefreshing
  }
}
