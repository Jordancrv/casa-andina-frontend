// ---------------------------------------------------------------------------
// Contratos de respuesta — deben coincidir 1:1 con los DTOs del backend.
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedList<T> {
  items: T[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// Roles — deben coincidir con RolUsuario enum del backend
export type Rol = 'Administrador' | 'Recepcion' | 'Operaciones' | 'Mantenimiento' | 'Cliente'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Respuesta de POST /api/auth/login → LoginResponse del backend */
export interface LoginResponse {
  token: string
  nombreCompleto: string
  rol: Rol
}

/** Usuario en sesión local (construido a partir de LoginResponse + JWT claims) */
export interface UsuarioSesion {
  nombreCompleto: string
  rol: Rol
  token: string
}

// ---------------------------------------------------------------------------
// Catálogos (Tipos de Habitación, Comodidades, Sedes)
// ---------------------------------------------------------------------------

export interface TipoHabitacionDto {
  id: number
  nombre: string
  descripcion: string | null
  capacidadAdultos: number
  capacidadNinos: number
}

export interface ComodidadDto {
  id: number
  nombre: string
}

export interface SedeDto {
  id: number
  nombre: string
  ciudad: string
}

export interface CatalogosResponse {
  tiposHabitacion: TipoHabitacionDto[]
  comodidades: ComodidadDto[]
  sedes: SedeDto[]
}

// ---------------------------------------------------------------------------
// Habitaciones — alineado con HabitacionDto del backend
// ---------------------------------------------------------------------------

export interface HabitacionDto {
  id: number
  numero: string
  piso: number
  precioNoche: number
  estado: string
  fotoUrl: string | null
  sedeNombre: string
  tipoHabitacionNombre: string
  capacidadAdultos: number
  capacidadNinos: number
  comodidades: string[]
}

/** Payload para crear habitación → CreateHabitacionCommand del backend */
export interface CreateHabitacionPayload {
  sedeId: number
  tipoHabitacionId: number
  numero: string
  piso: number
  precioBase: number
  estado: string
  fotoUrl?: string
  comodidadesIds: number[]
}

// ---------------------------------------------------------------------------
// Reservas — alineado con ReservaDto del backend
// ---------------------------------------------------------------------------

export type EstadoReserva = 'Pendiente' | 'Confirmada' | 'Bloqueada' | 'Completada' | 'Cancelada'

export interface ReservaDto {
  reservaId: number
  codigo: string
  fechaCheckIn: string   // ISO 8601
  fechaCheckOut: string  // ISO 8601
  montoTotal: number
  estado: EstadoReserva
  sedeNombre: string
  ciudad: string
  habitacionesNumeros: string[]
}

// ---------------------------------------------------------------------------
// Chatbot / Planificador
// ---------------------------------------------------------------------------

export type NivelPresupuesto = 1 | 2 | 3   // 1=Economico, 2=Estandar, 3=Lujo
export type TipoClima = 1 | 2 | 3           // 1=Calido, 2=Frio, 3=Templado

export interface DestinoRecomendadoDto {
  sedeId: number
  sedeNombre: string
  ciudad: string
  region: string
  categoria: string
  precioBaseDesde: number
  descripcion: string | null
}

// ---------------------------------------------------------------------------
// Dashboard BI — DTOs alineados con los endpoints del backend
// ---------------------------------------------------------------------------

/** GET /api/dashboard/kpis
 *  Devuelve los 4 KPIs principales del período seleccionado.
 *  Params: periodo ('7d' | '30d' | 'mes') + sedeId? (null = todas) */
export interface DashboardKpisDto {
  totalReservas: number
  totalReservasPeriodoAnterior: number   // para calcular variación %
  ingresosTotalSoles: number
  ingresosPeriodoAnterior: number
  ocupacionPromedioPct: number
  ocupacionPeriodoAnterior: number
  totalClientesActivos: number
  nuevosClientesPct: number
}

/** GET /api/dashboard/reservas-semana
 *  Series de reservas confirmadas + canceladas para las últimas N semanas.
 *  Params: semanas (default 6) + sedeId? */
export interface ReservaSemanaSerie {
  semanaLabel: string        // "S-5", "S-4" … "Actual"
  confirmadas: number
  canceladas: number
  alturaPctConfirmadas: number   // calculado en FE: max=100
  alturaPctCanceladas: number
}

/** GET /api/dashboard/ocupacion-sedes
 *  Porcentaje de ocupación actual por sede, ordenado desc.
 *  Params: sedeId? (null = todas → devuelve array) */
export interface OcupacionSedeDto {
  sedeNombre: string
  ciudad: string
  ocupacionPct: number       // 0-100
  cantidad: number           // cantidad de habitaciones/reservas
}

/** GET /api/dashboard/cancelaciones-motivos
 *  Motivos de cancelación (porcentaje y cantidad).
 *  Params: periodo + sedeId? */
export interface CancelacionMotivoDto {
  motivo: string
  porcentaje: number
  cantidad: number
}

/** GET /api/dashboard/proyeccion-demanda
 *  Estimación de reservas para las próximas 4 semanas.
 *  Params: sedeId? */
export interface ProyeccionSemanaDto {
  semanaLabel: string        // "SEMANA 01" … "SEMANA 04"
  reservasProyectadas: number
  confianzaPct: number       // barra de confianza 0-100
}

/** GET /api/dashboard/canales
 *  Desglose por canal (Directo / OTA) + métricas derivadas.
 *  Params: periodo + sedeId? */
export interface CanalReservasDto {
  reservasDirectas: number
  reservasOTA: number
  totalReservas: number
  ticketPromedioSoles: number
  estadiaPromedioNoches: number
}

/** GET /api/dashboard/chatbot-metricas
 *  KPIs del asistente IA.
 *  Params: periodo + sedeId? */
export interface ChatbotMetricasDto {
  consultasRealizadas: number
  reservasGeneradas: number
  tasaConversionPct: number
  presupuestoMasConsultado: string   // "Económico" | "Estándar" | "Lujo"
  climaMasConsultado: string         // "Cálido" | "Frío" | "Templado"
}

/** Parámetros de filtro compartidos por todos los endpoints del dashboard */
export interface DashboardFiltros {
  periodo: '7d' | '30d' | 'mes'
  sedeId: number | null    // null = todas las sedes
}

/** Tipo compuesto que agrupa toda la data del dashboard (carga paralela) */
export interface DashboardData {
  kpis: DashboardKpisDto
  reservasSemana: ReservaSemanaSerie[]
  ocupacionSedes: OcupacionSedeDto[]
  cancelacionesMotivos: CancelacionMotivoDto[]
  proyeccion: ProyeccionSemanaDto[]
  canales: CanalReservasDto
  chatbot: ChatbotMetricasDto
}

/** @deprecated Usar DashboardKpisDto en su lugar */
export interface DashboardResumenDto {
  habitacionesOcupadas: number
  habitacionesDisponibles: number
  reservasActivas: number
  ingresosMesActual: number
}