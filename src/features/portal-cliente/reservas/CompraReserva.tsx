import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSedesCliente, getDisponibilidad, getServiciosDeSede, comprarReserva, getMetodosPago } from './compra.api'
import type { CrearReservaPayload, HabitacionDisponible, HuespedCompra, MetodoPago, ReservaCompraRespuesta, ServicioReserva } from './compra.types'
import type { SedeDto } from '@/shared/types/global.types'
import { getReservas } from './reservas.api'
import '../cliente.css'

const dateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2)
const money = (amount: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)
const emptyGuest = (titular = false): HuespedCompra => ({ nombres: '', apellidos: '', correo: '', telefono: '', esTitular: titular })

export function CompraReserva() {
  const navigate = useNavigate()
  const [sedes, setSedes] = useState<SedeDto[]>([])
  const [sedeId, setSedeId] = useState(0)
  const [checkIn, setCheckIn] = useState(dateValue(tomorrow))
  const [checkOut, setCheckOut] = useState(dateValue(dayAfter))
  const [habitaciones, setHabitaciones] = useState<HabitacionDisponible[]>([])
  const [seleccion, setSeleccion] = useState<Record<number, HuespedCompra[]>>({})
  const [servicios, setServicios] = useState<ServicioReserva[]>([])
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [metodoPagoCodigo, setMetodoPagoCodigo] = useState('')
  const [extras, setExtras] = useState<Record<number, number>>({})
  const [step, setStep] = useState(0)
  const [tipoComprobante, setTipoComprobante] = useState<'Boleta' | 'Factura'>('Boleta')
  const [razonSocial, setRazonSocial] = useState('')
  const [ruc, setRuc] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmacion, setConfirmacion] = useState<{ data: ReservaCompraRespuesta; codigo: string; fechas: string; habitacionNombres: string[] } | null>(null)

  useEffect(() => {
    Promise.all([getSedesCliente(), getMetodosPago()])
      .then(([catalog, methods]) => {
        setSedes(catalog)
        if (catalog[0]) setSedeId(catalog[0].id)
        setMetodosPago(methods)
        if (methods[0]) setMetodoPagoCodigo(methods[0].codigo)
      })
      .catch(() => setError('No se pudieron cargar las opciones para la reserva.'))
  }, [])
  const noches = Math.max(1, Math.round((new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime()) / 86400000))
  const costoHabitaciones = useMemo(() => Object.keys(seleccion).reduce((sum, id) => sum + (habitaciones.find(room => room.habitacionId === Number(id))?.precioNoche ?? 0) * noches, 0), [habitaciones, seleccion, noches])
  const costoExtras = useMemo(() => Object.entries(extras).reduce((sum, [id, qty]) => sum + (servicios.find(service => service.id === Number(id))?.precio ?? 0) * qty, 0), [extras, servicios])

  const buscar = async () => {
    setError(null); setSearching(true); setStep(1); setSeleccion({}); setExtras({})
    try {
      const [rooms, services] = await Promise.all([getDisponibilidad(sedeId, checkIn, checkOut), getServiciosDeSede(sedeId)])
      setHabitaciones(rooms); setServicios(services)
    } catch { setError('No se pudo consultar disponibilidad. Revisa las fechas e inténtalo nuevamente.') }
    finally { setSearching(false) }
  }

  const toggleRoom = (room: HabitacionDisponible) => {
    setSeleccion(current => {
      if (current[room.habitacionId]) { const next = { ...current }; delete next[room.habitacionId]; return next }
      return { ...current, [room.habitacionId]: [emptyGuest(true)] }
    })
  }
  const updateGuest = (roomId: number, index: number, field: keyof HuespedCompra, value: string | boolean) => setSeleccion(current => ({
    ...current,
    [roomId]: current[roomId].map((guest, guestIndex) => guestIndex === index ? { ...guest, [field]: value } : guest)
  }))
  const addGuest = (room: HabitacionDisponible) => setSeleccion(current => ({ ...current, [room.habitacionId]: [...current[room.habitacionId], emptyGuest()] }))

  const submit = async () => {
    setError(null); setLoading(true)
    try {
      const payload: CrearReservaPayload = {
        sedeId, fechaCheckIn: checkIn, fechaCheckOut: checkOut,
        habitaciones: Object.entries(seleccion).map(([id, guests]) => ({ habitacionId: Number(id), huespedes: guests })),
        servicios: Object.entries(extras).filter(([, count]) => count > 0).map(([id, cantidad]) => ({ servicioId: Number(id), cantidad })),
        tipoComprobante, razonSocial: tipoComprobante === 'Factura' ? razonSocial : null, ruc: tipoComprobante === 'Factura' ? ruc : null,
        metodoPagoCodigo
      }
      const response = await comprarReserva(payload)
      setConfirmacion({ data: response, codigo: response.codigoReserva, fechas: `${checkIn} - ${checkOut}`, habitacionNombres: Object.keys(seleccion).map(id => `Hab. ${habitaciones.find(room => room.habitacionId === Number(id))?.numero ?? id}`) })
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string; title?: string } } }).response?.data
      setError(message?.message ?? message?.title ?? 'No se pudo completar la reserva. La disponibilidad pudo cambiar; vuelve a buscar.')
    } finally { setLoading(false) }
  }

  const goToReservations = async () => {
    try { await getReservas() } catch { /* la vista de reservas presenta su estado de error */ }
    navigate('/cliente/reservas')
  }

  if (confirmacion) return <section className="cliente-content"><div className="booking-success"><span className="success-mark">✓</span><p className="cliente-eyebrow">RESERVA CONFIRMADA</p><h1>Tu estadía ya está reservada</h1><p className="muted">Código de reserva <strong>{confirmacion.codigo}</strong></p><p className="muted">{confirmacion.fechas} · {confirmacion.habitacionNombres.join(', ')}</p><div className="success-total"><span>Total de la reserva</span><strong>{money(confirmacion.data.precioTotal)}</strong></div><p className="muted">Pago: {confirmacion.data.metodoPago} · {confirmacion.data.estadoPago} (simulado)</p><p className="notice">{confirmacion.data.mensajePago}</p><button className="client-primary" onClick={goToReservations}>Ver mis reservas</button></div></section>

  return <section className="cliente-content">
    <div className="client-heading"><div><p className="cliente-eyebrow">CASA ANDINA · RESERVAS DIRECTAS</p><h1>Encuentra tu próxima estadía</h1><p>Elige una sede, tus fechas y las habitaciones para tu viaje.</p></div></div>
    <div className="booking-progress" aria-label="Pasos de reserva">{['Estadía', 'Huéspedes', 'Confirmación'].map((label, index) => <div key={label} className={step >= index ? 'current' : ''}><i>{index + 1}</i><span>{label}</span></div>)}</div>
    <form className="booking-search" onSubmit={e => { e.preventDefault(); void buscar() }}>
      <label>Sede<select value={sedeId} onChange={e => setSedeId(Number(e.target.value))} required><option value={0} disabled>Selecciona una sede</option>{sedes.map(sede => <option key={sede.id} value={sede.id}>{sede.nombre} · {sede.ciudad}</option>)}</select></label>
      <label>Entrada<input type="date" min={dateValue(new Date())} value={checkIn} onChange={e => setCheckIn(e.target.value)} required /></label>
      <label>Salida<input type="date" min={checkIn} value={checkOut} onChange={e => setCheckOut(e.target.value)} required /></label>
      <button className="client-primary" type="submit" disabled={!sedeId || searching}>{searching ? 'Buscando…' : 'Buscar habitaciones'}</button>
    </form>
    {error && <div className="client-alert" role="alert">{error}</div>}
    {step > 0 && <>
      <div className="section-heading"><div><p className="cliente-eyebrow">{sedes.find(x => x.id === sedeId)?.nombre}</p><h2>Habitaciones disponibles</h2></div><span>{noches} {noches === 1 ? 'noche' : 'noches'}</span></div>
      {searching ? <p className="client-state">Consultando disponibilidad…</p> : habitaciones.length === 0 ? <p className="client-state">No encontramos habitaciones para estas fechas. Prueba otras fechas o una sede distinta.</p> : <div className="room-options">{habitaciones.map(room => {
        const selected = Boolean(seleccion[room.habitacionId]); const capacity = room.capacidadAdultos + room.capacidadNinos
        return <article key={room.habitacionId} className={`room-option ${selected ? 'selected' : ''}`}>
          <div className="room-option-main"><div><span className="room-category">{room.tipoHabitacion} · HABITACIÓN {room.numero}</span><h3>{room.sedeNombre}</h3><p>{room.capacidadAdultos} adultos{room.capacidadNinos ? ` · hasta ${room.capacidadNinos} niños` : ''} · {room.comodidades.slice(0, 3).join(' · ') || 'Confort Casa Andina'}</p></div><div className="room-price"><strong>{money(room.precioNoche)}</strong><small>por noche</small></div><button type="button" className={selected ? 'client-secondary' : 'client-primary'} onClick={() => toggleRoom(room)}>{selected ? 'Quitar' : 'Elegir'}</button></div>
          {selected && <div className="guest-list"><div className="guest-list-title"><strong>Huéspedes de habitación {room.numero}</strong><span>Máximo {capacity} · incluye huésped principal</span></div>{seleccion[room.habitacionId].map((guest, index) => <div className="guest-fields" key={`${room.habitacionId}-${index}`}><label>Nombre<input value={guest.nombres} onChange={e => updateGuest(room.habitacionId, index, 'nombres', e.target.value)} required /></label><label>Apellido<input value={guest.apellidos} onChange={e => updateGuest(room.habitacionId, index, 'apellidos', e.target.value)} required /></label><label>Correo<input type="email" value={guest.correo} onChange={e => updateGuest(room.habitacionId, index, 'correo', e.target.value)} required /></label><label>Teléfono<input type="tel" inputMode="tel" maxLength={16} pattern="\+?[1-9][0-9]{7,14}" title="Usa de 8 a 15 dígitos; puedes iniciar con + y código de país." value={guest.telefono} onChange={e => updateGuest(room.habitacionId, index, 'telefono', e.target.value)} /></label>{guest.esTitular && <span className="guest-owner">Huésped principal</span>}{!guest.esTitular && <button type="button" className="remove-guest" onClick={() => setSeleccion(current => ({ ...current, [room.habitacionId]: current[room.habitacionId].filter((_, guestIndex) => guestIndex !== index) }))}>Quitar huésped</button>}</div>)}{seleccion[room.habitacionId].length < capacity && <button type="button" className="add-guest" onClick={() => addGuest(room)}>+ Agregar huésped</button>}</div>}
        </article>
      })}</div>}
      {habitaciones.length > 0 && <>
        <div className="section-heading extras-heading"><div><p className="cliente-eyebrow">OPCIONAL</p><h2>Servicios adicionales</h2></div><span>Por reserva</span></div>
        <div className="service-options">{servicios.map(service => <div className="service-option" key={service.id}><div><strong>{service.nombre}</strong><p>{service.descripcion}</p></div><b>{money(service.precio)}</b><input type="number" min="0" max="20" aria-label={`Cantidad de ${service.nombre}`} value={extras[service.id] ?? 0} onChange={e => setExtras(current => ({ ...current, [service.id]: Math.min(20, Math.max(0, Number(e.target.value))) }))} /></div>)}</div>
        <div className="checkout"><div className="checkout-form"><div className="section-heading"><div><p className="cliente-eyebrow">ÚLTIMO PASO</p><h2>Comprobante</h2></div></div><div className="receipt-toggle"><label><input type="radio" checked={tipoComprobante === 'Boleta'} onChange={() => setTipoComprobante('Boleta')} /> Boleta</label><label><input type="radio" checked={tipoComprobante === 'Factura'} onChange={() => setTipoComprobante('Factura')} /> Factura</label></div>{tipoComprobante === 'Factura' && <div className="invoice-fields"><label>Razón social<input value={razonSocial} onChange={e => setRazonSocial(e.target.value)} required /></label><label>RUC registrado<input inputMode="numeric" maxLength={11} value={ruc} onChange={e => setRuc(e.target.value.replace(/\D/g, ''))} required /></label><small>La factura requiere que razón social y RUC coincidan con tu perfil jurídico.</small></div>}<div className="section-heading"><div><p className="cliente-eyebrow">REGISTRO SIMULADO</p><h2>Método de pago</h2></div></div><div className="receipt-toggle">{metodosPago.map(method => <label key={method.codigo}><input type="radio" name="metodoPago" value={method.codigo} checked={metodoPagoCodigo === method.codigo} onChange={() => setMetodoPagoCodigo(method.codigo)} /> {method.nombre}</label>)}</div><p className="simulation-note">Solo se registra el método seleccionado. No ingreses números de tarjeta, CVV ni PIN; no se realizará un cobro real.</p></div><div className="checkout-total"><div className="total-row"><span>Habitaciones · {noches} noches</span><b>{money(costoHabitaciones)}</b></div><div className="total-row"><span>Servicios</span><b>{money(costoExtras)}</b></div><div className="total-row total-final"><strong>Total</strong><strong>{money(costoHabitaciones + costoExtras)}</strong></div><button className="client-primary" disabled={!Object.keys(seleccion).length || !metodoPagoCodigo || loading || (tipoComprobante === 'Factura' && (!razonSocial.trim() || ruc.length !== 11))} onClick={() => void submit()}>{loading ? 'Confirmando…' : 'Confirmar compra simulada'}</button></div></div>
      </>}
    </>}
  </section>
}
