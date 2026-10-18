import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { login as loginApi } from '@/features/auth/auth.api'
import type { UsuarioSesion } from '@/features/auth/auth.types'
import type { Rol } from '@/shared/types/global.types'
import { AuthContext } from './auth-context'

const ROLES_VALIDOS: readonly Rol[] = [
  'Superadministrador', 'Administrador', 'Recepcion', 'Operaciones', 'Mantenimiento', 'Cliente'
]

const claimsToken = (token: string): { exp?: unknown; role?: unknown; [key: string]: unknown } | null => {
  try {
    const payloadBase64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    if (!payloadBase64) return null
    return JSON.parse(atob(payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, '='))) as { exp?: unknown; role?: unknown; [key: string]: unknown }
  } catch {
    return null
  }
}

const tokenPermiteRol = (token: string, rol: Rol) => {
  const payload = claimsToken(token)
  if (!payload || typeof payload.exp !== 'number' || payload.exp <= Date.now() / 1000) return false
  const claimRol = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
  const roles = Array.isArray(claimRol) ? claimRol : [claimRol]
  return roles.includes(rol)
}

const restaurarSesion = (): UsuarioSesion | null => {
  const token = localStorage.getItem('token')
  const savedUser = localStorage.getItem('usuario')
  if (!token || !savedUser) {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    return null
  }

  try {
    const usuario = JSON.parse(savedUser) as Partial<UsuarioSesion>
    if (usuario.token !== token || typeof usuario.nombreCompleto !== 'string' ||
        !usuario.nombreCompleto.trim() || !ROLES_VALIDOS.includes(usuario.rol as Rol) ||
        !tokenPermiteRol(token, usuario.rol as Rol)) {
      throw new Error('Sesión no válida')
    }
    return usuario as UsuarioSesion
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(restaurarSesion)
  const [isLoading, setIsLoading] = useState(false)

  const logout = useCallback(() => {
    setUsuario(null)
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }, [])

  useEffect(() => {
    if (!usuario) return

    const expiresAt = claimsToken(usuario.token)?.exp
    const timeLeft = typeof expiresAt === 'number'
      ? expiresAt * 1000 - Date.now()
      : 0

    const expirationTimer = window.setTimeout(logout, Math.max(timeLeft, 0))
    const syncSession = (event: StorageEvent) => {
      if (event.key !== 'token') return
      if (!event.newValue) logout()
      else setUsuario(restaurarSesion())
    }
    const handleUnauthorized = () => logout()

    window.addEventListener('storage', syncSession)
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.clearTimeout(expirationTimer)
      window.removeEventListener('storage', syncSession)
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [usuario, logout])

  const completeLogin = (data: { nombreCompleto: string; rol: UsuarioSesion['rol']; token: string }) => {
    if (!data.nombreCompleto.trim() || !ROLES_VALIDOS.includes(data.rol) || !tokenPermiteRol(data.token, data.rol)) {
      throw new Error('El servidor devolvió una sesión inválida.')
    }
    const sesion: UsuarioSesion = {
      nombreCompleto: data.nombreCompleto,
      rol: data.rol,
      token: data.token
    }
    setUsuario(sesion)
    localStorage.setItem('token', data.token)
    localStorage.setItem('usuario', JSON.stringify(sesion))
  }

  const login = async (email: string, password: string, captchaToken?: string | null) => {
    setIsLoading(true)
    try {
      const data = await loginApi(email, password, captchaToken)
      completeLogin(data)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, login, completeLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
