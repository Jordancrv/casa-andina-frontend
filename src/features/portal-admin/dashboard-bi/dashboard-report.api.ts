import axios from 'axios'
import api from '@/shared/lib/api'
import type { DashboardFiltros } from '@/shared/types/global.types'

export async function getDashboardReport(periodo: DashboardFiltros['periodo'], signal: AbortSignal) {
  try {
    const blob = await api.get<Blob, Blob>('/dashboard/reporte/pdf', {
      params: { periodo }, responseType: 'blob', signal, timeout: 60000,
    })
    if (!blob.type.toLowerCase().includes('application/pdf') || await blob.slice(0, 5).text() !== '%PDF-')
      throw new Error('El servidor no devolvió un PDF válido. Vuelve a intentarlo.')
    return blob
  } catch (error) {
    if (signal.aborted) throw error
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      let message: string | null = null
      try { message = (JSON.parse(await error.response.data.text()) as { title?: string }).title ?? null } catch { /* Sin detalle legible. */ }
      if (message) throw new Error(message, { cause: error })
    }
    if (axios.isAxiosError(error)) throw new Error('No se pudo generar el reporte. Revisa tu conexión y vuelve a intentarlo.', { cause: error })
    throw error
  }
}
