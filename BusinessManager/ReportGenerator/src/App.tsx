import React from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Layout from '@components/Layout'
import Dashboard from '@pages/Dashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Dashboard />
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#000',
          },
        }}
      />
    </QueryClientProvider>
  )
}

export default App
