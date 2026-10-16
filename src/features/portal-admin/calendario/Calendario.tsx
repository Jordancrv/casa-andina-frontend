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
}

interface HabitacionCalendario {
  habitacionId: number
  numero: string
  piso: number
  tipoHabitacion: string
  estadoHabitacion: string
  reservas: ReservaCalendario[]
}

const isoDate = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

const initialRange = () => {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 30)
  return { desde: isoDate(start), hasta: isoDate(end) }
}

export const Calendario = () => {
  const { usuario } = useAuth()
  const [sedeSeleccionada, setSedeSeleccionada] = useState('')
  const [rango, setRango] = useState(initialRange)
  const sedeAsignada = usuario ? getSedeIdFromToken(usuario.token) : null
  const puedeVerTodasLasSedes = usuario?.rol === 'Administrador' || usuario?.rol === 'Superadministrador'
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

  return (
    <section className="cal-page">
      <header className="cal-heading">
        <div><p className="cal-eyebrow">OPERACIÓN HOTELERA</p><h1>Reservas y ocupación</h1><p>Consulta qué habitaciones están reservadas por sede y fechas.</p></div>
        <span className="cal-range-count">{habitacionesReservadas} habitaciones reservadas</span>
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

      {rangoValido && !consultando && !error && habitaciones.length > 0 && <div className="cal-table-wrap"><table className="cal-table">
        <thead><tr><th>Habitación</th><th>Tipo</th><th>Estado</th><th>Reservas dentro del rango</th></tr></thead>
        <tbody>{habitaciones.map(habitacion => <tr key={habitacion.habitacionId}>
          <td><strong>{habitacion.numero}</strong><small>Piso {habitacion.piso}</small></td>
          <td>{habitacion.tipoHabitacion}</td>
          <td><span className={`cal-status ${habitacion.reservas.length ? 'is-booked' : `is-${habitacion.estadoHabitacion.toLowerCase()}`}`}>
            {habitacion.reservas.length ? 'Reservada' : habitacion.estadoHabitacion}
          </span></td>
          <td>{habitacion.reservas.length === 0 ? <span className="cal-free">Sin reservas en este rango</span> : <ul className="cal-bookings">
            {habitacion.reservas.map(reserva => <li key={`${habitacion.habitacionId}-${reserva.fechaCheckIn}-${reserva.fechaCheckOut}`}>
              <span>{new Date(`${reserva.fechaCheckIn.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE')} – {new Date(`${reserva.fechaCheckOut.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE')}</span>
            </li>)}
          </ul>}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  )
}
