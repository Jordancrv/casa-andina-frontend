import { useState } from 'react'
import { useReservas } from './useReservas'
import type { ReservaDto } from '@/shared/types/global.types'
import { ReservaDetail } from './ReservaDetail'
import '../cliente.css'

const money = (amount: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)
const date = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
}
const today = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function MisReservas() {
  const { reservas, isLoading, error } = useReservas()
  const [vista, setVista] = useState<'proximas' | 'historial'>('proximas')
  const [selectedReserva, setSelectedReserva] = useState<ReservaDto | null>(null)
  const hoy = today()
  const visibles = reservas.filter(reserva => vista === 'proximas'
    ? reserva.fechaCheckOut.slice(0, 10) >= hoy && !['Cancelada', 'Completada'].includes(reserva.estado)
    : reserva.fechaCheckOut.slice(0, 10) < hoy || ['Cancelada', 'Completada'].includes(reserva.estado))
  if (isLoading) return <section className="cliente-content"><p className="client-state">Cargando tus reservas…</p></section>
  return <section className="cliente-content my-reservations">
    <div className="client-heading"><div><p className="cliente-eyebrow">TU HISTORIAL</p><h1>Mis reservas</h1><p>Consulta las fechas y habitaciones de tus estadías.</p></div></div>
    {error && <div className="client-alert" role="alert">{error}</div>}
    {!error && reservas.length === 0 && <div className="client-state"><h2>Aún no tienes reservas</h2><p>Encuentra una estadía y planifica tu próxima visita.</p></div>}
    {!error && reservas.length > 0 && <><div className="reservation-tabs" aria-label="Filtrar reservas"><button type="button" aria-pressed={vista === 'proximas'} className={vista === 'proximas' ? 'active' : ''} onClick={() => setVista('proximas')}>Próximas</button><button type="button" aria-pressed={vista === 'historial'} className={vista === 'historial' ? 'active' : ''} onClick={() => setVista('historial')}>Historial</button></div>
      {visibles.length === 0 && <div className="client-state"><h2>No hay reservas en esta sección</h2><p>Cuando tengas una estadía, aparecerá aquí.</p></div>}
      <div className="reservation-list">{visibles.map(reserva => <article className="reservation-row" key={reserva.reservaId}><div><span className="room-category">{reserva.codigo} · {reserva.estado}</span><h2>{reserva.sedeNombre}</h2><p>{reserva.ciudad} · {reserva.habitacionesNumeros.map(room => `Hab. ${room}`).join(', ')}</p>{reserva.pagos.map(pago => <p key={pago.pagoId}>Pago {pago.estado.toLowerCase()} (simulado) · {pago.metodoPago}</p>)}</div><div><small>ENTRADA · SALIDA</small><strong>{date(reserva.fechaCheckIn)} – {date(reserva.fechaCheckOut)}</strong></div><div className="reservation-total"><small>TOTAL</small><strong>{money(reserva.montoTotal)}</strong><button type="button" className="client-secondary reservation-detail-button" aria-label={`Ver detalle de reserva ${reserva.codigo}`} onClick={() => setSelectedReserva(reserva)}>Ver detalle <span aria-hidden="true">↗</span></button></div></article>)}</div></>}
    {selectedReserva && <ReservaDetail reserva={selectedReserva} onClose={() => setSelectedReserva(null)} />}
  </section>
}
