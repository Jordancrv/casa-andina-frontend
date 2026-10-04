import api from '@/shared/lib/api'
import type { SedeDto, ServicioDto } from '@/shared/types/global.types'
import type { CrearReservaPayload, HabitacionDisponible, ReservaCompraRespuesta, ServicioReserva } from './compra.types'

export const getSedesCliente = async (): Promise<SedeDto[]> => {
  const response = await api.get<{ sedes: SedeDto[] }>('/catalogos') as unknown as { sedes: SedeDto[] }
  return response.sedes
}

export const getDisponibilidad = (sedeId: number, fechaCheckIn: string, fechaCheckOut: string): Promise<HabitacionDisponible[]> =>
  api.get('/reservas/disponibilidad', { params: { sedeId, fechaCheckIn, fechaCheckOut } })

export const getServiciosDeSede = async (sedeId: number): Promise<ServicioReserva[]> => {
  const response = await api.get<ServicioDto[]>('/reservas/servicios', { params: { sedeId } }) as unknown as ServicioDto[]
  return response.map(({ id, nombre, descripcion, precio }) => ({ id, nombre, descripcion, precio }))
}

export const comprarReserva = (payload: CrearReservaPayload): Promise<ReservaCompraRespuesta> =>
  api.post('/reservas', payload)
