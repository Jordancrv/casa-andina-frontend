import type { Rol } from '@/shared/types/global.types'

/**
 * Estado de sesión local del usuario autenticado.
 * Se construye a partir de la respuesta de POST /api/auth/login.
 * El backend devuelve: { token, nombreCompleto, rol } — NO un objeto user anidado.
 */
export interface UsuarioSesion {
  nombreCompleto: string
  rol: Rol
  token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

/** Respuesta literal de POST /api/auth/login (LoginResponse del backend) */
export interface LoginApiResponse {
  token: string
  nombreCompleto: string
  rol: Rol
}