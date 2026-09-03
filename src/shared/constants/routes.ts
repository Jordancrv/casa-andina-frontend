export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CLIENTE: '/cliente',
  ADMIN: '/admin',
  DASHBOARD: '/admin/dashboard',
  HOTELES: '/admin/hoteles',
  PROMOCIONES: '/admin/promociones',
  SERVICIOS: '/admin/servicios',
  CALENDARIO: '/admin/calendario',
  USUARIOS: '/admin/usuarios',
  MIS_RESERVAS: '/cliente/reservas',
  CHATBOT: '/cliente/chatbot',
  PLANIFICADOR: '/cliente/planificador'
} as const

export type RouteKey = keyof typeof ROUTES