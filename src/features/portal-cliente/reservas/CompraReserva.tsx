import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSedesCliente, getDisponibilidad, getServiciosDeSede, comprarReserva, getMetodosPago } from './compra.api'
import type { CrearReservaPayload, HabitacionDisponible, HuespedCompra, MetodoPago, ReservaCompraRespuesta, ServicioReserva } from './compra.types'
import type { SedeDto } from '@/shared/types/global.types'
import { getReservas } from './reservas.api'
import { SEDE_IMAGES } from '@/shared/constants/sede-images'
import { PaymentPreview } from './PaymentPreview'
import { ComprobanteActions } from './ComprobanteActions'
import { cleanGuestName, cleanGuestPhone, formatGuestPhone } from './guest-input'
import '../cliente.css'

const peruToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}
const addDays = (value: string, days: number) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}
const nightsBetween = (start: string, end: string) => Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000)
const nextDateValue = (value: string) => addDays(value || peruToday(), 1)
const guestNamePattern = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u
const maxRoomsPerReservation = 8
const maxGuestsPerRoom = 10
const money = (amount: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)
const emptyGuest = (titular = false): HuespedCompra => ({ nombres: '', apellidos: '', correo: '', telefono: '', esTitular: titular })

export function CompraReserva() {
  const navigate = useNavigate()
  const [sedes, setSedes] = useState<SedeDto[]>([])
  const [sedeId, setSedeId] = useState(0)
  const [checkIn, setCheckIn] = useState(() => addDays(peruToday(), 1))
  const [checkOut, setCheckOut] = useState(() => addDays(peruToday(), 2))
  const [habitaciones, setHabitaciones] = useState<HabitacionDisponible[]>([])
  const [seleccion, setSeleccion] = useState<Record<number, HuespedCompra[]>>({})
  const [servicios, setServicios] = useState<ServicioReserva[]>([])
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [metodoPagoCodigo, setMetodoPagoCodigo] = useState('')
  const [extras, setExtras] = useState<Record<number, number>>({})
  const [step, setStep] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [tipoComprobante, setTipoComprobante] = useState<'Boleta' | 'Factura'>('Boleta')
  const [razonSocial, setRazonSocial] = useState('')
  const [ruc, setRuc] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmacion, setConfirmacion] = useState<{ data: ReservaCompraRespuesta; codigo: string; fechas: string; habitacionNombres: string[] } | null>(null)
  const noches = Math.max(1, nightsBetween(checkIn, checkOut))
  const rangoFechasValido = checkIn >= peruToday() && checkOut > checkIn && noches <= 90

  useEffect(() => {
    Promise.all([getSedesCliente(), getMetodosPago()])
      .then(([catalog, methods]) => {
        setSedes(catalog)
        setMetodosPago(methods)
        if (methods[0]) setMetodoPagoCodigo(methods[0].codigo)
      })
      .catch(() => setError('No se pudieron cargar las opciones para la reserva.'))
      .finally(() => setCatalogLoading(false))
  }, [])
  const costoHabitaciones = useMemo(() => Object.keys(seleccion).reduce((sum, id) => sum + (habitaciones.find(room => room.habitacionId === Number(id))?.precioNoche ?? 0) * noches, 0), [habitaciones, seleccion, noches])
  const costoExtras = useMemo(() => Object.entries(extras).reduce((sum, [id, qty]) => sum + (servicios.find(service => service.id === Number(id))?.precio ?? 0) * qty, 0), [extras, servicios])
  const selectedRoomCount = Object.keys(seleccion).length

  const invalidarDisponibilidad = () => {
    setHabitaciones([]); setServicios([]); setSeleccion({}); setExtras({}); setStep(0); setHasSearched(false); setError(null)
  }

  const buscar = async () => {
    if (checkIn < peruToday() || checkOut <= checkIn) { setError('La entrada no puede estar en el pasado y la salida debe ser posterior a la entrada.'); return }
    if (noches > 90) { setError('La estadía no puede superar 90 noches.'); return }
    setError(null); setSearching(true); setHasSearched(false); setHabitaciones([]); setServicios([]); setSeleccion({}); setExtras({})
    try {
      const [rooms, services] = await Promise.all([getDisponibilidad(sedeId, checkIn, checkOut), getServiciosDeSede(sedeId)])
      setHabitaciones(rooms); setServicios(services); setHasSearched(true)
    } catch { setError('No se pudo consultar disponibilidad. Revisa las fechas e inténtalo nuevamente.') }
    finally { setSearching(false) }
  }

  const toggleRoom = (room: HabitacionDisponible) => {
    if (!seleccion[room.habitacionId] && selectedRoomCount >= maxRoomsPerReservation) {
      setError(`Una reserva admite como máximo ${maxRoomsPerReservation} habitaciones.`)
      return
    }
    setSeleccion(current => {
      if (current[room.habitacionId]) { const next = { ...current }; delete next[room.habitacionId]; return next }
      return { ...current, [room.habitacionId]: [emptyGuest(true)] }
    })
  }
  const updateGuest = (roomId: number, index: number, field: keyof HuespedCompra, value: string | boolean) => setSeleccion(current => ({
    ...current,
    [roomId]: current[roomId].map((guest, guestIndex) => guestIndex === index ? { ...guest, [field]: typeof value === 'string'
      ? field === 'nombres' || field === 'apellidos' ? cleanGuestName(value)
        : field === 'telefono' ? cleanGuestPhone(value)
          : field === 'correo' ? value.replace(/\s/g, '') : value
      : value } : guest)
  }))
  const addGuest = (room: HabitacionDisponible) => {
    if (seleccion[room.habitacionId].length >= Math.min(maxGuestsPerRoom, room.capacidadAdultos + room.capacidadNinos)) {
      setError(`Una habitación admite como máximo ${maxGuestsPerRoom} huéspedes por reserva.`)
      return
    }
    setSeleccion(current => ({ ...current, [room.habitacionId]: [...current[room.habitacionId], emptyGuest()] }))
  }

  const validateStay = (): boolean => {
    if (!rangoFechasValido) { setError('Revisa el rango de fechas: la salida debe ser posterior a la entrada.'); return false }
    if (!Object.keys(seleccion).length) { setError('Selecciona al menos una habitación.'); return false }
    if (selectedRoomCount > maxRoomsPerReservation) { setError(`Una reserva admite como máximo ${maxRoomsPerReservation} habitaciones.`); return false }
    const guestEmails = new Set<string>()
    for (const [roomId, guests] of Object.entries(seleccion)) {
      const room = habitaciones.find(item => item.habitacionId === Number(roomId))
      const capacity = room ? Math.min(room.capacidadAdultos + room.capacidadNinos, maxGuestsPerRoom) : 0
      if (!room || guests.length > capacity) { setError('La cantidad de huéspedes supera la capacidad de una habitación.'); return false }
      if (guests.some(guest => !guestNamePattern.test(guest.nombres.trim()) || guest.nombres.length > 200 || !guestNamePattern.test(guest.apellidos.trim()) || guest.apellidos.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.correo.trim()) || (guest.telefono.trim() && !/^\+?[1-9]\d{7,14}$/.test(guest.telefono.trim())))) {
        setError('Completa los nombres, apellidos, correos y teléfonos de huéspedes con un formato válido.'); return false
      }
      for (const guest of guests) {
        const email = guest.correo.trim().toLowerCase()
        if (guestEmails.has(email)) { setError('Cada huésped debe tener un correo único dentro de la reserva.'); return false }
        guestEmails.add(email)
      }
    }
    return true
  }
  const continueToPayment = () => {
    setError(null)
    if (!validateStay()) return
    setStep(2)
    document.querySelector('.cliente-main')?.scrollTo({ top: 0, behavior: 'instant' })
  }
  const submit = async () => {
    if (loading || !validateStay()) return
    if (!metodoPagoCodigo) { setError('Selecciona un método de pago.'); return }
    if (tipoComprobante === 'Factura' && (!razonSocial.trim() || razonSocial.length > 200 || !/^\d{11}$/.test(ruc))) { setError('Para emitir factura, ingresa razón social y un RUC de 11 dígitos.'); return }
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
      const response = (e as { response?: { data?: { message?: string; title?: string; errors?: Record<string, string[] | string> } } }).response?.data
      const validationMessage = Object.values(response?.errors ?? {}).flat()[0]
      setError((typeof validationMessage === 'string' ? validationMessage : null)
        ?? response?.message ?? response?.title
        ?? 'No se pudo completar la reserva. La disponibilidad pudo cambiar; vuelve a buscar.')
    } finally { setLoading(false) }
  }

  const goToReservations = async () => {
    try { await getReservas() } catch { /* la vista de reservas presenta su estado de error */ }
    navigate('/cliente/reservas')
  }

  if (confirmacion) return <section className="cliente-content"><div className="booking-success"><span className="success-mark">✓</span><p className="cliente-eyebrow">RESERVA CONFIRMADA</p><h1>Tu estadía ya está reservada</h1><p className="muted">Código de reserva <strong>{confirmacion.codigo}</strong></p><p className="muted">{confirmacion.fechas} · {confirmacion.habitacionNombres.join(', ')}</p><div className="success-total"><span>Total de la reserva</span><strong>{money(confirmacion.data.precioTotal)}</strong></div><p className="muted">Pago: {confirmacion.data.metodoPago} · {confirmacion.data.estadoPago} (simulado)</p><p className="notice">{confirmacion.data.mensajePago}</p>{confirmacion.data.comprobanteDisponible && <ComprobanteActions reservaId={confirmacion.data.reservaId} tipo={confirmacion.data.tipoComprobante} numero={confirmacion.data.numeroComprobante} />}<button className="client-primary" onClick={goToReservations}>Ver mis reservas</button></div></section>

  const selectedSede = sedes.find(sede => sede.id === sedeId)
  const selectedRooms = habitaciones.filter(room => Boolean(seleccion[room.habitacionId]))
  const changeStep = (next: number) => {
    setError(null)
    setStep(next)
    document.querySelector('.cliente-main')?.scrollTo({ top: 0, behavior: 'instant' })
  }
  const sedeImage = (name: string, city: string) => {
    const normalized = `${name} ${city}`.toLowerCase()
    const destinations: [string, string][] = [['chiclayo','CHI-SEL'],['huaraz','HRZ-ASO'],['huancayo','HYO-ASO'],['nasca','NAZ-STD'],['nazca','NAZ-STD'],['piura','PIU-PRE'],['trujillo','TRU-STD'],['arequipa','ARQ-PRE'],['cusco','CUS-PRE'],['miraflores','MIR-PRE'],['san isidro','SIS-PRE']]
    const code = destinations.find(([city]) => normalized.includes(city))?.[1]
    return code ? SEDE_IMAGES[code] : undefined
  }

  return <section className="cliente-content booking-wizard">
    <div className="client-heading"><div><p className="cliente-eyebrow">CASA ANDINA · RESERVAS DIRECTAS</p><h1>{['Elige tu próxima estadía', '¿Quiénes nos acompañan?', 'Revisa y confirma tu reserva'][step]}</h1><p>{['Explora nuestras sedes, elige tus fechas y encuentra tu habitación.', 'Registra a los huéspedes de cada habitación y personaliza tu visita.', 'Revisa el resumen y prueba nuestro pago simulado, sin cobros reales.'][step]}</p></div></div>
    <ol className="booking-stepper" aria-label="Pasos de reserva">{['Estadía', 'Huéspedes', 'Pago'].map((label, index) => <li key={label} className={step === index ? 'active' : step > index ? 'done' : ''} aria-current={step === index ? 'step' : undefined}><span>{index + 1}</span><div><strong>{label}</strong><small>{['Sede y habitación', 'Datos y servicios', 'Confirmación simulada'][index]}</small></div></li>)}</ol>
    {error && <div className="client-alert" role="alert">{error}</div>}
    {step === 0 && <>
      {!sedeId && <>
        <div className="booking-section-title"><h2>Encuentra tu destino</h2><span>{sedes.length} sedes para elegir</span></div>
        {catalogLoading && <p className="client-state" role="status">Cargando sedes…</p>}
        {!catalogLoading && !error && !sedes.length && <p className="client-state">No hay sedes disponibles.</p>}
        <div className="booking-sede-grid">{sedes.map(sede => <button type="button" className="booking-sede-card" key={sede.id} onClick={() => { invalidarDisponibilidad(); setSedeId(sede.id) }}>
          {sedeImage(sede.nombre, sede.ciudad) && <img src={sedeImage(sede.nombre, sede.ciudad)} alt="" loading="lazy" />}
          <span className="booking-sede-body"><small>{sede.ciudad}</small><strong>{sede.nombre}</strong><span>Ver habitaciones <b aria-hidden="true">↗</b></span></span>
        </button>)}</div>
      </>}
      {selectedSede && <>
        <div className="booking-chosen-sede"><div><p className="cliente-eyebrow">TU DESTINO</p><h2>{selectedSede.nombre}</h2><span>{selectedSede.ciudad}</span></div><button type="button" className="client-secondary" disabled={searching} onClick={() => { invalidarDisponibilidad(); setSedeId(0) }}>Cambiar sede</button></div>
        <form className="booking-search booking-date-search" onSubmit={event => { event.preventDefault(); void buscar() }}>
          <label>Entrada<input disabled={searching} type="date" min={peruToday()} value={checkIn} onChange={event => { const value=event.target.value; setCheckIn(value); if (checkOut <= value) setCheckOut(nextDateValue(value)); invalidarDisponibilidad() }} required /></label>
          <label>Salida<input disabled={searching} type="date" min={nextDateValue(checkIn)} value={checkOut} onChange={event => { setCheckOut(event.target.value); invalidarDisponibilidad() }} required /></label>
          <button className="client-primary" type="submit" disabled={searching || !rangoFechasValido}>{searching ? 'Buscando…' : 'Buscar habitaciones'}</button>
        </form>
        {!rangoFechasValido && <p className="client-alert" role="alert">Elige fechas válidas y una estadía de hasta 90 noches.</p>}
        {searching && <p className="client-state" role="status">Consultando disponibilidad…</p>}
        {hasSearched && <>
          <div className="booking-section-title"><h2>Elige tus habitaciones</h2><span>{noches} {noches === 1 ? 'noche' : 'noches'} · {habitaciones.length} {habitaciones.length === 1 ? 'habitación disponible' : 'habitaciones disponibles'}</span></div>
          {!habitaciones.length && <p className="client-state">No hay habitaciones disponibles en estas fechas. Prueba otro periodo o sede.</p>}
          <div className="room-options">{habitaciones.map(room => <article className={seleccion[room.habitacionId] ? 'room-option selected' : 'room-option'} key={room.habitacionId}>
            {room.fotoUrl?.trim() && <img className="booking-room-photo" src={room.fotoUrl.trim()} alt={`Habitación ${room.numero} · ${room.tipoHabitacion}`} loading="lazy" onError={event => { event.currentTarget.hidden = true }} />}<div className="room-option-main"><div><span className="room-category">HABITACIÓN {room.numero} · PISO {room.piso}</span><h3>{room.tipoHabitacion}</h3><p className="room-capacity">{room.capacidadAdultos} {room.capacidadAdultos === 1 ? 'adulto' : 'adultos'}{room.capacidadNinos > 0 && <> · hasta {room.capacidadNinos} {room.capacidadNinos === 1 ? 'niño' : 'niños'}</>}</p>{room.comodidades.length > 0 && <ul className="room-amenities" aria-label="Comodidades de la habitación">{room.comodidades.map(amenity => <li key={amenity}>{amenity}</li>)}</ul>}</div><div className="room-price"><strong>{money(room.precioNoche)}</strong><small>por noche</small></div><button type="button" className={seleccion[room.habitacionId] ? 'client-secondary' : 'client-primary'} onClick={() => toggleRoom(room)}>{seleccion[room.habitacionId] ? 'Quitar' : 'Seleccionar'}</button></div>
          </article>)}</div>
          {!!selectedRoomCount && <div className="booking-next-step"><div><strong>{selectedRoomCount} {selectedRoomCount === 1 ? 'habitación seleccionada' : 'habitaciones seleccionadas'}</strong><span>{money(costoHabitaciones)} por {noches} {noches === 1 ? 'noche' : 'noches'}</span></div><button type="button" className="client-primary" onClick={() => changeStep(1)}>Continuar con huéspedes →</button></div>}
        </>}
      </>}
    </>}
    {step === 1 && <>
      <div className="booking-chosen-sede"><div><h2>{selectedSede?.nombre}</h2><span>{checkIn.split('-').reverse().join('/')} — {checkOut.split('-').reverse().join('/')} · {selectedRoomCount} habitaciones</span></div><button type="button" className="client-secondary" onClick={() => changeStep(0)}>Editar estadía</button></div>
      <form onSubmit={event => { event.preventDefault(); continueToPayment() }}>
        <div className="room-options">{selectedRooms.map(room => { const capacity=Math.min(room.capacidadAdultos+room.capacidadNinos,maxGuestsPerRoom); return <article className="room-option selected" key={room.habitacionId}><div className="booking-guest-heading"><h2>{room.tipoHabitacion}</h2><span>Habitación {room.numero}</span></div>
          {<div className="guest-list"><div className="guest-list-title"><strong>Huéspedes de habitación {room.numero}</strong><span>Máximo {capacity} · incluye huésped principal</span></div>{seleccion[room.habitacionId].map((guest, index) => <div className="guest-fields" key={`${room.habitacionId}-${index}`}><label>Nombre<input disabled={loading} maxLength={200} value={guest.nombres} onChange={e => updateGuest(room.habitacionId, index, 'nombres', e.target.value)} required /></label><label>Apellido<input disabled={loading} maxLength={100} value={guest.apellidos} onChange={e => updateGuest(room.habitacionId, index, 'apellidos', e.target.value)} required /></label><label>Correo<input disabled={loading} type="email" pattern="[^\s@]+@[^\s@]+\.[^\s@]+" placeholder="nombre@correo.com" title="Ingresa un correo válido, por ejemplo nombre@correo.com." maxLength={150} value={guest.correo} onChange={e => updateGuest(room.habitacionId, index, 'correo', e.target.value)} required /></label><label>Teléfono<input disabled={loading} type="tel" inputMode="tel" maxLength={22} pattern="\+?[1-9][0-9 ]{7,20}" placeholder="+51 999 999 999" title="Usa de 8 a 15 dígitos; puedes iniciar con + y código de país." value={formatGuestPhone(guest.telefono)} onChange={e => updateGuest(room.habitacionId, index, 'telefono', e.target.value)} /></label>{guest.esTitular && <span className="guest-owner">Huésped principal</span>}{!guest.esTitular && <button type="button" className="remove-guest" disabled={loading} onClick={() => setSeleccion(current => ({ ...current, [room.habitacionId]: current[room.habitacionId].filter((_, guestIndex) => guestIndex !== index) }))}>Quitar huésped</button>}</div>)}{seleccion[room.habitacionId].length < capacity && <button type="button" className="add-guest" disabled={loading} onClick={() => addGuest(room)}>+ Agregar huésped</button>}</div>}
        </article> })}</div>
                <div className="section-heading extras-heading"><div><p className="cliente-eyebrow">OPCIONAL</p><h2>Servicios adicionales</h2></div><span>Por reserva</span></div>
        <div className="service-options">{servicios.map(service => <div className="service-option" key={service.id}><div><strong>{service.nombre}</strong><p>{service.descripcion}</p></div><b>{money(service.precio)}</b><input disabled={loading} type="number" min="0" max="20" step="1" inputMode="numeric" aria-label={`Cantidad de ${service.nombre}`} value={extras[service.id] ?? 0} onChange={e => setExtras(current => ({ ...current, [service.id]: Math.min(20, Math.max(0, Math.trunc(Number(e.target.value)))) }))} /></div>)}</div>
        <div className="booking-next-step"><button type="button" className="client-secondary" onClick={() => changeStep(0)}>← Volver a habitaciones</button><button className="client-primary" type="submit">Continuar al pago →</button></div>
      </form>
    </>}
    {step === 2 && <>
      <section className="booking-review" aria-label="Resumen de la estadía">
        <div className="booking-review-heading"><div><p className="cliente-eyebrow">TU RESERVA</p><h2>{selectedSede?.nombre}</h2></div><button type="button" className="client-secondary" disabled={loading} onClick={() => changeStep(1)}>Editar huéspedes</button></div>
        <dl><div><dt>Entrada</dt><dd>{checkIn.split('-').reverse().join('/')}</dd></div><div><dt>Salida</dt><dd>{checkOut.split('-').reverse().join('/')}</dd></div><div><dt>Duración</dt><dd>{noches} {noches === 1 ? 'noche' : 'noches'}</dd></div></dl>
        <ul>{selectedRooms.map(room => <li key={room.habitacionId}><strong>Habitación {room.numero} · {room.tipoHabitacion}</strong><span>{seleccion[room.habitacionId].map(guest => guest.nombres+' '+guest.apellidos).join(', ')}</span></li>)}</ul>
        {costoExtras > 0 && <p className="booking-review-extras">Servicios: {Object.entries(extras).filter(([,qty]) => qty>0).map(([id,qty]) => qty+' × '+servicios.find(service => service.id===Number(id))?.nombre).join(' · ')}</p>}
      </section>
              <div className="checkout"><div className="checkout-form"><div className="section-heading"><div><p className="cliente-eyebrow">ÚLTIMO PASO</p><h2>Comprobante</h2></div></div><div className="receipt-toggle"><label><input disabled={loading} type="radio" checked={tipoComprobante === 'Boleta'} onChange={() => setTipoComprobante('Boleta')} /> Boleta</label><label><input disabled={loading} type="radio" checked={tipoComprobante === 'Factura'} onChange={() => setTipoComprobante('Factura')} /> Factura</label></div>{tipoComprobante === 'Factura' && <div className="invoice-fields"><label>Razón social<input disabled={loading} maxLength={200} value={razonSocial} onChange={e => setRazonSocial(e.target.value)} required /></label><label>RUC registrado<input disabled={loading} inputMode="numeric" maxLength={11} value={ruc} onChange={e => setRuc(e.target.value.replace(/\D/g, ''))} required /></label><small>La factura requiere que razón social y RUC coincidan con tu perfil jurídico.</small></div>}<div className="section-heading"><div><p className="cliente-eyebrow">REGISTRO SIMULADO</p><h2>Método de pago</h2></div></div><div className="payment-method-options">{metodosPago.map(method => <label className={metodoPagoCodigo === method.codigo ? 'selected' : ''} key={method.codigo}><input disabled={loading} type="radio" name="metodoPago" value={method.codigo} checked={metodoPagoCodigo === method.codigo} onChange={() => setMetodoPagoCodigo(method.codigo)} /> {method.nombre}</label>)}</div><PaymentPreview method={metodosPago.find(method => method.codigo === metodoPagoCodigo)} amount={costoHabitaciones + costoExtras} /></div><div className="checkout-total"><div className="total-row"><span>Habitaciones · {noches} noches</span><b>{money(costoHabitaciones)}</b></div><div className="total-row"><span>Servicios</span><b>{money(costoExtras)}</b></div><div className="total-row total-final"><strong>Total</strong><strong>{money(costoHabitaciones + costoExtras)}</strong></div><button className="client-primary" disabled={!Object.keys(seleccion).length || !metodoPagoCodigo || loading || (tipoComprobante === 'Factura' && (!razonSocial.trim() || ruc.length !== 11))} onClick={() => void submit()}>{loading ? 'Confirmando…' : 'Simular pago y confirmar reserva'}</button></div></div>
      <button className="client-secondary booking-back" type="button" disabled={loading} onClick={() => changeStep(1)}>← Volver a huéspedes</button>
    </>}
  </section>
}
