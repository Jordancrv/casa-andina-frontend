/**
 * El planificador inteligente usa el mismo endpoint del chatbot:
 * GET /api/chatbot/recomendaciones?Presupuesto={1|2|3}&Clima={1|2|3}
 *
 * Se re-exporta la función desde chatbot.api para que el módulo del
 * planificador tenga su propio punto de importación sin duplicar código.
 */
export { getRecomendaciones as getPlanificadorRecomendaciones } from '../chatbot/chatbot.api'
export type { NivelPresupuesto, TipoClima, DestinoRecomendadoDto } from '@/shared/types/global.types'