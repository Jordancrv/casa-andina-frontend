import api from '@/shared/lib/api'
import type { LoginApiResponse } from './auth.types'

/**
 * POST /api/auth/login
 * El backend espera: { Email, Password } (LoginCommand — record de C#, case-insensitive en JSON).
 * Devuelve: { token, nombreCompleto, rol }
 */
export const login = (email: string, password: string): Promise<LoginApiResponse> =>
  api.post('/auth/login', { email, password })