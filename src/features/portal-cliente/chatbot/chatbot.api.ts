import api from '@/shared/lib/api'
import type { ConsultaViaje, PlanViaje } from './chatbot.types'
import type { DestinoRecomendadoDto, NivelPresupuesto, TipoClima } from '@/shared/types/global.types'

/**
 * GET /api/chatbot/recomendaciones
 * Requiere JWT.
 * Parámetros: Presupuesto (enum NivelPresupuesto: 1=Economico, 2=Estandar, 3=Lujo)
 *             Clima       (enum TipoClima: 1=Calido, 2=Frio, 3=Templado)
 */
export const getRecomendaciones = (
  presupuesto: NivelPresupuesto,
  clima: TipoClima
): Promise<DestinoRecomendadoDto[]> =>
  api.get('/chatbot/recomendaciones', { params: { Presupuesto: presupuesto, Clima: clima } })

export const planificarViaje = (consulta: ConsultaViaje, signal: AbortSignal): Promise<PlanViaje> =>
  api.post('/chatbot/planificar', consulta, { signal, timeout: 35000 })
