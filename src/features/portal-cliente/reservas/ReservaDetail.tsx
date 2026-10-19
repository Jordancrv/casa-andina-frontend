import { StayStatus } from '@/shared/ui/StayStatus'
import { useEffect, useRef } from 'react'
import type { ReservaDto } from '@/shared/types/global.types'

const date = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
const money = (value: number, currency = 'PEN') => new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value)

export function ReservaDetail({ reserva, onClose }: { reserva: ReservaDto; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  return <dialog className="reservation-dialog" ref={dialogRef} aria-labelledby="reservation-detail-title" onClose={event => {
    // StrictMode puede encolar un cierre de limpieza y reabrir el diálogo.
    // Ese evento anterior no debe borrar la reserva recién abierta.
    if (!event.currentTarget.open) onClose()
  }} onClick={event => {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close()
  }}>
    <header className="reservation-dialog-header"><div><p>DETALLE DE RESERVA</p><h2 id="reservation-detail-title">{reserva.codigo}</h2></div><button type="button" className="reservation-dialog-close" aria-label="Cerrar detalle" onClick={() => dialogRef.current?.close()}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></header>
    <div className="reservation-dialog-body">
      <StayStatus status={reserva.estadoEstadia || reserva.estado} detailed />
      <h3>{reserva.sedeNombre}</h3><p className="reservation-detail-city">{reserva.ciudad}</p>
      <dl className="reservation-detail-dates"><div><dt>Entrada</dt><dd>{date(reserva.fechaCheckIn)}</dd></div><div><dt>Salida</dt><dd>{date(reserva.fechaCheckOut)}</dd></div></dl>
      <section className="reservation-detail-section"><h4>Habitaciones reservadas</h4><div className="reservation-room-tags">{reserva.habitacionesNumeros.map(room => <span key={room}>Habitación {room}</span>)}</div></section>
      <section className="reservation-detail-section"><h4>Pagos registrados</h4>{!reserva.pagos.length ? <p>No hay pagos registrados.</p> : <ul className="reservation-payment-list">{reserva.pagos.map(pago => <li key={pago.pagoId}><div><strong>{pago.metodoPago}</strong><span>{pago.estado} · Simulado</span><small>{date(pago.fechaCreacion)}</small></div><div><strong>{money(pago.montoAplicado, pago.moneda)}</strong><small>Aplicado a esta reserva</small></div></li>)}</ul>}</section>
      <div className="reservation-detail-total"><span>Total de la reserva</span><strong>{money(reserva.montoTotal)}</strong></div>
    </div>
  </dialog>
}
