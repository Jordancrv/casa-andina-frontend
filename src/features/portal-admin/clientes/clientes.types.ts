export type CategoriaCliente = 'Ocasional' | 'Frecuente' | 'VIP'
export type ActividadCliente = '' | 'ConReservasActivas' | 'NuevosMes'
export interface Cliente {
  clienteId: number
  nombre: string
  tipoPersona: 'Natural' | 'Jurídica'
  correoAcceso: string | null
  correoNotificacion: string | null
  totalReservas: number
  importeReservado: number
  importePagadoSimulado: number
  estado: 'Activo' | 'Inactivo'
  fechaRegistro: string
  categoria: CategoriaCliente
  estadiasCompletadas: number
  reservasActivas: number
  documentoTipo: string | null
  documentoNumero: string | null
  telefono: string | null
  sedeReferencia: string | null
  sedeRegistroId: number | null
  nombres: string | null
  apellidos: string | null
  razonSocial: string | null
  nombreComercial: string | null
  tipoDocumentoId: number | null
  historial: { reservaId: number; codigoReserva: string; estado: string; fechaCheckIn: string; fechaCheckOut: string; importe: number; sede: string }[]
}
export interface ClientesCrm {
  items: Cliente[]
  totalCount: number
  pageNumber: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  kpis: { totalClientes: number; conReservasActivas: number; nuevosEsteMes: number }
}
export interface CatalogosCrm {
  sedes: { id: number; nombre: string; ciudad: string }[]
  tiposDocumento: { id: number; codigo: string; nombre: string; tipoPersonaPermitida: string; longitudMinima: number; longitudMaxima: number }[]
  puedeElegirSede: boolean
  sedeAsignadaId: number | null
}
export interface ClienteDatos {
  tipoPersona: 'N' | 'J'
  nombre: string
  apellidos: string | null
  nombreComercial: string | null
  tipoDocumentoId: number
  numeroDocumento: string
  correoNotificacion: string | null
  telefono: string | null
  estado: 'Activo' | 'Inactivo'
  sedeRegistroId: number | null
}
