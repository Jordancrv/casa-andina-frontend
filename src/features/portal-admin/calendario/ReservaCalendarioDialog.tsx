import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'

interface ReservaResumen { reservaId: number; codigo: string | null; estado: string; canal: string | null; fechaCheckIn: string; fechaCheckOut: string }
interface Detalle {
  titular: string; sede: string; total: number
  habitaciones: { numero: string; tipo: string; entrada: string; salida: string; subtotal: number; huespedes: { esTitular: boolean; datos: { nombres: string; apellidos: string | null; dni: string | null; fechaNacimiento: string | null; sexo: string | null; correo: string | null; telefono: string | null } }[] }[]
  servicios: { id: number; nombre: string; cantidad: number; subtotal: number }[]
  pagos: { metodo: string; estado: string; monto: number; moneda: string }[]
}
const fecha = (s: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(s.slice(0, 10) + 'T00:00:00Z'))
const dinero = (n: number, moneda = 'PEN') => new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(n)

export function ReservaCalendarioDialog({ reserva, esAdministrador, close }: { reserva: ReservaResumen; esAdministrador: boolean; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const detalle = useQuery({ queryKey: ['calendario', 'reserva', reserva.reservaId], enabled: esAdministrador && !!reserva.reservaId,
    queryFn: async () => await api.get('/habitaciones/calendario-reservas/' + reserva.reservaId + '/detalle') as unknown as Detalle })
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  return <dialog ref={dialog} className="cal-reserva-dialog" aria-labelledby="cal-reserva-title" onCancel={event => { event.preventDefault(); close() }}>
    <header><div><p>DETALLE DE RESERVA</p><h2 id="cal-reserva-title">{reserva.codigo || 'Reserva'}</h2></div><button type="button" onClick={close} aria-label="Cerrar detalle">×</button></header>
    <div className="cal-reserva-body">
      <dl className="cal-reserva-grid"><div><dt>Estado</dt><dd>{reserva.estado}</dd></div><div><dt>Canal</dt><dd>{reserva.canal || 'No registrado'}</dd></div><div><dt>Entrada</dt><dd>{fecha(reserva.fechaCheckIn)}</dd></div><div><dt>Salida</dt><dd>{fecha(reserva.fechaCheckOut)}</dd></div></dl>
      {!esAdministrador && <p>El detalle completo está disponible para el administrador de la sede.</p>}
      {detalle.isLoading && esAdministrador && <p role="status">Cargando detalle…</p>}
      {detalle.isError && <p role="alert">No se pudo cargar el detalle. <button type="button" onClick={() => void detalle.refetch()}>Reintentar</button></p>}
      {detalle.data && <><section><h3>Datos de la reserva</h3><dl className="cal-reserva-grid"><div><dt>Titular</dt><dd>{detalle.data.titular}</dd></div><div><dt>Sede</dt><dd>{detalle.data.sede}</dd></div><div><dt>Total</dt><dd>{dinero(detalle.data.total)}</dd></div></dl></section>
        <section><h3>Habitaciones y huéspedes</h3>{detalle.data.habitaciones.map((room, i) => <article className="cal-reserva-card" key={i}><strong>Habitación {room.numero} · {room.tipo}</strong><p>{fecha(room.entrada)} – {fecha(room.salida)} · {dinero(room.subtotal)}</p>{room.huespedes.length ? room.huespedes.map((guest, j) => <div className="cal-reserva-guest" key={j}><strong>{guest.datos.nombres} {guest.datos.apellidos} {guest.esTitular && '· Principal'}</strong><dl className="cal-reserva-grid"><div><dt>DNI</dt><dd>{guest.datos.dni || 'No registrado'}</dd></div><div><dt>Nacimiento</dt><dd>{guest.datos.fechaNacimiento ? fecha(guest.datos.fechaNacimiento) : 'No registrado'}</dd></div><div><dt>Sexo</dt><dd>{guest.datos.sexo === 'M' ? 'Masculino' : guest.datos.sexo === 'F' ? 'Femenino' : 'No registrado'}</dd></div><div><dt>Correo</dt><dd>{guest.datos.correo || 'No registrado'}</dd></div><div><dt>Teléfono</dt><dd>{guest.datos.telefono || 'No registrado'}</dd></div></dl></div>) : <p>Sin huéspedes registrados.</p>}</article>)}</section>
        <section><h3>Servicios adquiridos</h3>{detalle.data.servicios.length ? detalle.data.servicios.map(s => <p key={s.id}>{s.nombre} · {s.cantidad} unidades · {dinero(s.subtotal)}</p>) : <p>No se agregaron servicios.</p>}</section>
        <section><h3>Pagos registrados</h3>{detalle.data.pagos.length ? detalle.data.pagos.map((p, i) => <p key={i}>{p.metodo} · {p.estado} · {dinero(p.monto, p.moneda)}</p>) : <p>No hay pagos registrados.</p>}</section></>}
    </div>
  </dialog>
}
