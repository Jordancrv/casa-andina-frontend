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
export type Rol = 'Superadministrador' | 'Administrador' | 'Recepcion' | 'Operaciones' | 'Mantenimiento' | 'Personal' | 'Cliente'

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
  sedeId: number
  tipoHabitacionId: number
  numero: string
  piso: number
  precioNoche: number
  estado: string
  fotoUrl: string | null
  sedeNombre: string
  tipoHabitacionNombre: string
  capacidadAdultos: number
  capacidadNinos: number
  comodidadesIds: number[]
  comodidades: string[]
  activo: boolean
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

export type UpdateHabitacionPayload = CreateHabitacionPayload

// ---------------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------------

export interface ServicioDto {
  puedeEditar?: boolean
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  sedesIds: number[]
  sedes: string[]
  activo: boolean
}

export interface ServicioPayload {
  nombre: string
  descripcion?: string
  precio: number
  sedesIds: number[]
}

// ---------------------------------------------------------------------------
// Reservas — alineado con ReservaDto del backend
// ---------------------------------------------------------------------------

export type EstadoReserva = 'Pendiente' | 'Reservado' | 'Bloqueada' | 'Completada' | 'Cancelada'

export interface ReservaDto {
  estadoEstadia?: string
  reservaId: number
  codigo: string
  fechaCheckIn: string   // ISO 8601
  fechaCheckOut: string  // ISO 8601
  montoTotal: number
  estado: EstadoReserva
  sedeNombre: string
  ciudad: string
  habitacionesNumeros: string[]
  pagos: PagoReservaDto[]
  comprobanteDisponible?: boolean
  tipoComprobante?: 'Boleta' | 'Factura' | null
  numeroComprobante?: string | null
}

export interface PagoReservaDto {
  pagoId: number
  metodoPago: string
  estado: string
  importe: number
  moneda: string
  fechaCreacion: string
  montoAplicado: number
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

/** Métricas devueltas por GET /api/dashboard/bi para el periodo y sede autorizada. */
export interface DashboardKpisDto {
  totalReservas: number
  totalReservasPeriodoAnterior: number
  importeReservadoSoles: number
  importeReservadoPeriodoAnterior: number
  ocupacionActualPct: number
  totalClientesActivos: number
  clientesPeriodoAnterior: number
}

/** Serie de reservas confirmadas y canceladas de las últimas seis semanas. */
export interface ReservaSemanaSerie {
  semanaLabel: string        // "S-5", "S-4" … "Actual"
  confirmadas: number
  canceladas: number
  alturaPctConfirmadas: number   // calculado en FE: max=100
  alturaPctCanceladas: number
}

/** Ocupación actual de la sede del usuario autenticado. */
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

/** Desglose de canales y promedios reservados en el periodo seleccionado. */
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
