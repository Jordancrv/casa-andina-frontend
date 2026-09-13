import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { login as loginApi } from '@/features/auth/auth.api'
import type { UsuarioSesion } from '@/features/auth/auth.types'

type AuthContextProps = {
  usuario: UsuarioSesion | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // isLoading inicia en false — si no hay sesión activa, no se bloquea la app
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // El backend devuelve { token, nombreCompleto, rol } — sin objeto user anidado
      const data = await loginApi(email, password)
      const sesion: UsuarioSesion = {
        nombreCompleto: data.nombreCompleto,
        rol: data.rol,
        token: data.token
      }
      setUsuario(sesion)
      localStorage.setItem('token', data.token)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}