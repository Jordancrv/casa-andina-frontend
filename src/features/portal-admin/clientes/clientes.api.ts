import axios from 'axios'
import api from '@/shared/lib/api'
import type { ActividadCliente, CatalogosCrm, CategoriaCliente, ClienteDatos, ClientesCrm } from './clientes.types'

export interface ClientesFiltros {
  buscar: string
  estado: '' | 'Activo' | 'Inactivo'
  sedeId: string
  categoria: '' | CategoriaCliente
  actividad: ActividadCliente
  pageNumber: number
}
export const getClientes = (filtros: ClientesFiltros, signal: AbortSignal): Promise<ClientesCrm> =>
  api.get('/clientes', { signal, params: { ...filtros, buscar: filtros.buscar || undefined,
    estado: filtros.estado || undefined, sedeId: filtros.sedeId || undefined,
    categoria: filtros.categoria || undefined, actividad: filtros.actividad || undefined, pageSize: 10 } })
export const getCatalogosCrm = (signal: AbortSignal): Promise<CatalogosCrm> => api.get('/clientes/catalogos', { signal })
export const crearCliente = (datos: ClienteDatos): Promise<{ clienteId: number }> => api.post('/clientes', datos)
export const actualizarCliente = (id: number, datos: ClienteDatos): Promise<void> => api.put(`/clientes/${id}`, datos)

export function crmError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { title?: string; errors?: Record<string, string[]> } | undefined
    if (body?.errors) return Object.values(body.errors).flat().slice(0, 3).join(' ')
    if (body?.title) return body.title
  }
  return 'No se pudo guardar el cliente. Revisa los datos e inténtalo de nuevo.'
}
