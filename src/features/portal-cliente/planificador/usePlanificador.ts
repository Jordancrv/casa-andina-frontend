import { useState, useEffect } from 'react'
import { getPlanificadorRecomendaciones } from './planificador.api'
import type { DestinoRecomendadoDto, NivelPresupuesto, TipoClima } from '@/shared/types/global.types'

export const usePlanificador = (
  presupuesto: NivelPresupuesto,
  clima: TipoClima
) => {
  const [recomendaciones, setRecomendaciones] = useState<DestinoRecomendadoDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getPlanificadorRecomendaciones(presupuesto, clima)
        setRecomendaciones(data)
      } catch {
        setError('No se pudieron cargar las recomendaciones.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [presupuesto, clima])

  return { recomendaciones, isLoading, error }
}