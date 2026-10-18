import api from '@/shared/lib/api'
import type {
  HabitacionDto,
  CreateHabitacionPayload,
  UpdateHabitacionPayload,
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

export const getHabitacion = (id: number): Promise<HabitacionDto> =>
  api.get(`/habitaciones/${id}`)

/**
 * POST /api/habitaciones
 */
export const createHabitacion = (
  payload: CreateHabitacionPayload
): Promise<number> =>
  api.post('/habitaciones', payload)

export const updateHabitacion = (
  id: number,
  payload: UpdateHabitacionPayload
): Promise<void> =>
  api.put(`/habitaciones/${id}`, payload)

export const deactivateHabitacion = (id: number): Promise<void> =>
  api.delete(`/habitaciones/${id}`)

/**
 * GET /api/catalogos
 * Obtiene tipos de habitación, comodidades de la BD y sedes activas.
 */
export const getCatalogos = (): Promise<CatalogosResponse> =>
  api.get('/catalogos')
