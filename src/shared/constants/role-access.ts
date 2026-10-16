import type { Rol } from '@/shared/types/global.types'

export const ROLE_ACCESS = {
  internal: ['Superadministrador', 'Administrador', 'Recepcion', 'Operaciones', 'Mantenimiento'],
  rooms: ['Superadministrador', 'Administrador', 'Operaciones', 'Mantenimiento'],
  services: ['Superadministrador', 'Administrador', 'Operaciones'],
  dashboard: ['Administrador'],
  users: ['Administrador'],
  client: ['Cliente']
} as const satisfies Record<string, readonly Rol[]>

export function getRoleHomeRoute(role: Rol): string {
  if (role === 'Cliente') return '/cliente'
  return role === 'Administrador' ? '/admin/dashboard' : '/admin/calendario'
}
