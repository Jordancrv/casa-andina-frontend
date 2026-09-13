import api from '@/shared/lib/api'
import type {
  HabitacionDto,
  CreateHabitacionPayload,
  PaginatedList,
  CatalogosResponse,
  TipoHabitacionDto,
  ComodidadDto,
  SedeDto,
} from '@/shared/types/global.types'

export type {
  HabitacionDto,
  CreateHabitacionPayload,
  CatalogosResponse,
  TipoHabitacionDto,
  ComodidadDto,
  SedeDto,
}

export interface GetHabitacionesParams {
  sedeId?: number
  piso?: number
  pageNumber?: number
  pageSize?: number
}

/**
 * GET /api/habitaciones
 */
export const listHabitaciones = (
  params: GetHabitacionesParams = {}
): Promise<PaginatedList<HabitacionDto>> =>
  api.get('/habitaciones', { params })

/**
 * POST /api/habitaciones
 */
export const createHabitacion = (
  payload: CreateHabitacionPayload
): Promise<number> =>
  api.post('/habitaciones', payload)

/**
 * GET /api/catalogos
 * Obtiene tipos de habitación, comodidades de la BD y sedes activas.
 */
export const getCatalogos = (): Promise<CatalogosResponse> =>
  api.get('/catalogos')