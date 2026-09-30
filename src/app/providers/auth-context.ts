import { createContext, useContext } from 'react'
import type { UsuarioSesion } from '@/features/auth/auth.types'

export interface AuthContextValue {
  usuario: UsuarioSesion | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  return context
}
