import { useReservas } from './useReservas'
import '../cliente.css'

const money = (amount: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)

export function MisReservas() {
  const { reservas, isLoading, error } = useReservas()
  if (isLoading) return <section className="cliente-content"><p className="client-state">Cargando tus reservas…</p></section>
  return <section className="cliente-content">
    <div className="client-heading"><div><p className="cliente-eyebrow">TU HISTORIAL</p><h1>Mis reservas</h1><p>Consulta el detalle de tus próximas estadías y compras.</p></div></div>
    {error && <div className="client-alert" role="alert">{error}</div>}
    {!error && reservas.length === 0 && <div className="client-state"><h2>Aún no tienes reservas</h2><p>Encuentra una estadía y planifica tu próxima visita.</p></div>}
    <div className="reservation-list">{reservas.map(reserva => <article className="reservation-row" key={reserva.reservaId}><div><span className="room-category">{reserva.codigo} · {reserva.estado}</span><h2>{reserva.sedeNombre}</h2><p>{reserva.ciudad} · {reserva.habitacionesNumeros.map(room => `Hab. ${room}`).join(', ')}</p></div><div><small>ENTRADA · SALIDA</small><strong>{new Date(reserva.fechaCheckIn).toLocaleDateString('es-PE')} – {new Date(reserva.fechaCheckOut).toLocaleDateString('es-PE')}</strong></div><div className="reservation-total"><small>TOTAL</small><strong>{money(reserva.montoTotal)}</strong></div></article>)}</div>
  </section>
}
