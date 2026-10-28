import api from '@/shared/lib/api'

export interface EstadoCalendario {
  configurado: boolean
  conectado: boolean
  requiereReconectar: boolean
  ultimaSincronizacionUtc: string | null
  urlCalendario: string | null
}
export interface ResultadoSincronizacion { actualizados: number; eliminados: number; sincronizadoUtc: string }
export const getEstadoCalendario = (): Promise<EstadoCalendario> => api.get('/calendario')
export const conectarCalendario = (): Promise<{ url: string }> => api.post('/calendario/google/conectar', {}, { withCredentials: true })
export const sincronizarCalendario = (): Promise<ResultadoSincronizacion> => api.post('/calendario/sincronizar', {}, { timeout: 120000 })
export const desconectarCalendario = (): Promise<void> => api.delete('/calendario/google')
