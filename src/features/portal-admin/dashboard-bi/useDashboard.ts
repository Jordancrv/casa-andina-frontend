/**
 * useDashboard.ts
 * ---------------------------------------------------------------------------
 * Hook que gestiona el estado y la carga paralela de todos los datos del
 * Dashboard BI. Cuando el backend no está disponible, retorna MOCK_DATA para
 * que el UI sea siempre visible durante el desarrollo.
 *
 * USO:
 *   const { data, loading, error, filtros, setFiltros, refetch } = useDashboard()
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect, useCallback } from 'react'
import type {
  DashboardData,
  DashboardFiltros,
  DashboardKpisDto,
  ReservaSemanaSerie,
  OcupacionSedeDto,
  ProyeccionSemanaDto,
  CanalReservasDto,
  ChatbotMetricasDto,
  CancelacionMotivoDto,
} from '@/shared/types/global.types'
import {
  fetchDashboardKpis,
  fetchReservasSemana,
  fetchOcupacionSedes,
  fetchProyeccionDemanda,
  fetchCanalReservas,
  fetchChatbotMetricas,
  fetchCancelacionesMotivos,
} from './dashboard.service'

// ---------------------------------------------------------------------------
// Datos mock — se usan como fallback mientras el endpoint no esté listo.
// QUITAR o condicionar con import.meta.env.DEV cuando el backend esté listo.
// ---------------------------------------------------------------------------

const MOCK_KPIS: DashboardKpisDto = {
  totalReservas: 1248,
  totalReservasPeriodoAnterior: 1110,
  ingresosTotalSoles: 486200,
  ingresosPeriodoAnterior: 447400,
  ocupacionPromedioPct: 78.4,
  ocupacionPeriodoAnterior: 74.2,
  totalClientesActivos: 2936,
  nuevosClientesPct: 6.1,
}

const MOCK_RESERVAS_SEMANA: ReservaSemanaSerie[] = [
  { semanaLabel: 'S-5', confirmadas: 130, canceladas: 38, alturaPctConfirmadas: 52, alturaPctCanceladas: 36 },
  { semanaLabel: 'S-4', confirmadas: 153, canceladas: 44, alturaPctConfirmadas: 61, alturaPctCanceladas: 42 },
  { semanaLabel: 'S-3', confirmadas: 165, canceladas: 47, alturaPctConfirmadas: 66, alturaPctCanceladas: 45 },
  { semanaLabel: 'S-2', confirmadas: 180, canceladas: 50, alturaPctConfirmadas: 72, alturaPctCanceladas: 48 },
  { semanaLabel: 'S-1', confirmadas: 198, canceladas: 55, alturaPctConfirmadas: 79, alturaPctCanceladas: 53 },
  { semanaLabel: 'Actual', confirmadas: 220, canceladas: 62, alturaPctConfirmadas: 88, alturaPctCanceladas: 59 },
]

const MOCK_OCUPACION: OcupacionSedeDto[] = [
  { sedeNombre: 'Casa Andina Premium Miraflores', ciudad: 'Lima',     ocupacionPct: 91, cantidad: 140 },
  { sedeNombre: 'Casa Andina Select Cusco Plaza',  ciudad: 'Cusco',    ocupacionPct: 87, cantidad: 110 },
  { sedeNombre: 'Casa Andina Premium Arequipa',    ciudad: 'Arequipa', ocupacionPct: 82, cantidad: 95 },
  { sedeNombre: 'Casa Andina Select Trujillo',     ciudad: 'Trujillo', ocupacionPct: 76, cantidad: 85 },
  { sedeNombre: 'Casa Andina Select Piura',        ciudad: 'Piura',    ocupacionPct: 71, cantidad: 75 },
  { sedeNombre: 'Casa Andina Standard Puno',       ciudad: 'Puno',     ocupacionPct: 65, cantidad: 60 },
  { sedeNombre: 'Casa Andina Standard Tacna',      ciudad: 'Tacna',    ocupacionPct: 58, cantidad: 45 },
]

const MOCK_CANCELACIONES: CancelacionMotivoDto[] = [
  { motivo: 'Cambio De Planes/Fechas', porcentaje: 35, cantidad: 48 },
  { motivo: 'Problemas De Salud', porcentaje: 25, cantidad: 34 },
  { motivo: 'Presupuesto/Economía', porcentaje: 15, cantidad: 20 },
  { motivo: 'Problemas De Transporte', porcentaje: 10, cantidad: 14 },
  { motivo: 'Otros', porcentaje: 15, cantidad: 20 },
]

const MOCK_PROYECCION: ProyeccionSemanaDto[] = [
  { semanaLabel: 'SEMANA 01', reservasProyectadas: 238, confianzaPct: 73 },
  { semanaLabel: 'SEMANA 02', reservasProyectadas: 264, confianzaPct: 81 },
  { semanaLabel: 'SEMANA 03', reservasProyectadas: 291, confianzaPct: 89 },
  { semanaLabel: 'SEMANA 04', reservasProyectadas: 307, confianzaPct: 94 },
]

const MOCK_CANALES: CanalReservasDto = {
  reservasDirectas: 734,
  reservasOTA: 514,
  totalReservas: 1248,
  ticketPromedioSoles: 389.58,
  estadiaPromedioNoches: 2.8,
}

const MOCK_CHATBOT: ChatbotMetricasDto = {
  consultasRealizadas: 486,
  reservasGeneradas: 92,
  tasaConversionPct: 18.9,
  presupuestoMasConsultado: 'Estándar',
  climaMasConsultado: 'Templado',
}

const MOCK_DATA: DashboardData = {
  kpis: MOCK_KPIS,
  reservasSemana: MOCK_RESERVAS_SEMANA,
  ocupacionSedes: MOCK_OCUPACION,
  cancelacionesMotivos: MOCK_CANCELACIONES,
  proyeccion: MOCK_PROYECCION,
  canales: MOCK_CANALES,
  chatbot: MOCK_CHATBOT,
}

// ---------------------------------------------------------------------------
// Filtros por defecto
// ---------------------------------------------------------------------------

export const FILTROS_DEFAULT: DashboardFiltros = {
  periodo: '30d',
  sedeId: null,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  filtros: DashboardFiltros
  setFiltros: (f: DashboardFiltros) => void
  refetch: () => void
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<DashboardFiltros>(FILTROS_DEFAULT)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Carga paralela de todos los endpoints
      const [kpis, reservasSemana, ocupacionSedes, cancelacionesMotivos, proyeccion, canales, chatbot] =
        await Promise.all([
          fetchDashboardKpis(filtros),
          fetchReservasSemana(filtros),
          fetchOcupacionSedes(filtros),
          fetchCancelacionesMotivos(filtros),
          fetchProyeccionDemanda(filtros),
          fetchCanalReservas(filtros),
          fetchChatbotMetricas(filtros),
        ])
      setData({ kpis, reservasSemana, ocupacionSedes, cancelacionesMotivos, proyeccion, canales, chatbot })
    } catch (err) {
      console.warn('[DashboardBI] Backend no disponible — usando datos mock', err)
      // ⚠️ Fallback a mock data durante el desarrollo.
      // Reemplazar por: setError('Error al cargar datos del dashboard')
      // cuando el backend esté completamente implementado.
      setData(MOCK_DATA)
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, filtros, setFiltros, refetch: load }
}

// ---------------------------------------------------------------------------
// Helpers de formato (reutilizables en los componentes)
// ---------------------------------------------------------------------------

/** Formatea número como soles: S/ 486,200 */
export function formatSoles(valor: number): string {
  if (valor >= 1_000_000) return `S/ ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000)    return `S/ ${(valor / 1_000).toFixed(1)}K`
  return `S/ ${valor.toFixed(0)}`
}

/** Calcula la variación porcentual entre dos períodos */
export function calcVariacion(actual: number, anterior: number): number {
  if (anterior === 0) return 0
  return ((actual - anterior) / anterior) * 100
}

/** Formatea variación con símbolo de flecha */
export function formatVariacion(pct: number): string {
  const signo = pct >= 0 ? '↑' : '↓'
  return `${signo} ${Math.abs(pct).toFixed(1)}%`
}
