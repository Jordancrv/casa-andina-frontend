export interface HabitacionDisponible {
  habitacionId: number
  sedeId: number
  sedeNombre: string
  ciudad: string
  numero: string
  piso: number
  tipoHabitacion: string
  capacidadAdultos: number
  capacidadNinos: number
  precioNoche: number
  comodidades: string[]
  fotoUrl?: string | null
}

export interface ServicioReserva {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
}

export interface HuespedCompra {
  nombres: string
  apellidos: string
  correo: string
  telefono: string
  esTitular: boolean
  dni: string
  fechaNacimiento: string
  sexo: string
}

export interface CrearReservaPayload {
  sedeId: number
  fechaCheckIn: string
  fechaCheckOut: string
  habitaciones: { habitacionId: number; huespedes: HuespedCompra[] }[]
  servicios: { servicioId: number; cantidad: number }[]
  tipoComprobante: 'Boleta' | 'Factura'
  razonSocial: string | null
  ruc: string | null
  metodoPagoCodigo: string
}

export interface ReservaCompraRespuesta {
  reservaId: number
  codigoReserva: string
  estado: string
  precioTotal: number
  tipoComprobante: 'Boleta' | 'Factura'
  metodoPago: string
  estadoPago: string
  mensajePago: string
  numeroComprobante?: string | null
  comprobanteDisponible?: boolean
}

export interface MetodoPago {
  codigo: string
  nombre: string
  categoria: string
}
