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

export function usePlanViaje() {
  const [turnos, setTurnos] = useState<TurnoViaje[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const active = useRef<{ controller: AbortController; id: number } | null>(null)
  const preferences = useRef<PreferenciasConversacion | null>(null)
  const sequence = useRef(0)
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
  const reiniciar = () => { active.current?.controller.abort(); active.current=null; preferences.current=null; setIsLoading(false); setTurnos([]) }
  return { turnos, isLoading, consultar, cancelar, reiniciar, reintentar }
}
