import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useSearchParams } from 'react-router-dom'
import type { ReservaDto } from '@/shared/types/global.types'
import { getReservas } from '../reservas/reservas.api'
import { ReservaDetail } from '../reservas/ReservaDetail'
import { conectarCalendario, desconectarCalendario, getEstadoCalendario, sincronizarCalendario, type EstadoCalendario } from './calendario.api'
import { containsStay, dateKey, monthDays, parseDate, todayPeru } from './calendar-dates'
import '../cliente.css'
import './calendario.css'

const formatDate = (value: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' }).format(parseDate(value))
const errorText = (error: unknown) => axios.isAxiosError(error) && typeof error.response?.data?.title === 'string' ? error.response.data.title : 'No pudimos completar la acción. Intenta nuevamente.'
const statusClass = (status: string) => status === 'Reservado' ? 'confirmed' : status === 'Cancelada' ? 'cancelled' : status === 'Completada' ? 'completed' : 'pending'
const callbackMessages: Record<string, string> = {
  conectado: '¡Google Calendar conectado! Tus estadías se sincronizarán automáticamente. También puedes sincronizar ahora.',
  cancelado: 'La conexión se canceló. Puedes seguir usando tu calendario de reservas aquí.',
  error: 'No se completó la conexión con Google. Revisa los permisos e intenta conectarlo nuevamente.',
}

export function MiCalendario() {
  const [params, setParams] = useSearchParams()
  const [notice, setNotice] = useState(() => callbackMessages[params.get('google') ?? ''] ?? '')
  const [reservas, setReservas] = useState<ReservaDto[]>([])
  const [connection, setConnection] = useState<EstadoCalendario | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [connectionError, setConnectionError] = useState('')
  const [month, setMonth] = useState(() => { const now = parseDate(todayPeru()); return new Date(now.getFullYear(), now.getMonth(), 1, 12) })
  const [selected, setSelected] = useState(todayPeru)
  const [filter, setFilter] = useState('Todas')
  const [detail, setDetail] = useState<ReservaDto | null>(null)
  const [disconnectConfirm, setDisconnectConfirm] = useState(false)

  useEffect(() => {
    if (params.has('google')) setParams(previous => { previous.delete('google'); return previous }, { replace: true })
  }, [params, setParams])
  useEffect(() => {
    let active = true
    void Promise.allSettled([getReservas(), getEstadoCalendario()]).then(([bookings, google]) => {
      if (!active) return
      if (bookings.status === 'fulfilled') setReservas(bookings.value)
      else setError('No se pudieron cargar tus reservas. Recarga la página para intentarlo nuevamente.')
      if (google.status === 'fulfilled') setConnection(google.value)
      else setConnectionError('No pudimos consultar la conexión con Google. Tu calendario local sigue disponible.')
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const connect = async () => {
    setBusy(true); setConnectionError('')
    try {
      const { url } = await conectarCalendario()
      if (new URL(url).origin !== 'https://accounts.google.com') throw new Error('Destino no válido')
      window.location.assign(url)
    } catch (err) { setConnectionError(errorText(err)); setBusy(false) }
  }
  const sync = async () => {
    setBusy(true); setConnectionError(''); setNotice('')
    try {
      const result = await sincronizarCalendario()
      const [updated, bookings] = await Promise.all([getEstadoCalendario(), getReservas()])
      setConnection(updated); setReservas(bookings)
      setNotice(result.actualizados || result.eliminados ? `Calendario actualizado: ${result.actualizados} estadía(s) sincronizada(s) y ${result.eliminados} evento(s) retirado(s).` : 'Todo al día. Tus reservas ya están sincronizadas con Google Calendar.')
    } catch (err) {
      setConnectionError(errorText(err))
      try { setConnection(await getEstadoCalendario()) } catch { /* Keep the last known connection state. */ }
    } finally { setBusy(false) }
  }
  const disconnect = async () => {
    setBusy(true); setConnectionError('')
    try {
      await desconectarCalendario(); setConnection(await getEstadoCalendario()); setDisconnectConfirm(false)
      setNotice('Cuenta desconectada. Los eventos existentes permanecen en Google, pero ya no se actualizarán.')
    } catch (err) { setConnectionError(errorText(err)) }
    finally { setBusy(false) }
  }
  const moveMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1, 12)
    setMonth(next); setSelected(dateKey(next))
  }
  const visible = reservas.filter(r => filter === 'Todas' || r.estado === filter)
  const dayReservations = visible.filter(r => containsStay(r.fechaCheckIn, r.fechaCheckOut, selected))
  const upcoming = reservas.filter(r => r.estado === 'Reservado' && r.fechaCheckOut.slice(0, 10) > todayPeru()).sort((a, b) => a.fechaCheckIn.localeCompare(b.fechaCheckIn))
  const monthStart = dateKey(month)
  const monthEnd = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))
  const monthCount = reservas.filter(r => r.estado !== 'Cancelada' && r.fechaCheckIn.slice(0, 10) < monthEnd && r.fechaCheckOut.slice(0, 10) > monthStart).length

  return <section className="cliente-content cc-page">
    <div className="client-heading"><div><p className="cliente-eyebrow">TUS VIAJES, EN UN SOLO LUGAR</p><h1>Mi calendario</h1><p>Un vistazo a tus próximas estadías. Más tiempo para disfrutar el viaje.</p></div><Link className="calendar-plan-link" to="/cliente"><span>Planear otra escapada</span><span className="calendar-plan-link__arrow" aria-hidden="true">↗</span></Link></div>
    {notice && <div className="cc-notice" role="status">{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice('')}>×</button></div>}
    {error && <p className="client-alert" role="alert">{error}</p>}
    <section className="cc-google" aria-label="Conexión con Google Calendar">
      <span className="cc-google-icon" aria-hidden="true">31</span>
      <div className="cc-google-copy"><h2>Tu viaje también en Google Calendar <span className={connection?.conectado && !connection.requiereReconectar ? 'cc-connected' : ''}>{connection?.requiereReconectar ? 'Reconectar' : connection?.conectado ? 'Conectado' : 'Opcional'}</span></h2><p>{connection?.conectado ? 'Las reservas se actualizan cada 2 minutos mientras el servidor está activo.' : 'Conecta tu cuenta y lleva tus estadías contigo, con un recordatorio el día anterior.'}</p>{connection?.ultimaSincronizacionUtc && <small>Última sincronización: {new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(connection.ultimaSincronizacionUtc + (connection.ultimaSincronizacionUtc.endsWith('Z') ? '' : 'Z')))}</small>}</div>
      <div className="cc-google-actions">{connection?.conectado && !connection.requiereReconectar ? <><button className="client-primary" disabled={busy} onClick={() => void sync()}>{busy ? 'Procesando…' : '↻ Sincronizar ahora'}</button>{connection.urlCalendario && <a href={connection.urlCalendario} target="_blank" rel="noopener noreferrer">Abrir Google Calendar ↗</a>}</> : <button className="client-primary" disabled={busy || loading || !connection?.configurado} onClick={() => void connect()}>{busy ? 'Conectando…' : connection?.requiereReconectar ? 'Volver a conectar' : 'Conectar Google Calendar'}</button>}</div>
      {!loading && connection && !connection.configurado && <p className="cc-connection-note">La conexión con Google estará disponible cuando se complete la configuración del servidor.</p>}
      {connectionError && <p className="cc-connection-note cc-error" role="alert">{connectionError}</p>}
    </section>
    {loading ? <p className="client-state" role="status">Preparando tu calendario…</p> : !error && <>
      <div className="cc-summary"><div><span>ESTADÍAS EN ESTE MES</span><strong>{monthCount}</strong></div><div><span>PRÓXIMAS Y EN CURSO</span><strong>{upcoming.length}</strong></div><div><span>TU PRÓXIMO DESTINO</span><strong className="cc-destination">{upcoming[0]?.ciudad ?? 'Por descubrir'}</strong></div></div>
      <div className="cc-layout"><section className="cc-calendar" aria-label="Calendario de estadías">
        <header className="cc-toolbar"><div><p>AGENDA DE ESTADÍAS</p><h2 aria-live="polite">{new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(month)}</h2></div><div className="cc-month-nav"><button aria-label="Mes anterior" onClick={() => moveMonth(-1)}>‹</button><button onClick={() => { const day = todayPeru(); setMonth(new Date(parseDate(day).getFullYear(), parseDate(day).getMonth(), 1, 12)); setSelected(day) }}>Hoy</button><button aria-label="Mes siguiente" onClick={() => moveMonth(1)}>›</button></div></header>
        <div className="cc-filter"><label htmlFor="calendar-status">Mostrar</label><select id="calendar-status" value={filter} onChange={e => setFilter(e.target.value)}>{['Todas', 'Reservado', 'Pendiente', 'Completada', 'Cancelada', 'Bloqueada'].map(status => <option key={status}>{status}</option>)}</select><span>Las fechas representan noches de estadía.</span></div>
        <div className="cc-weekdays" aria-hidden="true">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <span key={d}>{d}</span>)}</div>
        <div className="cc-days">{monthDays(month).map(day => {
          const key = dateKey(day)
          const stays = visible.filter(r => containsStay(r.fechaCheckIn, r.fechaCheckOut, key))
          return <button key={key} className={`cc-day${day.getMonth() !== month.getMonth() ? ' cc-day--outside' : ''}${key === todayPeru() ? ' cc-day--today' : ''}`} aria-pressed={selected === key} aria-label={`${new Intl.DateTimeFormat('es-PE', { dateStyle: 'full' }).format(day)}: ${stays.length} estadías`} onClick={() => setSelected(key)}><time dateTime={key}>{day.getDate()}</time><span className="cc-day-stays">{stays.slice(0, 2).map(r => <span className={`cc-stay cc-stay--${statusClass(r.estado)}`} key={r.reservaId}>{r.ciudad}</span>)}{stays.length > 2 && <small>+{stays.length - 2} más</small>}</span>{stays.length > 0 && <span className="cc-mobile-count">{stays.length}<span className="cc-sr-only"> estadías</span></span>}</button>
        })}</div>
        <div className="cc-legend">{[['confirmed', 'Reservado'], ['pending', 'Pendiente / bloqueada'], ['completed', 'Completada'], ['cancelled', 'Cancelada']].map(([cls, label]) => <span key={cls}><i className={`cc-stay--${cls}`}/>{label}</span>)}</div>
      </section>
      <aside className="cc-agenda"><p className="cliente-eyebrow">TU AGENDA</p><h2>{new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long' }).format(parseDate(selected))}</h2>{dayReservations.length === 0 ? <div className="cc-empty"><span aria-hidden="true">☀</span><h3>Un día por descubrir</h3><p>No tienes estadías para esta fecha con el filtro elegido.</p><Link to="/cliente">Encuentra tu próxima escapada ↗</Link></div> : dayReservations.map(r => <article className="cc-agenda-stay" key={r.reservaId}><span className={`cc-status cc-stay--${statusClass(r.estado)}`}>{r.estado}</span><h3>{r.sedeNombre}</h3><p>{r.ciudad}</p><dl><div><dt>Entrada</dt><dd>{formatDate(r.fechaCheckIn)}</dd></div><div><dt>Salida</dt><dd>{formatDate(r.fechaCheckOut)}</dd></div></dl><small>{r.codigo}</small><button className="client-secondary" onClick={() => setDetail(r)}>Ver mi reserva ↗</button></article>)}
        {upcoming[0] && <div className="cc-next"><p>LA PRÓXIMA ESCAPADA</p><h3>{upcoming[0].ciudad}</h3><span>{formatDate(upcoming[0].fechaCheckIn)} — {formatDate(upcoming[0].fechaCheckOut)}</span><button onClick={() => { const date = parseDate(upcoming[0].fechaCheckIn); setMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12)); setSelected(dateKey(date)) }}>Ver en el calendario ↗</button></div>}
      </aside></div>
      {reservas.length === 0 && <p className="cc-no-bookings">Tu calendario está listo para tu primer viaje. <Link to="/cliente">Buscar una estadía ↗</Link></p>}
    </>}
    {connection?.conectado && <div className="cc-disconnect">{disconnectConfirm ? <><p>Se detendrá la sincronización. Tus reservas y los eventos existentes se conservarán.</p><button disabled={busy} onClick={() => void disconnect()}>Confirmar desconexión</button><button disabled={busy} onClick={() => setDisconnectConfirm(false)}>Volver</button></> : <button disabled={busy} onClick={() => setDisconnectConfirm(true)}>Desconectar Google Calendar</button>}</div>}
    {detail && <ReservaDetail reserva={detail} onClose={() => setDetail(null)} onCancelled={() => { setDetail(null); setNotice('Reserva cancelada. El pago era simulado; no se procesó una devolución real.'); void getReservas().then(setReservas).catch(() => setError('Reserva cancelada, pero no se pudo actualizar el calendario. Recarga la página.')) }}/>} 
  </section>
}
