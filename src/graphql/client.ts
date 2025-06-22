/**
 * Apollo GraphQL Client Setup - Issue #5
 * 
 * Configures Apollo Client for connecting to the Health Dashboard GraphQL API
 * with support for queries, mutations, and real-time subscriptions
 */

import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'

// GraphQL server URLs
const GRAPHQL_HTTP_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql'
const GRAPHQL_WS_URL = import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql'

// HTTP Link for queries and mutations
const httpLink = createHttpLink({
  uri: GRAPHQL_HTTP_URL,
  credentials: 'include' // Include cookies for authentication if needed
})

// WebSocket Link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: GRAPHQL_WS_URL,
    connectionParams: {
      // Add authentication headers if needed
      // authToken: localStorage.getItem('authToken')
    },
    retryAttempts: 5,
    shouldRetry: () => true
  })
)

// Split link to route operations to appropriate transport
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink
)

// Apollo Client configuration
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Cache policies for widget data
          steps: {
            merge: true
          },
          waterIntake: {
            merge: true
          },
          weightHistory: {
            merge: true
          },
          heartRate: {
            merge: true
          },
          nutrition: {
            merge: true
          },
          sleep: {
            merge: true
          },
          activity: {
            merge: true
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network'
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first'
    }
  },
  connectToDevTools: import.meta.env.DEV
})

// Helper function to check GraphQL server connectivity
export const checkGraphQLConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(GRAPHQL_HTTP_URL.replace('/graphql', '/health'))
    return response.ok
  } catch (error) {
    console.warn('GraphQL server not available:', error)
    return false
  }
}

// Export configuration for debugging
export const graphqlConfig = {
  httpUrl: GRAPHQL_HTTP_URL,
  wsUrl: GRAPHQL_WS_URL,
  isProduction: import.meta.env.PROD
}
