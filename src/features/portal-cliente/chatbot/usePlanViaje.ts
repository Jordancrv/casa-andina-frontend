import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { conversarViaje } from './chatbot.api'
import type { ConsultaConversacion, ConsultaViaje, PreferenciasConversacion, RespuestaConversacion } from './chatbot.types'

export interface TurnoViaje {
  id: number
  consulta: ConsultaConversacion
  respuesta?: RespuestaConversacion
  consultaPlan?: ConsultaViaje
  estado: 'enviando' | 'listo' | 'error' | 'cancelado'
  error?: string
}

interface ChatGuardado { id: string; titulo: string; turnos: TurnoViaje[]; preferencias: PreferenciasConversacion | null }
interface SesionChats { turnos: TurnoViaje[]; preferencias: PreferenciasConversacion | null; anteriores: ChatGuardado[] }

export function usePlanViaje(account: string) {
  const storageKey = account ? `casa-andina-chats-${account}` : ''
  const [saved] = useState<SesionChats>(() => {
    try { const raw = storageKey && sessionStorage.getItem(storageKey); return raw ? JSON.parse(raw) as SesionChats : { turnos: [], preferencias: null, anteriores: [] } }
    catch { return { turnos: [], preferencias: null, anteriores: [] } }
  })
  const [turnos, setTurnos] = useState<TurnoViaje[]>(() => (saved.turnos ?? []).map(t => t.estado === 'enviando' ? { ...t, estado:'cancelado' } : t))
  const [anteriores, setAnteriores] = useState<ChatGuardado[]>(saved.anteriores ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const active = useRef<{ controller: AbortController; id: number } | null>(null)
  const preferences = useRef<PreferenciasConversacion | null>(saved.preferencias ?? null)
  const sequence = useRef(Math.max(0, ...((saved.turnos ?? []).map(t => t.id))))
  useEffect(() => {
    if (!storageKey) return
    try { sessionStorage.setItem(storageKey, JSON.stringify({ turnos, preferencias: preferences.current, anteriores })) } catch { /* El chat sigue funcionando sin almacenamiento disponible. */ }
  }, [storageKey, turnos, anteriores])
  useEffect(() => () => active.current?.controller.abort(), [])
  const ejecutar = async (consulta: ConsultaConversacion, id: number) => {
    const controller = new AbortController()
    active.current = { controller, id }; setIsLoading(true)
    try {
      const respuesta = await conversarViaje(consulta, controller.signal)
      if (controller.signal.aborted) return
      preferences.current = respuesta.preferencias
      const p = respuesta.preferencias
      const consultaPlan: ConsultaViaje | undefined = respuesta.plan && p.fechaEntrada && p.fechaSalida && p.adultos && p.presupuestoPorNoche
        ? { mensaje: consulta.mensaje, fechaEntrada: p.fechaEntrada.slice(0,10), fechaSalida: p.fechaSalida.slice(0,10), adultos:p.adultos, presupuestoPorNoche:p.presupuestoPorNoche, ciudad:p.ciudad } : undefined
      setTurnos(current => current.map(t => t.id === id ? { ...t, respuesta, consultaPlan, estado:'listo' } : t))
    } catch (err) {
      if (controller.signal.aborted) return
      const error = axios.isAxiosError(err) && err.response?.status === 429
        ? 'Necesito una pequeña pausa. Espera un minuto y seguimos conversando.'
        : 'Esta vez no pude conectar. Tu mensaje sigue aquí; puedes volver a intentarlo.'
      setTurnos(current => current.map(t => t.id === id ? { ...t, estado:'error', error } : t))
    } finally {
      if (active.current?.controller === controller) { active.current=null; setIsLoading(false) }
    }
  }
  const consultar = (mensaje: string) => {
    if (active.current || !mensaje.trim()) return
    const historial: ConsultaConversacion['historial'] = turnos.filter(t => t.estado === 'listo' && t.respuesta).slice(-4).flatMap(t => [
      { rol:'usuario' as const, texto:t.consulta.mensaje.slice(0,1000) },
      { rol:'asistente' as const, texto:t.respuesta!.mensaje.slice(0,1000) },
    ])
    const consulta = { mensaje:mensaje.trim(), preferencias:preferences.current, historial }
    const id = ++sequence.current
    setTurnos(current => [...current, { id, consulta, estado:'enviando' }])
    return ejecutar(consulta, id)
  }
  const reintentar = (turno: TurnoViaje) => {
    if (active.current) return
    const consulta = { ...turno.consulta, preferencias:preferences.current }
    setTurnos(current => current.map(t => t.id === turno.id ? { ...t, consulta, estado:'enviando', error:undefined } : t))
    return ejecutar(consulta, turno.id)
  }
  const cancelar = () => {
    const request=active.current
    if (!request) return
    request.controller.abort(); active.current=null; setIsLoading(false)
    setTurnos(current => current.map(t => t.id === request.id ? { ...t, estado:'cancelado' } : t))
  }
  const guardarActual = (): ChatGuardado | null => {
    const persistibles = turnos.filter(t => t.estado !== 'enviando')
    if (!persistibles.length) return null
    return { id: crypto.randomUUID(), titulo: persistibles[0].consulta.mensaje.slice(0, 65), turnos: persistibles, preferencias: preferences.current }
  }
  const cambiarChat = (chat?: ChatGuardado) => {
    active.current?.controller.abort(); active.current = null; setIsLoading(false)
    const actual = guardarActual()
    setAnteriores(current => [...(actual ? [actual] : []), ...current.filter(item => item.id !== chat?.id)].slice(0, 20))
    preferences.current = chat?.preferencias ?? null
    sequence.current = Math.max(0, ...(chat?.turnos.map(t => t.id) ?? []))
    setTurnos(chat?.turnos ?? [])
  }
  const reiniciar = () => cambiarChat()
  const seleccionarDestino = (ciudad: string) => {
    if (!preferences.current) return
    preferences.current = { ...preferences.current, ciudad, destinoFlexible: false }
    try { if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify({ turnos, preferencias: preferences.current, anteriores })) } catch { /* La conversación sigue disponible en memoria. */ }
  }
  const seleccionarChat = (id: string) => { const chat = anteriores.find(item => item.id === id); if (chat) cambiarChat(chat) }
  return { turnos, isLoading, consultar, cancelar, reiniciar, reintentar, anteriores, seleccionarChat, seleccionarDestino }
}
