import { useState, useEffect } from 'react'
import { getReservas } from './reservas.api'

export const useReservas = () => {
  const [reservas, setReservas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await getReservas()
      setReservas(data)
      setLoading(false)
    }
    load()
  }, [])

  return { reservas, loading }
}