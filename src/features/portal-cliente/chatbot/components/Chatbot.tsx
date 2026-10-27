import { useEffect, useRef, useState, type FormEvent } from 'react'
import { usePlanViaje } from '../usePlanViaje'
import { RecommendationCard } from './RecommendationCard'
import '../../cliente.css'
import '../chatbot.css'
import '../weather-scene.css'

const soles = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
const fecha = (value: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
const ejemplos = [
  { icon: '♡', titulo: 'Una escapada en pareja', mensaje: 'Me gustaría una escapada en pareja. ¿Qué opciones tenemos y qué deberíamos llevar según el clima?' },
  { icon: '☀', titulo: 'Un destino con menos lluvia', mensaje: 'Me gustaría evitar la lluvia. ¿Me ayudas a comparar el clima de las opciones para estas fechas?' },
  { icon: '✧', titulo: 'Cuidar mi presupuesto', mensaje: 'Quiero una escapada que cuide mi presupuesto. ¿Qué opciones disponibles me recomendarías y por qué?' },
]

export const Chatbot = () => {
  const { turnos, isLoading, consultar, cancelar, reiniciar, reintentar } = usePlanViaje()
  const [mensaje, setMensaje] = useState('')
  const log = useRef<HTMLDivElement>(null)
  const latest = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (log.current && latest.current) log.current.scrollTo({ top: latest.current.getBoundingClientRect().top - log.current.getBoundingClientRect().top + log.current.scrollTop - 18, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [turnos])
  const valido = mensaje.trim().length > 0
  const enviar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!valido || isLoading) return
    void consultar(mensaje.trim())
    setMensaje('')
    composer.current?.focus({ preventScroll: true })
  }
  const sugerir = (text: string) => { setMensaje(text); composer.current?.focus({ preventScroll: true }); composer.current?.scrollIntoView({ block: 'nearest' }) }
  return <section className={`cliente-content ca-assistant${turnos.length ? ' ca-assistant--started' : ''}`}>
    <div className="ca-assistant-layout">
      <section className="ca-chat" aria-label="Chat con el asistente de viajes">
        <p className="ca-sr-only" role="status">{isLoading ? 'Buscando recomendaciones para tu viaje.' : turnos.at(-1)?.estado === 'listo' ? 'Respuesta del asistente lista.' : ''}</p>
        <header className="ca-chat-brand-header"><div className="ca-chat-brand-copy"><p className="ca-eyebrow">CASA ANDINA · TU COMPAÑERO DE VIAJE</p><h1>Un buen viaje empieza <span>con una conversación.</span></h1><p>Inspiración, habitaciones y el clima de tu próxima escapada. Lo planeamos contigo.</p></div><div className="ca-chat-brand-actions"><div className="ca-hero-mark ca-chat-brand-mark" aria-hidden="true"><span>✦</span><i>✧</i><b>✳</b></div><button type="button" className="ca-chat-reset" disabled={turnos.length === 0} onClick={() => { reiniciar(); setMensaje(''); composer.current?.focus({ preventScroll:true }) }} aria-label="Iniciar nueva conversación">↺ <span>Nuevo chat</span></button></div></header>
        <div className="ca-chat-log" ref={log} tabIndex={0} role="region" aria-label="Mensajes y recomendaciones del viaje">
          <div className="ca-greeting"><div className="ca-message-author"><span aria-hidden="true">✦</span> TU ASISTENTE CASA ANDINA</div><div className="ca-assistant-bubble"><h3>¡Hola! Qué gusto acompañarte <span aria-hidden="true">☀</span></h3><p>¿Ya estás imaginando tu próxima escapada? Cuéntame qué te gustaría hacer y buscamos una habitación que vaya contigo.</p><p>También te mostraré el clima disponible para tus fechas, para que preparar la maleta sea un poquito más fácil.</p></div></div>
          {turnos.length === 0 && <div className="ca-starter-prompts"><p>Podemos empezar por aquí…</p>{ejemplos.map(ejemplo => <button type="button" key={ejemplo.titulo} onClick={() => sugerir(ejemplo.mensaje)}><span aria-hidden="true">{ejemplo.icon}</span><strong>{ejemplo.titulo}</strong><span aria-hidden="true">↗</span></button>)}</div>}
          {turnos.map((turno, i) => <div className="ca-chat-turn" key={turno.id} ref={i === turnos.length - 1 ? latest : undefined}>
            <div className="ca-user-message"><span>TÚ</span><p>{turno.consulta.mensaje}</p>{turno.consultaPlan && <small>{fecha(turno.consultaPlan.fechaEntrada)} – {fecha(turno.consultaPlan.fechaSalida)} · {turno.consultaPlan.adultos} adultos · {soles(turno.consultaPlan.presupuestoPorNoche)}/noche{turno.consultaPlan.ciudad ? ` · ${turno.consultaPlan.ciudad}` : ''}</small>}</div>
            <div className="ca-message-author"><span aria-hidden="true">✦</span> TU ASISTENTE CASA ANDINA</div>
            {turno.estado === 'enviando' && <div className="ca-typing" role="status"><span className="ca-typing-wave" aria-hidden="true">{[12,20,29,36,29,20,12,8,12,20,29,36,29,20,12].map((height,index) => <i key={index} style={{ height, animationDelay:`${index * -.085}s` }}/>)}</span><div><strong>Te leo, dame un momento…</strong><p>Estoy preparando una respuesta para ayudarte con tu viaje.</p></div></div>}
            {turno.estado === 'cancelado' && <div className="ca-assistant-bubble ca-chat-feedback"><p>De acuerdo, dejamos la búsqueda en pausa. Cuando quieras, seguimos planeando.</p><button type="button" disabled={isLoading} onClick={() => void reintentar(turno)}>Retomar búsqueda ↗</button></div>}
            {turno.estado === 'error' && <div className="ca-assistant-bubble ca-chat-feedback ca-chat-error" role="alert"><p>{turno.error}</p><button type="button" disabled={isLoading} onClick={() => void reintentar(turno)}>Reintentar ↗</button></div>}
            {turno.estado === 'listo' && turno.respuesta && <><div className="ca-assistant-bubble"><span className={`ca-answer-label ${turno.respuesta.usaIa ? '' : 'ca-answer-label--catalog'}`}>{turno.respuesta.usaIa ? '✦ Conversación con Gemini' : 'Asistente de viaje'}</span><p>{turno.respuesta.mensaje}</p></div>
              {turno.respuesta.plan && turno.consultaPlan && <><div className="ca-recommendations">{turno.respuesta.plan.recomendaciones.map((destino, index) => <RecommendationCard key={destino.sedeId} destino={destino} consulta={turno.consultaPlan!} index={index} old={i !== turnos.length - 1}/>)}</div><details className="ca-answer-notes"><summary>Sobre estas recomendaciones</summary>{turno.respuesta.plan.avisos.map(aviso => <p key={aviso}>{aviso}</p>)}<p>La disponibilidad se comprueba otra vez al reservar.</p></details></>}
              {i === turnos.length - 1 && turno.respuesta.sugerencias.length > 0 && <div className="ca-follow-ups" aria-label="Respuestas rápidas opcionales">{turno.respuesta.sugerencias.map(text => <button key={text} type="button" disabled={isLoading} onClick={() => void consultar(text)}>{text} ↗</button>)}</div>}
            </>}
          </div>)}
        </div>
        <form className="ca-chat-composer" onSubmit={enviar} aria-label="Enviar mensaje al asistente"><div className="ca-composer-input"><label className="ca-sr-only" htmlFor="travel-message">Tu mensaje</label><textarea ref={composer} id="travel-message" rows={2} maxLength={1000} required value={mensaje} onChange={e => setMensaje(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} placeholder={turnos.length ? 'Sigamos planeando… ¿qué te gustaría saber?' : 'Cuéntame, ¿cómo imaginas tu próxima escapada?'}/>{isLoading ? <button className="ca-chat-stop" type="button" onClick={cancelar} aria-label="Detener búsqueda">■</button> : <button className="ca-chat-send" type="submit" disabled={!valido} aria-label="Enviar mensaje">↑</button>}</div><div className="ca-composer-footer"><span>{mensaje.length}/1000</span></div></form>
      </section>
    </div>
  </section>
}
