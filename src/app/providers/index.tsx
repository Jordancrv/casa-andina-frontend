import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './AuthProvider'
import { queryClient } from './queryClient'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
