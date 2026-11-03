export interface ConsultaViaje {
  mensaje: string
  fechaEntrada: string
  fechaSalida: string
  presupuestoPorNoche: number
  adultos: number
  ciudad: string | null
  historial?: { rol: 'usuario' | 'asistente'; texto: string }[]
}

export interface PreferenciasConversacion {
  fechaEntrada: string | null
  fechaSalida: string | null
  presupuestoPorNoche: number | null
  adultos: number | null
  ciudad: string | null
  destinoFlexible: boolean
  evitarLluvia?: boolean
}
export interface RespuestaConversacion {
  mensaje: string
  usaIa: boolean
  preferencias: PreferenciasConversacion
  plan: PlanViaje | null
  sugerencias: string[]
  atractivos?: { ciudad: string; lugares: string[]; fuenteUrl: string } | null
  atractivosAdicionales?: { ciudad: string; lugares: string[]; fuenteUrl: string }[] | null
}
export interface ConsultaConversacion {
  mensaje: string
  preferencias: PreferenciasConversacion | null
  historial: { rol: 'usuario' | 'asistente'; texto: string }[]
}

export interface ClimaViaje {
  estado: 'disponible' | 'parcial' | 'fuera_de_rango' | 'sin_ubicacion' | 'no_disponible'
  aviso: string
  fuenteUrl: string | null
  consultadoEn: string | null
  dias: { fecha: string; minimaC: number; maximaC: number; probabilidadLluvia: number | null; codigoTiempo?: number | null }[]
}

export interface PlanViaje {
  resumen: string
  usaIa: boolean
  generadoEn: string
  filtroLluvia?: boolean
  recomendaciones: {
    sedeId: number
    sedeNombre: string
    ciudad: string
    categoria: string
    precioPorNoche: number
    totalEstadia: number
    noches: number
    tipoHabitacion: string
    motivo: string
    clima: ClimaViaje
    habitacionId?: number | null
    fotoUrl?: string | null
    reservasRecientes?: number
    climaFavorable?: boolean
    motivoFiltroClima?: string | null
  }[]
  avisos: string[]
}
