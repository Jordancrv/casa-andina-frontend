import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { planificarViaje } from './chatbot.api'
import type { ConsultaViaje, PlanViaje } from './chatbot.types'

export interface TurnoViaje {
  id: number
  consulta: ConsultaViaje
  plan?: PlanViaje
  estado: 'enviando' | 'listo' | 'error' | 'cancelado'
  error?: string
}

export function usePlanViaje() {
  const [turnos, setTurnos] = useState<TurnoViaje[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const active = useRef<{ controller: AbortController; id: number } | null>(null)
  const sequence = useRef(0)
  useEffect(() => () => active.current?.controller.abort(), [])

  const ejecutar = async (consulta: ConsultaViaje, id: number) => {
    const controller = new AbortController()
    active.current = { controller, id }
    setIsLoading(true)
    try {
      const plan = await planificarViaje(consulta, controller.signal)
      if (!controller.signal.aborted) setTurnos(current => current.map(t => t.id === id ? { ...t, plan, estado: 'listo' } : t))
    } catch (err) {
      if (controller.signal.aborted) return
      const error = axios.isAxiosError(err) && err.response?.status === 429
        ? 'Necesito una pequeña pausa. Espera un minuto y volvemos a intentarlo.'
        : axios.isAxiosError(err) && err.response?.status === 400
          ? 'Revisemos las fechas, el presupuesto y los adultos en «Datos del viaje». Después puedes enviar tu mensaje otra vez.'
          : 'Esta vez no pude conectar para preparar tus opciones. Tu conversación sigue aquí; ¿lo intentamos de nuevo?'
      setTurnos(current => current.map(t => t.id === id ? { ...t, estado: 'error', error } : t))
    } finally {
      if (active.current?.controller === controller) { active.current = null; setIsLoading(false) }
    }
  }
  const consultar = (datos: ConsultaViaje) => {
    if (active.current) return
    const historial: NonNullable<ConsultaViaje['historial']> = turnos.filter(t => t.estado === 'listo' && t.plan).slice(-4).flatMap(t => [
      { rol: 'usuario' as const, texto: `${t.consulta.mensaje}\nViaje: ${t.consulta.ciudad || 'sin ciudad elegida'}, ${t.consulta.fechaEntrada} a ${t.consulta.fechaSalida}, ${t.consulta.adultos} adultos, máximo S/ ${t.consulta.presupuestoPorNoche}/noche.`.slice(0, 1000) },
      { rol: 'asistente' as const, texto: `${t.plan!.resumen}\nOpciones: ${t.plan!.recomendaciones.map(r => `${r.sedeNombre} (${r.ciudad})`).join(', ')}.`.slice(0, 1000) },
    ])
    const consulta = { ...datos, historial }
    const id = ++sequence.current
    setTurnos(current => [...current, { id, consulta, estado: 'enviando' }])
    return ejecutar(consulta, id)
  }
  const reintentar = (turno: TurnoViaje) => {
    if (active.current) return
    setTurnos(current => current.map(t => t.id === turno.id ? { ...t, estado: 'enviando', error: undefined } : t))
    return ejecutar(turno.consulta, turno.id)
  }
  const cancelar = () => {
    const request = active.current
    if (!request) return
    request.controller.abort(); active.current = null; setIsLoading(false)
    setTurnos(current => current.map(t => t.id === request.id ? { ...t, estado: 'cancelado' } : t))
  }
  const reiniciar = () => {
    active.current?.controller.abort(); active.current = null
    setIsLoading(false); setTurnos([])
  }
  return { turnos, isLoading, consultar, cancelar, reiniciar, reintentar }
}
