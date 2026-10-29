import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import { getReservas } from './reservas.api'

export const useReservas = () => {
  const { usuario } = useAuth()
  const query = useQuery({ queryKey: ['mis-reservas', usuario?.token], queryFn: getReservas, enabled: !!usuario })
  return { reservas: query.data ?? [], isLoading: query.isLoading, error: query.isError ? 'No se pudieron cargar las reservas.' : null, refetch: query.refetch }
}
