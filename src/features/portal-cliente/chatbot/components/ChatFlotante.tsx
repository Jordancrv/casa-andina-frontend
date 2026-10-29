import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConversation } from '../conversation-context'
import './chat-flotante.css'

export function ChatFlotante() {
 const [open, setOpen] = useState(false)
 const [mensaje, setMensaje] = useState('')
 const input = useRef<HTMLTextAreaElement>(null)
 const log = useRef<HTMLDivElement>(null)
 const navigate = useNavigate()
 const { turnos, isLoading, consultar, cancelar, reintentar } = useConversation()
 useEffect(() => { if (open) input.current?.focus() }, [open])
 useEffect(() => { if (open && log.current) log.current.scrollTop = log.current.scrollHeight }, [turnos, open])
 const submit = (event: FormEvent) => { event.preventDefault(); if (!mensaje.trim() || isLoading) return; void consultar(mensaje.trim()); setMensaje('') }
 const abrirAsistente = () => { setOpen(false); navigate('/cliente/asistente') }
 return <div className="float-chat">
  {open && <section className="float-chat-panel" role="dialog" aria-label="Asistente de viajes" onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}>
   <header><div className="float-chat-title"><span aria-hidden="true">✦</span><div><strong>Asistente Casa Andina</strong><small>Tu compañero de viaje</small></div></div><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar chat">×</button></header>
   <div className="float-chat-log" ref={log} role="log" aria-label="Conversación" aria-live="polite">
    <div className="float-chat-message assistant">¡Hola! Cuéntame cómo imaginas tu viaje y te ayudaré a encontrar opciones.</div>
    {turnos.map(turno => <div key={turno.id} className="float-chat-turn"><div className="float-chat-message user">{turno.consulta.mensaje}</div>
     {turno.estado === 'enviando' && <div className="float-chat-message assistant" role="status">Preparando una respuesta…</div>}
     {turno.estado === 'listo' && turno.respuesta && <><div className="float-chat-message assistant">{turno.respuesta.mensaje}</div>{turno.respuesta.plan && <button type="button" className="float-chat-plan" onClick={abrirAsistente}>Ver recomendaciones y clima en el asistente ↗</button>}</>}
     {(turno.estado === 'error' || turno.estado === 'cancelado') && <div className="float-chat-message assistant"><p>{turno.estado === 'error' ? turno.error : 'Consulta detenida.'}</p><button type="button" disabled={isLoading} onClick={() => void reintentar(turno)}>Reintentar</button></div>}
    </div>)}
   </div>
   <button type="button" className="float-chat-expand" onClick={abrirAsistente}>Abrir asistente completo ↗</button>
   <form onSubmit={submit}><label className="float-chat-sr" htmlFor="floating-chat-message">Escribe tu mensaje</label><textarea id="floating-chat-message" ref={input} rows={2} maxLength={1000} value={mensaje} onChange={e => setMensaje(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} placeholder="Escribe tu mensaje…"/>{isLoading ? <button type="button" onClick={cancelar} aria-label="Detener respuesta">■</button> : <button type="submit" disabled={!mensaje.trim()} aria-label="Enviar mensaje">↑</button>}</form>
  </section>}
  <button type="button" className="float-chat-trigger" aria-label={open ? 'Cerrar asistente' : 'Abrir asistente de viajes'} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <span aria-hidden="true">×</span> : <span className="float-assistant-mark" aria-hidden="true"><span>✦</span><i>✧</i><b>✳</b></span>}</button>
 </div>
}
