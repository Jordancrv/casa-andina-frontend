import api from '@/shared/lib/api'
import type { PaginatedList, ServicioDto, ServicioPayload } from '@/shared/types/global.types'

export interface GetServiciosParams {
  sedeId?: number
  nombre?: string
  pageNumber?: number
  pageSize?: number
}

export const listServicios = (
  params: GetServiciosParams = {}
): Promise<PaginatedList<ServicioDto>> =>
  api.get('/servicios', { params })

export const getServicio = (id: number): Promise<ServicioDto> =>
  api.get(`/servicios/${id}`)

export const createServicio = (payload: ServicioPayload): Promise<number> =>
  api.post('/servicios', payload)

export const updateServicio = (id: number, payload: ServicioPayload): Promise<void> =>
  api.put(`/servicios/${id}`, payload)

export const deactivateServicio = (id: number): Promise<void> =>
  api.delete(`/servicios/${id}`)
