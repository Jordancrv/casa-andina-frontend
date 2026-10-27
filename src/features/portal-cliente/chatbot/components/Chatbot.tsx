import { useEffect, useRef, useState, type FormEvent } from 'react'
import { usePlanViaje } from '../usePlanViaje'
import { getSedesCliente } from '../../reservas/compra.api'
import { addDays, nightsBetween, peruToday } from '../travel-dates'
import { RecommendationCard } from './RecommendationCard'
import '../../cliente.css'
import '../chatbot.css'

const soles = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
const fecha = (value: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
const ejemplos = [
  { icon: '♡', titulo: 'Una escapada en pareja', mensaje: 'Me gustaría una escapada en pareja. ¿Qué opciones tenemos y qué deberíamos llevar según el clima?' },
  { icon: '☀', titulo: 'Un destino con menos lluvia', mensaje: 'Me gustaría evitar la lluvia. ¿Me ayudas a comparar el clima de las opciones para estas fechas?' },
  { icon: '✧', titulo: 'Cuidar mi presupuesto', mensaje: 'Quiero una escapada que cuide mi presupuesto. ¿Qué opciones disponibles me recomendarías y por qué?' },
]
const seguimiento = ['¿Qué llevar en la maleta?', 'Ayúdame a comparar las opciones', '¿Cuál tiene menos lluvia?']

export const Chatbot = () => {
  const { turnos, isLoading, consultar, cancelar, reiniciar, reintentar } = usePlanViaje()
  const [mensaje, setMensaje] = useState('')
  const [entrada, setEntrada] = useState(() => addDays(peruToday(), 1))
  const [salida, setSalida] = useState(() => addDays(peruToday(), 3))
  const [presupuesto, setPresupuesto] = useState('500')
  const [adultos, setAdultos] = useState('2')
  const [ciudad, setCiudad] = useState('')
  const [ciudades, setCiudades] = useState<string[]>([])
  const [catalogError, setCatalogError] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(() => window.matchMedia('(min-width: 981px)').matches)
  const log = useRef<HTMLDivElement>(null)
  const latest = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const tripCard = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let mounted = true
    getSedesCliente().then(sedes => { if (mounted) setCiudades([...new Set(sedes.map(s => s.ciudad))].sort()) })
      .catch(() => { if (mounted) setCatalogError(true) })
    return () => { mounted = false }
  }, [])
  useEffect(() => {
    if (log.current && latest.current) log.current.scrollTo({ top: latest.current.getBoundingClientRect().top - log.current.getBoundingClientRect().top + log.current.scrollTop - 18, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [turnos])
  const noches = nightsBetween(entrada, salida)
  const fechasValidas = entrada >= peruToday() && entrada <= addDays(peruToday(), 365) && noches >= 1 && noches <= 30
  const datosValidos = fechasValidas && Number(presupuesto) >= 1 && Number(presupuesto) <= 10000 && Number.isInteger(Number(adultos)) && Number(adultos) >= 1 && Number(adultos) <= 8
  const valido = mensaje.trim().length > 0 && datosValidos
  const enviar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!valido || isLoading) return
    void consultar({ mensaje: mensaje.trim(), fechaEntrada: entrada, fechaSalida: salida, presupuestoPorNoche: Number(presupuesto), adultos: Number(adultos), ciudad: ciudad || null })
    if (window.matchMedia('(max-width: 620px)').matches) setSettingsOpen(false)
    setMensaje('')
    composer.current?.focus({ preventScroll: true })
  }
  const sugerir = (text: string) => { setMensaje(text); composer.current?.focus({ preventScroll: true }); composer.current?.scrollIntoView({ block: 'nearest' }) }
  return <section className={`cliente-content ca-assistant${turnos.length ? ' ca-assistant--started' : ''}`}>
    <header className="ca-assistant-hero"><div><p className="ca-eyebrow">CASA ANDINA · TU COMPAÑERO DE VIAJE</p><h1>Un buen viaje empieza <span>con una conversación.</span></h1><p>Inspiración, habitaciones y el clima de tu próxima escapada. Lo planeamos contigo.</p></div><div className="ca-hero-mark" aria-hidden="true"><span>✦</span><i>✧</i><b>✳</b></div></header>
    <div className="ca-assistant-layout">
      <aside className="ca-trip-sidebar" aria-label="Preferencias del viaje">
        <div className="ca-trip-card" ref={tripCard}><button className="ca-trip-toggle" type="button" aria-expanded={settingsOpen} aria-controls="ca-trip-fields" onClick={() => setSettingsOpen(current => !current)}><span><span className="ca-trip-icon" aria-hidden="true">⌁</span><strong>Datos del viaje</strong></span><span aria-hidden="true">{settingsOpen ? '−' : '+'}</span></button>
          <p className="ca-trip-description">Tú eliges los detalles. Yo te ayudo a encontrar el lugar.</p>
          {!settingsOpen && <p className="ca-trip-summary">{ciudad || 'Todos los destinos'} · {fechasValidas ? `${fecha(entrada)} – ${fecha(salida)}` : 'Revisa las fechas'} · {adultos} adultos</p>}
          <fieldset id="ca-trip-fields" hidden={!settingsOpen} disabled={isLoading} className="ca-trip-fields"><legend className="ca-sr-only">Configura tu estadía</legend>
            <label htmlFor="travel-city">¿A dónde vamos?</label><select id="travel-city" value={ciudad} onChange={e => setCiudad(e.target.value)}><option value="">Ayúdame a elegir</option>{ciudades.map(c => <option key={c} value={c}>{c}</option>)}</select>
            {catalogError && <p className="ca-field-help">No pude cargar las ciudades. Aun así, podemos buscar entre todos los destinos.</p>}
            <div className="ca-field-pair"><label>Entrada<input type="date" required min={peruToday()} max={addDays(peruToday(), 365)} value={entrada} onChange={e => { const value = e.target.value; setEntrada(value); if (value && value >= salida) setSalida(addDays(value, 2)) }}/></label><label>Salida<input type="date" required min={entrada ? addDays(entrada, 1) : peruToday()} max={entrada ? addDays(entrada, 30) : undefined} value={salida} onChange={e => setSalida(e.target.value)}/></label></div>
            <label htmlFor="travel-budget">Tu presupuesto por noche</label><div className="ca-money-input"><span>S/</span><input id="travel-budget" type="number" required min="1" max="10000" step="0.01" value={presupuesto} onChange={e => setPresupuesto(e.target.value)}/></div>
            <label htmlFor="travel-adults">Adultos por habitación</label><select id="travel-adults" value={adultos} onChange={e => setAdultos(e.target.value)}>{Array.from({length:8}, (_, i) => <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'adulto' : 'adultos'}</option>)}</select>
            <div className="ca-trip-budget"><span>Tu escapada, de un vistazo</span><strong>{datosValidos ? `${noches} ${noches === 1 ? 'noche' : 'noches'} · hasta ${soles(Number(presupuesto) * noches)}` : 'Revisemos los datos del viaje'}</strong><small>Una habitación · sin servicios adicionales</small></div>
            <p className="ca-field-help">Ajusta estos datos para cambiar fechas, ciudad o presupuesto en tu próxima consulta.</p>
          </fieldset>
        </div>
        <div className="ca-trip-tip"><span aria-hidden="true">✦</span><strong>Un poquito de inspiración</strong><p>Cuéntame cómo imaginas tu viaje: una pausa en pareja, conocer otro destino o elegir según el clima.</p><div><span>Fotos del catálogo</span><span>Clima por día</span></div></div>
      </aside>
      <section className="ca-chat" aria-label="Chat con el asistente de viajes">
        <p className="ca-sr-only" role="status">{isLoading ? 'Buscando recomendaciones para tu viaje.' : turnos.at(-1)?.estado === 'listo' ? `Respuesta lista. ${turnos.at(-1)?.plan?.recomendaciones.length ?? 0} opciones de alojamiento para comparar.` : ''}</p>
        <header className="ca-chat-header"><div><span className="ca-assistant-avatar" aria-hidden="true">✦</span><div><h2>Tu asistente de viaje</h2><p>Casa Andina <span>· Conversemos sobre tu próxima estadía</span></p></div></div><button type="button" className="ca-chat-reset" disabled={turnos.length === 0} onClick={() => { reiniciar(); setMensaje(''); composer.current?.focus() }} aria-label="Iniciar nueva conversación">↺ <span>Nuevo chat</span></button></header>
        <div className="ca-chat-log" ref={log} tabIndex={0} role="region" aria-label="Mensajes y recomendaciones del viaje">
          <div className="ca-greeting"><div className="ca-message-author"><span aria-hidden="true">✦</span> TU ASISTENTE CASA ANDINA</div><div className="ca-assistant-bubble"><h3>¡Hola! Qué gusto acompañarte <span aria-hidden="true">☀</span></h3><p>¿Ya estás imaginando tu próxima escapada? Cuéntame qué te gustaría hacer y buscamos una habitación que vaya contigo.</p><p>También te mostraré el clima disponible para tus fechas, para que preparar la maleta sea un poquito más fácil.</p></div></div>
          {turnos.length === 0 && <div className="ca-starter-prompts"><p>Podemos empezar por aquí…</p>{ejemplos.map(ejemplo => <button type="button" key={ejemplo.titulo} onClick={() => sugerir(ejemplo.mensaje)}><span aria-hidden="true">{ejemplo.icon}</span><strong>{ejemplo.titulo}</strong><span aria-hidden="true">↗</span></button>)}</div>}
          {turnos.map((turno, i) => <div className="ca-chat-turn" key={turno.id} ref={i === turnos.length - 1 ? latest : undefined}>
            <div className="ca-user-message"><span>TÚ</span><p>{turno.consulta.mensaje}</p><small>{fecha(turno.consulta.fechaEntrada)} – {fecha(turno.consulta.fechaSalida)} · {turno.consulta.adultos} adultos · {soles(turno.consulta.presupuestoPorNoche)}/noche{turno.consulta.ciudad ? ` · ${turno.consulta.ciudad}` : ''}</small></div>
            <div className="ca-message-author"><span aria-hidden="true">✦</span> TU ASISTENTE CASA ANDINA</div>
            {turno.estado === 'enviando' && <div className="ca-typing" role="status"><span className="ca-typing-dots" aria-hidden="true"><i/><i/><i/></span><div><strong>Estoy buscando tu próxima escapada…</strong><p>Reviso habitaciones y consulto el clima para tus fechas.</p></div></div>}
            {turno.estado === 'cancelado' && <div className="ca-assistant-bubble ca-chat-feedback"><p>De acuerdo, dejamos la búsqueda en pausa. Cuando quieras, seguimos planeando.</p><button type="button" disabled={isLoading} onClick={() => void reintentar(turno)}>Retomar búsqueda ↗</button></div>}
            {turno.estado === 'error' && <div className="ca-assistant-bubble ca-chat-feedback ca-chat-error" role="alert"><p>{turno.error}</p><button type="button" disabled={isLoading} onClick={() => void reintentar(turno)}>Reintentar ↗</button></div>}
            {turno.estado === 'listo' && turno.plan && <><div className="ca-assistant-bubble"><span className={`ca-answer-label ${turno.plan.usaIa ? '' : 'ca-answer-label--catalog'}`}>{turno.plan.usaIa ? '✦ Recomendaciones con Gemini' : 'Opciones del catálogo · IA no disponible'}</span><p>{turno.plan.resumen}</p></div>
              <div className="ca-recommendations">{turno.plan.recomendaciones.map((destino, index) => <RecommendationCard key={destino.sedeId} destino={destino} consulta={turno.consulta} index={index} old={i !== turnos.length - 1}/>)}</div>
              <details className="ca-answer-notes"><summary>Sobre estas recomendaciones</summary>{turno.plan.avisos.map(aviso => <p key={aviso}>{aviso}</p>)}{turno.plan.usaIa && <p>Explicación generada con IA. Los precios, las fotos y la disponibilidad provienen del catálogo. Revisa los detalles antes de reservar.</p>}<p>Consultado {new Date(turno.plan.generadoEn).toLocaleString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. La disponibilidad puede cambiar.</p></details>
              {i === turnos.length - 1 && turno.plan.recomendaciones.length > 0 && <div className="ca-follow-ups" aria-label="Preguntas para continuar">{seguimiento.map(text => <button key={text} type="button" onClick={() => sugerir(text)}>{text} ↗</button>)}</div>}
            </>}
          </div>)}
        </div>
        <form className="ca-chat-composer" onSubmit={enviar} aria-label="Enviar mensaje al asistente"><div className="ca-composer-context"><span>⌁ {ciudad || 'Destino por descubrir'} · {fechasValidas ? `${noches} noches` : 'Revisa las fechas'} · {soles(Number(presupuesto) || 0)}/noche</span><button type="button" onClick={() => { setSettingsOpen(true); tripCard.current?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) }}>Editar viaje</button></div><div className="ca-composer-input"><label className="ca-sr-only" htmlFor="travel-message">Tu mensaje</label><textarea ref={composer} id="travel-message" rows={2} maxLength={1000} required value={mensaje} onChange={e => setMensaje(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} placeholder={turnos.length ? 'Sigamos planeando… ¿qué te gustaría saber?' : 'Cuéntame, ¿cómo imaginas tu próxima escapada?'} aria-describedby="ca-composer-help"/>{isLoading ? <button className="ca-chat-stop" type="button" onClick={cancelar} aria-label="Detener búsqueda">■</button> : <button className="ca-chat-send" type="submit" disabled={!valido} aria-label="Enviar mensaje">↑</button>}</div><div className="ca-composer-footer"><span id="ca-composer-help">{!datosValidos ? 'Revisa los datos del viaje para continuar.' : 'Enter para enviar · Shift + Enter para una nueva línea'}</span><span>{mensaje.length}/1000</span></div><p className="ca-chat-privacy">Puedes conversar sin reservar. El historial se conserva solo mientras estés en esta pantalla.</p></form>
      </section>
    </div>
  </section>
}
