import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ConsultaViaje, PlanViaje } from '../chatbot.types'
import { safeRoomPhoto } from '../travel-weather'
import { roomImage } from '@/shared/lib/room-image'
import { useConversation } from '../conversation-context'

const soles = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

export function RecommendationCard({ destino, consulta, index, old }: {
  destino: PlanViaje['recomendaciones'][number]; consulta: ConsultaViaje; index: number; old: boolean
}) {
  const [broken, setBroken] = useState(false)
  const { seleccionarDestino } = useConversation()
  const photo = safeRoomPhoto(destino.fotoUrl)
  return <article className="ca-recommendation">
    <div className="ca-room-photo">
      {photo && !broken ? <img src={roomImage(photo, 600)} alt={`${destino.tipoHabitacion} recomendada en ${destino.sedeNombre}`} loading="lazy" decoding="async" onError={() => setBroken(true)}/> : <div className="ca-room-placeholder"><svg viewBox="0 0 80 64" fill="none" aria-hidden="true"><path d="M9 47V18h62v29M9 36h62M9 47v8m62-8v8M17 36V25h19v11m8 0V25h19v11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg><span>La foto de esta habitación aún no está disponible</span></div>}
      <span className="ca-room-rank">{String(index + 1).padStart(2, '0')}</span>
      <span className="ca-room-category">{destino.categoria}</span>
    </div>
    <div className="ca-room-body"><div className="ca-room-location"><span>{destino.noches} {destino.noches === 1 ? 'noche' : 'noches'} · {consulta.adultos} {consulta.adultos === 1 ? 'adulto' : 'adultos'}</span></div><h3>{destino.tipoHabitacion}</h3><p className="ca-room-type">{destino.sedeNombre}</p><p className="ca-room-reason">{destino.motivo}</p>{(destino.reservasRecientes ?? 0) > 0 && <p className="ca-room-popularity">{destino.reservasRecientes} reservas recientes en esta sede</p>}<div className="ca-room-footer"><div><strong>{soles(destino.precioPorNoche)}<small> / noche</small></strong><span>{soles(destino.totalEstadia)} por la estadía · sin extras</span></div><Link className="ca-room-book" onClick={() => seleccionarDestino(destino.ciudad)} to={`/cliente?${new URLSearchParams({ sedeId: String(destino.sedeId), entrada: consulta.fechaEntrada, salida: consulta.fechaSalida, ...(destino.habitacionId ? { habitacionId: String(destino.habitacionId), adultos: String(consulta.adultos) } : {}) })}`} aria-label={`Elegir ${destino.tipoHabitacion} en ${destino.sedeNombre}`}>{destino.habitacionId ? "Elegir habitación" : "Ver habitaciones"} <span aria-hidden="true">↗</span></Link></div>{old && <p className="ca-room-old">Opción de una consulta anterior. El precio y la disponibilidad se comprobarán otra vez al reservar.</p>}</div>
  </article>
}
