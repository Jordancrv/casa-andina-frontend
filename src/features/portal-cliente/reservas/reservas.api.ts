import api from '@/shared/lib/api'
import type { ReservaDto } from '@/shared/types/global.types'

/**
 * GET /api/reservas
 * Requiere JWT.
 * Devuelve todas las reservas del usuario autenticado,
 * ordenadas de la más reciente a la más antigua.
 */
export const getReservas = (): Promise<ReservaDto[]> =>
  api.get('/reservas')