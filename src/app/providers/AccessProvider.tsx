import { useEffect, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './auth-context'
import api from '@/shared/lib/api'

import { AccessContext, SECTION_PERMISSIONS, type Access } from './access-context'

export function AccessProvider({ children }: { children: ReactNode }) {
 const { usuario } = useAuth()
 const client = useQueryClient()
 const query = useQuery({ queryKey: ['accesos', usuario?.token], queryFn: async () => await api.get('/accesos/actual') as Access,
  enabled: !!usuario, retry: false, staleTime: 0, refetchInterval: 60000, refetchOnWindowFocus: true })
 useEffect(() => {
  const refresh = () => { void client.invalidateQueries({ queryKey: ['accesos'] }) }
  window.addEventListener('access:changed', refresh)
  return () => window.removeEventListener('access:changed', refresh)
 }, [client])
 const can = (p: string) => !query.isError && !!query.data?.permisos.includes(p)
 const home = usuario?.rol === 'Cliente' ? '/cliente' : Object.keys(SECTION_PERMISSIONS).find(p => can(SECTION_PERMISSIONS[p])) ?? '/admin'
 return <AccessContext.Provider value={{ can, home, data: query.data, loading: !!usuario && query.isPending, error: query.isError,
  refresh: () => { void query.refetch() } }}>{children}</AccessContext.Provider>
}
