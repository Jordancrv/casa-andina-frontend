import type { ReactNode } from 'react'
import { ConversationContext } from './conversation-context'
import { usePlanViaje } from './usePlanViaje'
import { useAuth } from '@/app/providers/auth-context'

export function ConversationProvider({ children }: { children: ReactNode }) {
 const { usuario } = useAuth()
 let account: string
 try { account = usuario ? String(JSON.parse(atob(usuario.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub ?? '') : '' } catch { account = '' }
 const conversation = usePlanViaje(account)
 return <ConversationContext.Provider value={conversation}>{children}</ConversationContext.Provider>
}
