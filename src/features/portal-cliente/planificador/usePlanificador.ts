import { useState, useEffect } from 'react'
import { getRecommendations } from './planificador.api'

export const usePlanificador = (budget: number, climate: string) => {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await getRecommendations(budget, climate)
      setRecommendations(data)
      setLoading(false)
    }
    load()
  }, [budget, climate])

  return { recommendations, loading }
}