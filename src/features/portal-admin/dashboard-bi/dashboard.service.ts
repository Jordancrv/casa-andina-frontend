/**
 * dashboard.service.ts
 * ---------------------------------------------------------------------------
 * Capa de acceso a datos del Dashboard BI.
 * Cada función corresponde a un endpoint del backend.
 * Las funciones retornan la data tipada directamente (el interceptor de api.ts
 * ya desenvuelve `response.data`).
 *
 * ENDPOINTS ESPERADOS EN EL BACKEND (.NET):
 *   GET /api/dashboard/kpis?periodo=30d&sedeId=1
 *   GET /api/dashboard/reservas-semana?semanas=6&sedeId=1
 *   GET /api/dashboard/ocupacion-sedes?sedeId=1
 *   GET /api/dashboard/proyeccion-demanda?sedeId=1
 *   GET /api/dashboard/canales?periodo=30d&sedeId=1
 *   GET /api/dashboard/chatbot-metricas?periodo=30d&sedeId=1
 * ---------------------------------------------------------------------------
 */

import api from '@/shared/lib/api'
import type {
  DashboardFiltros,
  DashboardKpisDto,
  ReservaSemanaSerie,
  OcupacionSedeDto,
  ProyeccionSemanaDto,
  CanalReservasDto,
  ChatbotMetricasDto,
  CancelacionMotivoDto,
} from '@/shared/types/global.types'

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Construye los query params compartidos a partir del filtro activo */
function buildParams(filtros: DashboardFiltros): Record<string, string | number> {
  const params: Record<string, string | number> = { periodo: filtros.periodo }
  if (filtros.sedeId !== null) {
    params.sedeId = filtros.sedeId
  }
  return params
}

// --------------------------------------------------------------------------
// KPIs principales
// --------------------------------------------------------------------------

/**
 * GET /api/dashboard/kpis
 * Retorna los 4 KPIs del encabezado: reservas, ingresos, ocupación, clientes.
 */
export async function fetchDashboardKpis(
  filtros: DashboardFiltros,
): Promise<DashboardKpisDto> {
  return api.get('/dashboard/kpis', { params: buildParams(filtros) })
}

// --------------------------------------------------------------------------
// Gráfico de barras — Reservas por semana
// --------------------------------------------------------------------------

/**
 * GET /api/dashboard/reservas-semana
 * Devuelve la serie de las últimas `semanas` semanas.
 * El backend calcula `alturaPctConfirmadas` y `alturaPctCanceladas`
 * normalizando respecto al máximo del período, pero el FE puede
 * recalcular si el backend los omite.
 */
export async function fetchReservasSemana(
  filtros: DashboardFiltros,
  semanas: number = 6,
): Promise<ReservaSemanaSerie[]> {
  return api.get('/dashboard/reservas-semana', {
    params: { ...buildParams(filtros), semanas },
  })
}

// --------------------------------------------------------------------------
// Barras horizontales — Ocupación por sede
// --------------------------------------------------------------------------

/**
 * GET /api/dashboard/ocupacion-sedes
 * Ordenado de mayor a menor ocupación.
 * Si sedeId está presente se devuelve un array de 1 elemento.
 */
export async function fetchOcupacionSedes(
  filtros: DashboardFiltros,
): Promise<OcupacionSedeDto[]> {
  return api.get('/dashboard/ocupacion-sedes', { params: buildParams(filtros) })
}

// --------------------------------------------------------------------------
// Barras horizontales — Motivos de Cancelación
// --------------------------------------------------------------------------

/**
 * GET /api/dashboard/cancelaciones-motivos
 * Devuelve porcentaje y conteo de los motivos de cancelación, incluyendo "Otros"
 */
export async function fetchCancelacionesMotivos(
  filtros: DashboardFiltros,
): Promise<CancelacionMotivoDto[]> {
  return api.get('/dashboard/cancelaciones-motivos', { params: buildParams(filtros) })
}

// --------------------------------------------------------------------------
// Proyección de demanda
// --------------------------------------------------------------------------

/**
 * GET /api/dashboard/proyeccion-demanda
 * Estimación de reservas para las próximas 4 semanas.
 * `confianzaPct` se usa para colorear la mini-barra de confianza.
 */
export async function fetchProyeccionDemanda(
  filtros: DashboardFiltros,
): Promise<ProyeccionSemanaDto[]> {
  return api.get('/dashboard/proyeccion-demanda', {
    params: buildParams(filtros),
  })
}

// --------------------------------------------------------------------------
// Canal de reservas
// --------------------------------------------------------------------------

/**
 * GET /api/dashboard/canales
 * Desglose Directo / OTA + ticket promedio + estadía promedio.
 */
export async function fetchCanalReservas(
  filtros: DashboardFiltros,
): Promise<CanalReservasDto> {
  return api.get('/dashboard/canales', { params: buildParams(filtros) })
}

// --------------------------------------------------------------------------
// Asistente IA — métricas del chatbot
// --------------------------------------------------------------------------

/**
 * GET /api/dashboard/chatbot-metricas
 * Consultas, reservas generadas, tasa de conversión y top budget/clima.
 */
export async function fetchChatbotMetricas(
  filtros: DashboardFiltros,
): Promise<ChatbotMetricasDto> {
  return api.get('/dashboard/chatbot-metricas', { params: buildParams(filtros) })
}
