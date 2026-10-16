import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'

export interface DashboardResumen {
  habitacionesOcupadas: number
  habitacionesDisponibles: number
  reservasActivas: number
  importeReservadoMesActual: number
}

export function useDashboard() {
  const query = useQuery({
    queryKey: ['dashboard', 'resumen'],
    queryFn: async () => await api.get('/dashboard/resumen') as DashboardResumen,
  })

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? 'No se pudieron cargar los indicadores. Verifica el backend y vuelve a intentarlo.' : null,
    refetch: query.refetch,
  }
}

export function formatSoles(value: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}
