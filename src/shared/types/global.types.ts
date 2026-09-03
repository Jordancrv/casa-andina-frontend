export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

export type Role = 'admin' | 'cliente'

export interface Hotel {
  id: string
  nombre: string
  ubicacion: string
  precioNoche: number
  estrellas: number
}

export interface Promo {
  id: string
  titulo: string
  descripcion: string
  descuento: number
  fechaInicio: string
  fechaFin: string
}