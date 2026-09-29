import { useState } from 'react'
import type { ReactNode } from 'react'
import { login as loginApi } from '@/features/auth/auth.api'
import type { UsuarioSesion } from '@/features/auth/auth.types'
import { AuthContext } from './auth-context'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('usuario')
    if (token && savedUser) {
      try {
        return JSON.parse(savedUser)
      } catch {
        return null
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const data = await loginApi(email, password)
      const sesion: UsuarioSesion = {
        nombreCompleto: data.nombreCompleto,
        rol: data.rol,
        token: data.token
      }
      setUsuario(sesion)
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(sesion))
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
