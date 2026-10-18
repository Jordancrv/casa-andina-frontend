import { useState } from 'react'
import { useChatbot } from '../useChatbot'
import type { NivelPresupuesto, TipoClima } from '@/shared/types/global.types'
import '../../cliente.css'

const presupuestos: { valor: NivelPresupuesto; texto: string }[] = [
  { valor: 1, texto: 'Económico' },
  { valor: 2, texto: 'Estándar' },
  { valor: 3, texto: 'Premium' },
]
const climas: { valor: TipoClima; texto: string }[] = [
  { valor: 1, texto: 'Cálido' },
  { valor: 2, texto: 'Frío' },
  { valor: 3, texto: 'Templado' },
]
const soles = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

export const Chatbot = () => {
  const { recomendaciones, isLoading, error, buscarRecomendaciones } = useChatbot()
  const [presupuesto, setPresupuesto] = useState<NivelPresupuesto | null>(null)
  const [clima, setClima] = useState<TipoClima | null>(null)
  const consultar = () => {
    if (presupuesto && clima) void buscarRecomendaciones(presupuesto, clima)
  }

  return (
    <section className="cliente-content">
      <header className="client-heading"><div><p className="cliente-eyebrow">ASISTENTE CASA ANDINA</p><h1>Planea tu estadía</h1><p>Cuéntanos qué buscas y encontraremos sedes que se ajusten a tus preferencias.</p></div></header>
      <div className="assistant-layout">
        <section className="assistant-panel" aria-labelledby="assistant-budget-title">
          <div className="assistant-intro"><span aria-hidden="true">CA</span><div><strong>Asistente de viajes</strong><p>Selecciona tu presupuesto y el clima que prefieres.</p></div></div>
          <fieldset className="assistant-choice"><legend id="assistant-budget-title">¿Cuál es tu presupuesto?</legend><div>{presupuestos.map(item => <button type="button" key={item.valor} aria-pressed={presupuesto === item.valor} className={presupuesto === item.valor ? 'selected' : ''} onClick={() => setPresupuesto(item.valor)}>{item.texto}</button>)}</div></fieldset>
          <fieldset className="assistant-choice"><legend>¿Qué clima prefieres?</legend><div>{climas.map(item => <button type="button" key={item.valor} aria-pressed={clima === item.valor} className={clima === item.valor ? 'selected' : ''} onClick={() => setClima(item.valor)}>{item.texto}</button>)}</div></fieldset>
          <button className="client-primary" type="button" onClick={consultar} disabled={!presupuesto || !clima || isLoading}>{isLoading ? 'Buscando sedes…' : 'Ver recomendaciones'}</button>
        </section>

        <section className="assistant-results" aria-live="polite">
          <div className="section-heading"><div><p className="cliente-eyebrow">RECOMENDACIONES</p><h2>Destinos para ti</h2></div></div>
          {error && <div className="client-alert" role="alert">{error}<button type="button" className="assistant-retry" onClick={consultar} disabled={isLoading}>Reintentar</button></div>}
          {isLoading && <p className="client-state">Consultando las opciones disponibles…</p>}
          {!isLoading && !error && recomendaciones.length === 0 && <p className="client-state">Elige tus preferencias y consulta para ver las sedes recomendadas.</p>}
          {!isLoading && !error && recomendaciones.length > 0 && <div className="destination-list">{recomendaciones.map(destino => <article className="destination-row" key={destino.sedeId}><div><span className="room-category">{destino.categoria} · {destino.region}</span><h3>{destino.sedeNombre}</h3><p>{destino.ciudad}</p>{destino.descripcion && <p>{destino.descripcion}</p>}</div><div className="destination-price"><small>DESDE</small><strong>{soles(destino.precioBaseDesde)}</strong></div></article>)}</div>}
        </section>
      </div>
    </section>
  )
}
