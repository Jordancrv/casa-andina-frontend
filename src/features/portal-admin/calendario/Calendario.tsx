import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import { useAuth } from '@/app/providers/auth-context'
import { getSedeIdFromToken } from '@/shared/lib/jwt'
import type { SedeDto } from '@/shared/types/global.types'
import './calendario.css'

interface ReservaCalendario {
  fechaCheckIn: string
  fechaCheckOut: string
  estado: string
  nombreReservante: string | null
}

interface HabitacionCalendario {
  habitacionId: number
  numero: string
  piso: number
  tipoHabitacion: string
  estadoHabitacion: string
  reservas: ReservaCalendario[]
}

const DAY_MS = 86_400_000
const peruToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date())
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}
const addDays = (value: string, days: number) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}
const initialRange = () => {
  const desde = peruToday()
  return { desde, hasta: addDays(desde, 30) }
}
const utcDate = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00Z`)
const daysApart = (from: string, to: string) => Math.round((utcDate(to).getTime() - utcDate(from).getTime()) / DAY_MS)
const dayLabel = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-PE', { ...options, timeZone: 'UTC' }).format(date)
const bookingLabel = (start: string, end: string) =>
  `${dayLabel(utcDate(start), { day: 'numeric', month: 'short' })} – ${dayLabel(utcDate(end), { day: 'numeric', month: 'short' })}`

export const Calendario = () => {
  const { usuario } = useAuth()
  const [sedeSeleccionada, setSedeSeleccionada] = useState('')
  const [rango, setRango] = useState(initialRange)
  const sedeAsignada = usuario ? getSedeIdFromToken(usuario.token) : null
  const puedeVerTodasLasSedes = usuario?.rol === 'Superadministrador'
  const faltaSedeAsignada = !puedeVerTodasLasSedes && sedeAsignada === null
  const diasRango = rango.desde && rango.hasta
    ? (Date.parse(`${rango.hasta}T00:00:00Z`) - Date.parse(`${rango.desde}T00:00:00Z`)) / 86_400_000
    : 0
  const rangoValido = diasRango > 0 && diasRango <= 366
  const sedesQuery = useQuery({
    queryKey: ['calendario', 'sedes'],
    queryFn: async () => await api.get('/catalogos') as unknown as { sedes: SedeDto[] }
  })
  const sedesDisponibles = sedesQuery.data?.sedes ?? []
  const sedes = faltaSedeAsignada
    ? []
    : sedesDisponibles.filter(sede => sedeAsignada === null || sede.id === sedeAsignada)
  const sedeId = sedes.some(sede => String(sede.id) === sedeSeleccionada)
    ? sedeSeleccionada
    : String(sedes[0]?.id ?? '')
  const ocupacionQuery = useQuery({
    queryKey: ['calendario', 'ocupacion', sedeId, rango.desde, rango.hasta],
    enabled: Boolean(sedeId) && rangoValido,
    queryFn: async () => await api.get('/habitaciones/calendario-reservas', {
      params: { sedeId, fechaDesde: rango.desde, fechaHasta: rango.hasta }
    }) as unknown as HabitacionCalendario[]
  })
  const habitaciones = ocupacionQuery.data ?? []
  const error = faltaSedeAsignada
    ? 'Tu cuenta no tiene una sede asignada. Contacta a la administración.'
    : sedesQuery.isError
      ? 'No se pudieron cargar las sedes.'
    : ocupacionQuery.isError
      ? 'No se pudo consultar la ocupación. Verifica tu acceso y el rango de fechas.'
      : ''
  const consultando = sedesQuery.isLoading || ocupacionQuery.isFetching

  const habitacionesReservadas = habitaciones.filter(habitacion => habitacion.reservas.length > 0).length
  const dias = rangoValido
    ? Array.from({ length: diasRango }, (_, index) => new Date(utcDate(rango.desde).getTime() + index * DAY_MS))
    : []

  return (
    <section className="cal-page">
      <header className="cal-heading">
        <div><p className="cal-eyebrow">OPERACIÓN HOTELERA</p><h1>Reservas y ocupación</h1><p>Consulta qué habitaciones están reservadas por sede y fechas.</p></div>
        <div className="cal-summary" aria-label="Resumen del rango seleccionado" aria-live="polite">
          <span className="cal-summary-label">Habitaciones con reservas</span>
          <div className="cal-summary-value"><strong>{consultando ? '—' : error || !rangoValido ? '—' : habitacionesReservadas}</strong><span>de {consultando || error || !rangoValido ? '—' : habitaciones.length} registradas</span></div>
          <div className="cal-summary-footer"><span className="cal-summary-dot" aria-hidden="true" /><span>{consultando ? 'Actualizando resumen…' : error || !rangoValido ? 'Resumen no disponible' : `${habitaciones.reduce((total, room) => total + room.reservas.length, 0)} reservas en el rango seleccionado`}</span></div>
        </div>
      </header>

      <div className="cal-filters">
        <label>Sede<select value={sedeId} onChange={event => setSedeSeleccionada(event.target.value)}>
          {sedes.length === 0 && <option value="">{faltaSedeAsignada ? 'Sin sede asignada' : 'Sin sedes'}</option>}
          {sedes.map(sede => <option key={sede.id} value={sede.id}>{sede.nombre} · {sede.ciudad}</option>)}
        </select></label>
        <label>Desde<input type="date" value={rango.desde} onChange={event => setRango(current => ({ ...current, desde: event.target.value }))} /></label>
        <label>Fin del rango<input type="date" min={rango.desde} value={rango.hasta} onChange={event => setRango(current => ({ ...current, hasta: event.target.value }))} /></label>
      </div>

      {!rangoValido && <p className="cal-message cal-error" role="alert">El rango debe terminar después de la fecha inicial y no superar 366 días.</p>}
      {rangoValido && error && <p className="cal-message cal-error" role="alert">{error}</p>}
      {consultando && rangoValido && <p className="cal-message">Consultando habitaciones…</p>}
      {rangoValido && !consultando && !error && sedes.length === 0 && <p className="cal-message">No hay sedes disponibles.</p>}
      {rangoValido && !consultando && !error && sedes.length > 0 && habitaciones.length === 0 && <p className="cal-message">No hay habitaciones registradas para esta sede.</p>}

      {rangoValido && !consultando && !error && habitaciones.length > 0 && <>
        <div className="cal-legend"><span><i className="is-confirmada" /> Reservado</span><span><i className="is-pendiente" /> Pendiente</span><span>La fecha de salida no cuenta como noche ocupada. Solo se muestra el titular, sin datos de contacto.</span></div>
        <p className="cal-message cal-block-note">Los bloqueos por arreglo o mantenimiento aún no aparecen en la línea de tiempo: el modelo actual no guarda periodo ni motivo del bloqueo.</p>
        <div className="cal-timeline-scroll" role="region" aria-label="Calendario de habitaciones reservadas" tabIndex={0}>
          <div className="cal-timeline" style={{ gridTemplateColumns: `210px repeat(${dias.length}, 44px)` }}>
            <div className="cal-timeline-room-head">HABITACIÓN</div>
            {dias.map(day => <div className="cal-day-head" key={day.toISOString()}><span>{dayLabel(day, { weekday: 'short' }).replace('.', '')}</span><strong>{dayLabel(day, { day: '2-digit' })}</strong></div>)}
            {habitaciones.map(habitacion => <div className="cal-timeline-row" key={habitacion.habitacionId} style={{ gridTemplateColumns: `210px repeat(${dias.length}, 44px)` }}>
              <div className="cal-room-cell"><strong>{habitacion.numero}</strong><span>{habitacion.tipoHabitacion} · Piso {habitacion.piso}</span><small>{habitacion.estadoHabitacion}</small></div>
              {dias.map((day, index) => <div className="cal-day-cell" key={day.toISOString()} style={{ gridColumn: index + 2 }} />)}
              {habitacion.reservas.map(reserva => {
                const start = Math.max(0, daysApart(rango.desde, reserva.fechaCheckIn))
                const end = Math.min(dias.length, daysApart(rango.desde, reserva.fechaCheckOut))
                if (end <= start) return null
                const estadoReserva = reserva.estado?.toLowerCase() ?? ''
                const estado = estadoReserva === 'reservado' ? 'confirmada' : estadoReserva === 'pendiente' ? 'pendiente' : 'otro'
                const nombreReservante = reserva.nombreReservante || 'Titular no disponible'
                return <div className={`cal-booking-bar is-${estado}`} key={`${habitacion.habitacionId}-${reserva.fechaCheckIn}-${reserva.fechaCheckOut}`} style={{ left: `calc(210px + ${start} * 44px)`, width: `calc(${end - start} * 44px - 4px)` }} title={`${reserva.estado || 'Estado no informado'}: ${nombreReservante} · ${bookingLabel(reserva.fechaCheckIn, reserva.fechaCheckOut)}`}>
                  <span>{nombreReservante}</span><small>{bookingLabel(reserva.fechaCheckIn, reserva.fechaCheckOut)}</small>
                </div>
              })}
            </div>)}
          </div>
        </div>
      </>}
    </section>
  )
}
