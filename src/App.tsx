import React from 'react'
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from './graphql/client'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <Dashboard />
    </ApolloProvider>
  )
}

export default App
