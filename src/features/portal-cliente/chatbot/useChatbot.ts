import { useState } from 'react'
import { getRecomendaciones } from '../chatbot.api'
import type { DestinoRecomendadoDto, NivelPresupuesto, TipoClima } from '@/shared/types/global.types'

export const useChatbot = () => {
  const [recomendaciones, setRecomendaciones] = useState<DestinoRecomendadoDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscarRecomendaciones = async (
    presupuesto: NivelPresupuesto,
    clima: TipoClima
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getRecomendaciones(presupuesto, clima)
      setRecomendaciones(data)
    } catch {
      setError('No se pudieron cargar las recomendaciones. Intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return { recomendaciones, isLoading, error, buscarRecomendaciones }
}