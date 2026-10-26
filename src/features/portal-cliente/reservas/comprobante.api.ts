import axios from 'axios'
import api from '@/shared/lib/api'

export async function getComprobantePdf(reservaId: number, signal: AbortSignal): Promise<Blob> {
  try {
    const blob = await api.post<Blob, Blob>(`/reservas/${reservaId}/comprobante/pdf`, null, {
      responseType: 'blob', signal, timeout: 30000,
    })
    if (!blob.type.toLowerCase().includes('application/pdf') || await blob.slice(0, 5).text() !== '%PDF-')
      throw new Error('El servidor no devolvió un PDF válido. Vuelve a intentarlo.')
    return blob
  } catch (error) {
    if (signal.aborted) throw error
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      let mensaje: string | null = null
      try { mensaje = (JSON.parse(await error.response.data.text()) as { title?: string }).title ?? null } catch { /* Respuesta sin detalle legible. */ }
      if (mensaje) throw new Error(mensaje, { cause: error })
    }
    if (axios.isAxiosError(error)) throw new Error('No se pudo obtener el comprobante. Revisa tu conexión y vuelve a intentarlo.', { cause: error })
    throw error
  }
}
