import { useId, useRef } from 'react'
import type { ConsultaViaje, PlanViaje } from '../chatbot.types'
import { RecommendationCard } from './RecommendationCard'
import { WeatherCard } from './WeatherCard'
import { useConversation } from '../conversation-context'

type Opcion = PlanViaje['recomendaciones'][number]

function Ciudad({ opciones, consulta, old, mostrarMotivo }: { opciones: Opcion[]; consulta: ConsultaViaje; old: boolean; mostrarMotivo: boolean }) {
  const carrusel = useRef<HTMLDivElement>(null)
  const carouselId = useId()
  const ciudad = opciones[0].ciudad
  const { consultar, isLoading } = useConversation()
  const motivos = [...new Set(opciones.map(opcion => opcion.motivoFiltroClima).filter(Boolean))]
  const mover = (direccion: number) => {
    const elemento = carrusel.current
    if (!elemento) return
    const tarjeta = elemento.querySelector<HTMLElement>('.ca-recommendation')
    const distancia = (tarjeta?.getBoundingClientRect().width ?? elemento.clientWidth) + 12
    elemento.scrollBy({ left: direccion * distancia, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  return <section className="ca-city-group" aria-label={`Opciones en ${ciudad}`}>
    <header className="ca-city-heading"><div><p>DESTINO</p><h3>{ciudad}</h3></div><span>{opciones.length} {opciones.length === 1 ? 'habitación disponible' : 'habitaciones disponibles'}</span></header>
    {mostrarMotivo && motivos.map(motivo => <p className="ca-weather-filter-reason" key={motivo}>{motivo}</p>)}
    <button type="button" className="ca-city-attractions" disabled={isLoading} onClick={() => void consultar(`¿Qué atractivos puedo visitar en ${ciudad}?`)}>Conocer atractivos de {ciudad} ↗</button>
    <div className="ca-city-content">
      <div className="ca-city-weather"><WeatherCard clima={opciones[0].clima} ciudad={ciudad} entrada={consulta.fechaEntrada} /></div>
      <div className="ca-city-rooms"><div className="ca-city-rooms-heading"><div><p>ELIGE TU ESTADÍA</p><h4>Habitaciones disponibles</h4></div>{opciones.length > 1 && <div className="ca-carousel-controls"><button type="button" onClick={() => mover(-1)} aria-controls={carouselId} aria-label={`Habitaciones anteriores en ${ciudad}`}>←</button><button type="button" onClick={() => mover(1)} aria-controls={carouselId} aria-label={`Habitaciones siguientes en ${ciudad}`}>→</button></div>}</div>
        <div className="ca-room-carousel" id={carouselId} ref={carrusel} role="region" aria-label={`Habitaciones disponibles en ${ciudad}`} tabIndex={0}>
          {opciones.map((opcion, index) => <RecommendationCard key={`${opcion.sedeId}-${opcion.habitacionId ?? index}`} destino={opcion} consulta={consulta} index={index} old={old} />)}
        </div>
      </div>
    </div>
  </section>
}

export function CityRecommendations({ opciones, consulta, old, mostrarMotivo = false }: { opciones: Opcion[]; consulta: ConsultaViaje; old: boolean; mostrarMotivo?: boolean }) {
  const grupos = new Map<string, Opcion[]>()
  for (const opcion of opciones) {
    const clave = opcion.ciudad.trim().toLocaleLowerCase('es-PE')
    const grupo = grupos.get(clave) ?? []
    grupo.push(opcion)
    grupos.set(clave, grupo)
  }
  return <div className="ca-city-groups">{[...grupos.entries()].map(([ciudad, habitaciones]) => <Ciudad key={ciudad} opciones={habitaciones} consulta={consulta} old={old} mostrarMotivo={mostrarMotivo}/>)}</div>
}
