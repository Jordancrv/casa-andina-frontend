import type { ReactNode } from 'react'
import { ConversationContext } from './conversation-context'
import { usePlanViaje } from './usePlanViaje'

export function ConversationProvider({ children }: { children: ReactNode }) {
 const conversation = usePlanViaje()
 return <ConversationContext.Provider value={conversation}>{children}</ConversationContext.Provider>
}
