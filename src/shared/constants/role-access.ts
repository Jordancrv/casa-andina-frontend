import type { Rol } from '@/shared/types/global.types'

export const ROLE_ACCESS = {
  internal: ['Superadministrador', 'Administrador', 'Recepcion', 'Operaciones', 'Mantenimiento'],
  rooms: ['Superadministrador', 'Administrador', 'Operaciones', 'Mantenimiento'],
  services: ['Superadministrador', 'Administrador', 'Operaciones'],
  dashboard: ['Administrador'],
  users: ['Administrador'],
  reception: ['Administrador', 'Recepcion'],
  client: ['Cliente']
} as const satisfies Record<string, readonly Rol[]>

const ROLE_SECTIONS: readonly { label: string; roles: readonly Rol[] }[] = [
  { label: 'Dashboard', roles: ROLE_ACCESS.dashboard },
  { label: 'Recepción', roles: ROLE_ACCESS.reception },
  { label: 'Sedes', roles: ROLE_ACCESS.dashboard },
  { label: 'Habitaciones', roles: ROLE_ACCESS.rooms },
  { label: 'Calendario', roles: ROLE_ACCESS.internal },
  { label: 'Clientes', roles: ROLE_ACCESS.dashboard },
  { label: 'Usuarios', roles: ROLE_ACCESS.users },
  { label: 'Reportes', roles: ROLE_ACCESS.dashboard },
  { label: 'Servicios', roles: ROLE_ACCESS.services },
  { label: 'Portal del cliente', roles: ROLE_ACCESS.client },
]

export function getVisibleSectionsForRoles(roles: readonly string[]): string[] {
  return ROLE_SECTIONS
    .filter(section => section.roles.some(role => roles.includes(role)))
    .map(section => section.label)
}

export function getRoleHomeRoute(role: Rol): string {
  if (role === 'Cliente') return '/cliente'
  return role === 'Administrador' ? '/admin/dashboard' : role === 'Recepcion' ? '/admin/recepcion' : '/admin/calendario'
}
