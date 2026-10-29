import type { Rol } from '@/shared/types/global.types'

// El portal interno elige su primera sección desde los permisos efectivos del servidor.
export function getRoleHomeRoute(role: Rol): string {
  return role === 'Cliente' ? '/cliente' : '/admin'
}
