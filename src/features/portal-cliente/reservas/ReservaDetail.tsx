import { StayStatus } from '@/shared/ui/StayStatus'
import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import api from '@/shared/lib/api'
import type { ReservaDto } from '@/shared/types/global.types'
import { ComprobanteActions } from './ComprobanteActions'

const date = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
const money = (value: number, currency = 'PEN') => new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value)
interface ReservaDetalles {
  habitaciones: { id: number; numero: string; tipo: string; huespedes: { esTitular: boolean; datosHistoricosCompletos: boolean; datos: { nombres: string; apellidos: string | null; dni: string | null; fechaNacimiento: string | null; sexo: string | null; correo: string | null; telefono: string | null } }[] }[]
  servicios: { id: number; nombre: string; cantidad: number; precioUnitario: number; subtotal: number }[]
}

export function ReservaDetail({ reserva, onClose }: { reserva: ReservaDto; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { usuario } = useAuth()
  const detail = useQuery({ queryKey: ['reserva-detalle', usuario?.token, reserva.reservaId], queryFn: async () => await api.get(`/reservas/${reserva.reservaId}/detalle`) as ReservaDetalles, enabled: !!usuario })
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
      {detail.isLoading && <p className="client-state" role="status">Cargando huéspedes y servicios…</p>}
      {detail.isError && <div className="client-alert" role="alert">No se pudieron cargar los huéspedes y servicios. <button type="button" onClick={() => void detail.refetch()}>Reintentar</button></div>}
      {detail.data && <><section className="reservation-detail-section"><h4>Huéspedes registrados</h4>{detail.data.habitaciones.map(room => <div className="reservation-guest-room" key={room.id}><h5>Habitación {room.numero} · {room.tipo}</h5>{room.huespedes.length === 0 ? <p>No hay huéspedes registrados.</p> : room.huespedes.map((guest, i) => <article className="reservation-guest-card" key={i}><div className="reservation-guest-heading"><strong>{guest.datos.nombres} {guest.datos.apellidos}</strong>{guest.esTitular && <span>Principal</span>}</div><dl><div><dt>DNI</dt><dd>{guest.datos.dni || 'No registrado'}</dd></div><div><dt>Fecha de nacimiento</dt><dd>{guest.datos.fechaNacimiento ? date(guest.datos.fechaNacimiento) : 'No registrada'}</dd></div><div><dt>Sexo</dt><dd>{guest.datos.sexo === 'M' ? 'Masculino' : guest.datos.sexo === 'F' ? 'Femenino' : 'No registrado'}</dd></div><div><dt>Correo</dt><dd>{guest.datos.correo || 'No registrado'}</dd></div><div><dt>Teléfono</dt><dd>{guest.datos.telefono || 'No registrado'}</dd></div></dl>{!guest.datosHistoricosCompletos && <small className="reservation-old-guest">Reserva anterior: solo se dispone del nombre del huésped.</small>}</article>)}</div>)}</section>
      <section className="reservation-detail-section"><h4>Servicios adquiridos</h4>{!detail.data.servicios.length ? <p>No se agregaron servicios a esta reserva.</p> : <ul className="reservation-payment-list">{detail.data.servicios.map(service => <li key={service.id}><div><strong>{service.nombre}</strong><span>{service.cantidad} × {money(service.precioUnitario)}</span></div><div><strong>{money(service.subtotal)}</strong><small>Subtotal</small></div></li>)}</ul>}</section></>}
      <section className="reservation-detail-section"><h4>Pagos registrados</h4>{!reserva.pagos.length ? <p>No hay pagos registrados.</p> : <ul className="reservation-payment-list">{reserva.pagos.map(pago => <li key={pago.pagoId}><div><strong>{pago.metodoPago}</strong><span>{pago.estado} · Simulado</span><small>{date(pago.fechaCreacion)}</small></div><div><strong>{money(pago.montoAplicado, pago.moneda)}</strong><small>Aplicado a esta reserva</small></div></li>)}</ul>}</section>
      <div className="reservation-detail-total"><span>Total de la reserva</span><strong>{money(reserva.montoTotal)}</strong></div>
      {reserva.comprobanteDisponible && <section className="reservation-detail-section"><h4>{reserva.tipoComprobante ?? 'Comprobante'} de reserva</h4><p className="reservation-receipt-number">{reserva.numeroComprobante}</p><ComprobanteActions reservaId={reserva.reservaId} tipo={reserva.tipoComprobante} numero={reserva.numeroComprobante} /></section>}
    </div>
  </dialog>
}
