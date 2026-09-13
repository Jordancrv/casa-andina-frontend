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
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardResumenDto {
  habitacionesOcupadas: number
  habitacionesDisponibles: number
  reservasActivas: number
  ingresosMesActual: number
}