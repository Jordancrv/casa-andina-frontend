import { createContext, useContext } from 'react'
import type { usePlanViaje } from './usePlanViaje'

export const ConversationContext = createContext<ReturnType<typeof usePlanViaje> | null>(null)
export function useConversation() {
 const conversation = useContext(ConversationContext)
 if (!conversation) throw new Error('El asistente requiere el contexto de conversación.')
 return conversation
}
