import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-context'
import api from '@/shared/lib/api'

interface SedePopular { id: number; nombre: string; ciudad: string; categoria: string; reservasRecientes: number; habitacionId: number; tipoHabitacion: string; precioNoche: number }
interface Viaje { entrada: string; noches: number; huespedes: number; presupuesto: number }
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const addDays = (value: string, days: number) => { const [y, m, d] = value.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10) }
const money = (amount: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)

export function AsistentePublico() {
 const [open, setOpen] = useState(false)
 const [view, setView] = useState<'inicio' | 'preguntas' | 'sedes'>('inicio')
 const [entrada, setEntrada] = useState('')
 const [noches, setNoches] = useState('')
 const [huespedes, setHuespedes] = useState('')
 const [presupuesto, setPresupuesto] = useState('')
 const [viaje, setViaje] = useState<Viaje | null>(null)
 const closeButton = useRef<HTMLButtonElement>(null)
 const trigger = useRef<HTMLButtonElement>(null)
 const navigate = useNavigate()
 const { usuario } = useAuth()
 const query = useQuery({ queryKey: ['sedes-recomendadas', viaje], queryFn: async () => await api.get('/sedes/recomendaciones', { params: viaje }) as SedePopular[], enabled: open && view === 'sedes' && !!viaje, retry: false, staleTime: 30 * 1000 })
 useEffect(() => { if (open) closeButton.current?.focus() }, [open])
 const cerrar = () => { setOpen(false); trigger.current?.focus() }
 const buscar = (event: FormEvent) => { event.preventDefault(); setViaje({ entrada, noches: Number(noches), huespedes: Number(huespedes), presupuesto: Number(presupuesto) }); setView('sedes') }
 const elegir = (sede: SedePopular) => {
  if (!viaje) return
  const seleccion = { sedeRecomendadaId: sede.id, habitacionId: sede.habitacionId, entrada: viaje.entrada, salida: addDays(viaje.entrada, viaje.noches), adultos: viaje.huespedes }
  const params = new URLSearchParams({ sedeId: String(seleccion.sedeRecomendadaId), habitacionId: String(seleccion.habitacionId), entrada: seleccion.entrada, salida: seleccion.salida, adultos: String(seleccion.adultos) })
  if (usuario?.rol === 'Cliente') navigate(`/cliente?${params}`)
  else if (usuario) navigate('/admin')
  else navigate('/registro', { state: seleccion })
 }
 return <div className="public-chat">
  {open && <section className="public-chat-panel" role="dialog" aria-labelledby="public-chat-title" onKeyDown={event => { if (event.key === 'Escape') cerrar() }}>
   <header><div><strong id="public-chat-title">Asistente Casa Andina</strong><span>Tu compañero de viaje</span></div><button ref={closeButton} type="button" aria-label="Cerrar asistente" onClick={cerrar}>×</button></header>
   <div className="public-chat-body"><div className="public-chat-bubble">¡Hola! Cuéntame sobre tu viaje y te mostraré opciones disponibles entre nuestras sedes.</div>
    {view === 'inicio' && <button type="button" className="public-chat-option" onClick={() => setView('preguntas')}>Buscar mi estadía <span aria-hidden="true">↗</span></button>}
    {view === 'preguntas' && <form className="public-chat-questions" onSubmit={buscar}>
     <p>¿Cuándo y con quién viajarás?</p>
     <label>Fecha de entrada<input type="date" required min={today()} max={addDays(today(), 365)} value={entrada} onChange={e => setEntrada(e.target.value)} /></label>
     <label>¿Cuántas noches?<input type="number" required min="1" max="30" step="1" inputMode="numeric" placeholder="Ej. 2" value={noches} onChange={e => setNoches(e.target.value)} /></label>
     <label>¿Cuántos huéspedes adultos?<input type="number" required min="1" max="8" step="1" inputMode="numeric" placeholder="Ej. 2" value={huespedes} onChange={e => setHuespedes(e.target.value)} /></label>
     <label>Presupuesto máximo por noche (S/)<input type="number" required min="1" max="10000" step="0.01" inputMode="decimal" placeholder="Ej. 350" value={presupuesto} onChange={e => setPresupuesto(e.target.value)} /></label>
     <p className="public-chat-note">Buscaremos una habitación para los adultos indicados. Puedes registrar más huéspedes dentro de su capacidad al reservar.</p>
     <button type="submit" className="public-chat-search">Ver recomendaciones ↗</button><button type="button" className="public-chat-text" onClick={() => setView('inicio')}>← Volver</button>
    </form>}
    {view === 'sedes' && viaje && <>
     <p className="public-chat-note">{viaje.noches} {viaje.noches === 1 ? 'noche' : 'noches'} · {viaje.huespedes} {viaje.huespedes === 1 ? 'adulto' : 'adultos'} · hasta {money(viaje.presupuesto)} por noche. Priorizamos sedes por reservas recientes.</p>
     {query.isLoading && <p role="status">Buscando habitaciones disponibles…</p>}
     {query.isError && <p role="alert">No pudimos cargar las recomendaciones. <button type="button" onClick={() => void query.refetch()}>Reintentar</button></p>}
     {query.data?.length === 0 && <p>No encontramos habitaciones con esos datos. Prueba otras fechas o un presupuesto diferente.</p>}
     {query.data?.map((sede, index) => <article className="public-chat-sede" key={sede.id}><span>0{index + 1} · {sede.ciudad}</span><strong>{sede.nombre}</strong><small>{sede.categoria} · {sede.reservasRecientes} {sede.reservasRecientes === 1 ? 'reserva' : 'reservas'} recientes</small><small>{sede.tipoHabitacion} · {money(sede.precioNoche)} por noche</small><button type="button" onClick={() => elegir(sede)}>{usuario?.rol === 'Cliente' ? 'Elegir habitación' : usuario ? 'Ir al panel' : 'Registrarme y elegir'} <span aria-hidden="true">↗</span></button></article>)}
     <p className="public-chat-note">Reservas de los últimos 90 días en estado reservado o completado. La disponibilidad y el precio se vuelven a comprobar al reservar.</p>
     <button type="button" className="public-chat-text" onClick={() => setView('preguntas')}>← Cambiar datos</button>
    </>}
   </div><footer>Respuestas predeterminadas</footer>
  </section>}
  <button ref={trigger} className="public-chat-trigger" type="button" aria-label={open ? 'Cerrar asistente' : 'Abrir asistente de viajes'} aria-expanded={open} onClick={open ? cerrar : () => setOpen(true)}>{open ? <span aria-hidden="true">×</span> : <span className="public-chat-mark" aria-hidden="true"><span>✦</span><i>✧</i><b>✳</b></span>}</button>
 </div>
}
