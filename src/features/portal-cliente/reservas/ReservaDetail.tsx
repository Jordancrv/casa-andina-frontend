import { StayStatus } from '@/shared/ui/StayStatus'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

function ConfirmarCancelacion({ reserva, onClose, onCancelled }: { reserva: ReservaDto; onClose: () => void; onCancelled: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const client = useQueryClient()
  const cancel = useMutation({ mutationFn: async () => await api.post(`/reservas/${reserva.reservaId}/cancelar`), onSuccess: async () => {
    await Promise.all([client.invalidateQueries({ queryKey: ['dashboard'] }), client.invalidateQueries({ queryKey: ['admin'] }), client.invalidateQueries({ queryKey: ['reserva-detalle'] }), client.invalidateQueries({ queryKey: ['mis-reservas'], refetchType: 'none' })])
    onCancelled()
  } })
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  const error = (cancel.error as { response?: { data?: { title?: string } } })?.response?.data?.title
  return <dialog ref={ref} className="cancel-reservation-dialog" aria-labelledby="cancel-title" onCancel={event => { event.preventDefault(); if (!cancel.isPending) onClose() }}>
    <header><div><p>CANCELACIÓN DE RESERVA</p><h2 id="cancel-title">¿Deseas cancelar tu reserva?</h2></div><button type="button" onClick={onClose} disabled={cancel.isPending} aria-label="Cerrar">×</button></header>
    <div className="cancel-reservation-body"><p>Se cancelará la reserva <strong>{reserva.codigo}</strong> y sus habitaciones quedarán disponibles.</p>
      <div className="cancel-reservation-note"><strong>Sobre la devolución</strong><p>El plazo indicado para una devolución es de 5 a 10 días hábiles según el método de pago. En este sistema el pago es simulado: no se realiza ningún cobro ni se procesará una devolución real.</p></div>
      {cancel.isError && <p className="client-alert" role="alert">{error || 'No se pudo cancelar la reserva. Actualiza e inténtalo nuevamente.'}</p>}
    </div><footer><button type="button" className="client-secondary" disabled={cancel.isPending} onClick={onClose}>Volver</button><button type="button" className="cancel-reservation-confirm" disabled={cancel.isPending} onClick={() => cancel.mutate()}>{cancel.isPending ? 'Cancelando…' : 'Sí, cancelar reserva'}</button></footer>
  </dialog>
}

export function ReservaDetail({ reserva, onClose, onCancelled }: { reserva: ReservaDto; onClose: () => void; onCancelled: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const { usuario } = useAuth()
  const detail = useQuery({ queryKey: ['reserva-detalle', usuario?.token, reserva.reservaId], queryFn: async () => await api.get(`/reservas/${reserva.reservaId}/detalle`) as ReservaDetalles, enabled: !!usuario })
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const puedeCancelar = reserva.estado === 'Reservado' && reserva.estadoEstadia === 'Reservado' && reserva.fechaCheckIn.slice(0, 10) >= hoy
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
      {puedeCancelar && <section className="reservation-detail-section"><h4>¿Cambiaste de planes?</h4><p>Puedes cancelar la reserva antes del check-in.</p><button type="button" className="cancel-reservation-link" onClick={() => setConfirmCancel(true)}>Cancelar reserva</button></section>}
    </div>
    {confirmCancel && <ConfirmarCancelacion reserva={reserva} onClose={() => setConfirmCancel(false)} onCancelled={onCancelled} />}
  </dialog>
}
