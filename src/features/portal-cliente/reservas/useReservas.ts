import { useState, useEffect } from 'react'
import { getReservas } from './reservas.api'
import type { ReservaDto } from '@/shared/types/global.types'

export const useReservas = () => {
  const [reservas, setReservas] = useState<ReservaDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getReservas()
        setReservas(data)
      } catch {
        setError('No se pudieron cargar las reservas.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return { reservas, isLoading, error }
}