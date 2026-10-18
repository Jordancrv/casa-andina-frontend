import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import type { CanalReservasDto, DashboardFiltros, DashboardKpisDto, OcupacionSedeDto, ReservaSemanaSerie } from '@/shared/types/global.types'

export interface DashboardBi {
  sedeNombre: string
  kpis: DashboardKpisDto
  reservasSemana: ReservaSemanaSerie[]
  ocupacionSedes: OcupacionSedeDto[]
  canceladasPeriodo: number
  canales: CanalReservasDto
}

export function useDashboard(periodo: DashboardFiltros['periodo']) {
  const query = useQuery({
    queryKey: ['dashboard', 'bi', periodo],
    queryFn: async () => await api.get('/dashboard/bi', { params: { periodo } }) as DashboardBi,
  })

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? 'No se pudieron cargar los indicadores. Verifica el backend y vuelve a intentarlo.' : null,
    refetch: query.refetch,
  }
}

export function formatSoles(value: number): string {
  if (value >= 1_000_000) return `S/ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `S/ ${(value / 1_000).toFixed(1)}K`
  return `S/ ${value.toFixed(0)}`
}

export function formatVariacion(value: number): string {
  return `${value >= 0 ? '↑' : '↓'} ${Math.abs(value).toFixed(1)}%`
}
