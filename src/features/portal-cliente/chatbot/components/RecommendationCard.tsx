import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ConsultaViaje, PlanViaje } from '../chatbot.types'
import { safeRoomPhoto } from '../travel-weather'
import { WeatherCard } from './WeatherCard'

const soles = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

export function RecommendationCard({ destino, consulta, index, old }: {
  destino: PlanViaje['recomendaciones'][number]; consulta: ConsultaViaje; index: number; old: boolean
}) {
  const [broken, setBroken] = useState(false)
  const photo = safeRoomPhoto(destino.fotoUrl)
  return <article className="ca-recommendation">
    <div className="ca-room-photo">
      {photo && !broken ? <img src={photo} alt={`${destino.tipoHabitacion} recomendada en ${destino.sedeNombre}`} loading="lazy" onError={() => setBroken(true)}/> : <div className="ca-room-placeholder"><svg viewBox="0 0 80 64" fill="none" aria-hidden="true"><path d="M9 47V18h62v29M9 36h62M9 47v8m62-8v8M17 36V25h19v11m8 0V25h19v11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg><span>La foto de esta habitación aún no está disponible</span></div>}
      <span className="ca-room-rank">{index === 0 ? '✦ Para empezar a soñar' : `Otra opción para ti · 0${index + 1}`}</span>
      <span className="ca-room-category">{destino.categoria}</span>
    </div>
    <div className="ca-room-body"><div className="ca-room-location"><span>⌖ {destino.ciudad}</span><span>{destino.noches} {destino.noches === 1 ? 'noche' : 'noches'} · {consulta.adultos} adultos</span></div><h3>{destino.sedeNombre}</h3><p className="ca-room-type">{destino.tipoHabitacion}</p><p className="ca-room-reason">{destino.motivo}</p>{(destino.reservasRecientes ?? 0) > 0 && <p className="ca-room-popularity">{destino.reservasRecientes} reservas registradas en los últimos 90 días</p>}<WeatherCard clima={destino.clima} ciudad={destino.ciudad} entrada={consulta.fechaEntrada}/><div className="ca-room-footer"><div><strong>{soles(destino.precioPorNoche)}<small> / noche</small></strong><span>{soles(destino.totalEstadia)} por la estadía · sin extras</span></div><Link className="ca-room-book" to={`/cliente?${new URLSearchParams({ sedeId: String(destino.sedeId), entrada: consulta.fechaEntrada, salida: consulta.fechaSalida, ...(destino.habitacionId ? { habitacionId: String(destino.habitacionId), adultos: String(consulta.adultos) } : {}) })}`} aria-label={`Elegir habitación en ${destino.sedeNombre}`}>{destino.habitacionId ? "Elegir habitación" : "Ver habitaciones"} <span aria-hidden="true">↗</span></Link></div>{old && <p className="ca-room-old">Opción de una consulta anterior. El precio y la disponibilidad se comprobarán otra vez al reservar.</p>}</div>
  </article>
}
