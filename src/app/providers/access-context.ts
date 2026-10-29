import { createContext, useContext } from 'react'
export interface Access { usuarioId: number; sedeId: number | null; roles: string[]; permisos: string[] }
export const SECTION_PERMISSIONS: Record<string, string> = {
 '/admin/dashboard': 'dashboard.ver', '/admin/calendario': 'calendario.ver', '/admin/recepcion': 'recepcion.ver',
 '/admin/clientes': 'clientes.ver', '/admin/usuarios': 'usuarios.ver', '/admin/habitaciones': 'habitaciones.ver',
 '/admin/servicios': 'servicios.ver', '/admin/comodidades': 'comodidades.ver', '/admin/reportes': 'reportes.ver',
 '/admin/roles': 'roles.ver', '/admin/sedes': 'sedes.ver',
}
export const AccessContext = createContext({ can: (() => false) as (permission: string) => boolean, loading: true, error: false, data: undefined as Access | undefined, refresh: () => {}, home: '/admin' })

export function useAccess() { return useContext(AccessContext) }
