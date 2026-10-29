import { StayStatus } from '@/shared/ui/StayStatus'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/shared/lib/api'
import './recepcion.css'

interface RoomStay {
  id: number; codigoReserva: string; numero: string; tipo: string
  entradaPrevista: string; salidaPrevista: string; entradaReal: string | null; salidaReal: string | null
  estadoReserva: string; estadoHabitacion: string
  huespedes: { nombre: string; esTitular: boolean }[]
}
const stayStatus = (room: RoomStay) => room.salidaReal ? 'Estadía finalizada' : room.entradaReal ? 'Estadía en curso' : room.estadoReserva
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const planned = (value: string) => value.slice(0,10).split('-').reverse().join('/')
const actual = (value: string | null) => value ? new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' }).format(new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z')) : 'Sin registrar'

function StayDialog({ room, close, refresh }: { room: RoomStay; close: () => void; refresh: () => Promise<unknown> }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const checkout = Boolean(room.entradaReal)
  const allowed = !room.salidaReal && room.estadoReserva === 'Reservado' && (checkout || (room.estadoHabitacion === 'Disponible' && today() >= room.entradaPrevista.slice(0,10) && today() < room.salidaPrevista.slice(0,10)))
  useEffect(() => { const dialog=ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  const confirm = async () => {
    if (busy || !verified || !allowed || done) return
    setBusy(true); setError('')
    try {
      await api.post(`/recepcion/${room.id}/${checkout ? 'check-out' : 'check-in'}`)
      setDone(true)
      await refresh()
    } catch (reason) {
      setError(axios.isAxiosError(reason) ? reason.response?.data?.title || 'No se pudo registrar la operación. Actualiza y verifica la estadía antes de reintentar.' : 'No se pudo completar la operación.')
    } finally { setBusy(false) }
  }
  return <dialog ref={ref} className="reception-dialog" aria-labelledby="stay-dialog-title" onCancel={event => { event.preventDefault(); if (!busy) close() }}>
    <header><div><p>RECEPCIÓN · {room.codigoReserva}</p><h2 id="stay-dialog-title">Habitación {room.numero}</h2></div><button type="button" disabled={busy} aria-label="Cerrar detalle" onClick={close}>×</button></header>
    <div className="reception-dialog-body"><StayStatus status={done ? (checkout ? 'Estadía finalizada' : 'Estadía en curso') : stayStatus(room)} detailed /><p>{room.tipo}</p><dl><div><dt>Entrada prevista</dt><dd>{planned(room.entradaPrevista)}</dd></div><div><dt>Salida prevista</dt><dd>{planned(room.salidaPrevista)}</dd></div><div><dt>Check-in real</dt><dd>{actual(room.entradaReal)}</dd></div><div><dt>Check-out real</dt><dd>{actual(room.salidaReal)}</dd></div></dl>
      <h3>Huéspedes asignados</h3><ul>{room.huespedes.map((guest,index) => <li key={index}>{guest.nombre}{guest.esTitular && <small> Principal</small>}</li>)}</ul>
      {done ? <p className="reception-success" role="status">{checkout ? 'Check-out registrado. La habitación queda bloqueada hasta su preparación.' : 'Check-in registrado. La habitación está ocupada.'}</p> : <>
        {error && <p className="reception-error" role="alert">{error}</p>}
        {!allowed ? <p className="reception-note">Esta habitación no permite movimientos ahora. Para ingresar requiere fecha vigente, una reserva y habitación disponible.</p> : <>
          <p className="reception-note">{checkout ? 'La salida finalizará esta estadía. La habitación quedará bloqueada; el personal deberá marcarla disponible desde Habitaciones cuando esté preparada.' : 'Confirma la identidad de los huéspedes y que la habitación está preparada antes de entregar el acceso.'}</p>
          <label className="reception-confirm"><input type="checkbox" checked={verified} disabled={busy} onChange={event => setVerified(event.target.checked)} />{checkout ? 'He revisado la salida y los pagos de la reserva' : 'He verificado a los huéspedes y la entrega de la habitación'}</label>
          <button type="button" className="reception-primary" disabled={busy || !verified} onClick={() => void confirm()}>{busy ? 'Registrando…' : checkout ? 'Confirmar check-out' : 'Confirmar check-in'}</button>
        </>}
      </>}
    </div>
  </dialog>
}

export function Recepcion() {
  const [view,setView]=useState('llegadas')
  const [date,setDate]=useState(today)
  const [roomNumber,setRoomNumber]=useState('')
  const [code,setCode]=useState('')
  const [search,setSearch]=useState('')
  const [selected,setSelected]=useState<RoomStay | null>(null)
  const [page,setPage]=useState(1)
  const pageSize=20
  const query=useQuery({ queryKey:['recepcion',view,date,search,roomNumber,page], queryFn:async () => await api.get('/recepcion',{params:{vista:view,fecha:date,codigo:search || undefined,habitacion:roomNumber || undefined,pagina:page,tamanoPagina:pageSize}}) as unknown as RoomStay[] })
  const rooms = view === 'historial' ? query.data?.slice(0,pageSize) : query.data
  const hasNext = view === 'historial' && (query.data?.length ?? 0) > pageSize
  return <section className="reception-page"><header className="reception-heading"><p>OPERACIÓN HOTELERA</p><h1>Recepción</h1><span>Registra ingresos y salidas por habitación de tu sede.</span></header>
    <div className="reception-tabs" aria-label="Vista de recepción">{[['llegadas','Llegadas'],['estadia','En estadía'],['salidas','Salidas'],['historial','Historial']].map(([value,label]) => <button type="button" key={value} aria-pressed={view===value} className={view===value ? 'active' : ''} onClick={() => {setView(value);setSearch('');setCode('');setPage(1)}}>{label}</button>)}</div>
    <form className="reception-filters" onSubmit={event => {event.preventDefault();setPage(1);setSearch(code.trim().toUpperCase())}}><label>Fecha de referencia<input type="date" required value={date} onChange={event => setDate(event.target.value)} disabled={view==='estadia' || view==='historial' || !!search} /></label><label>Habitación<input maxLength={20} placeholder="Ej. 201" value={roomNumber} onChange={event => {setPage(1);setRoomNumber(event.target.value)}} /></label><label>Código de reserva<input maxLength={12} placeholder="CA-XXXXXXXXX" value={code} onChange={event => setCode(event.target.value)} /></label><button className="reception-primary" type="submit">Buscar reserva</button><button type="button" onClick={() => {setSearch('');setCode('');setRoomNumber('');setPage(1);void query.refetch()}}>Actualizar / limpiar</button></form>
    {view !== 'historial' && <p className="reception-note">{search ? 'Búsqueda por código en todas las fechas de tu sede (reservas activas).' : view==='llegadas' ? 'Ingresos pendientes dentro del periodo contratado para la fecha elegida.' : view==='salidas' ? 'Salidas previstas hasta la fecha elegida, incluidas las vencidas.' : 'Habitaciones con check-in registrado y sin check-out.'}</p>}
    {query.isFetching && <p role="status">Consultando recepción…</p>}
    {query.isError && <p className="reception-error" role="alert">No se pudo cargar recepción. Verifica que se aplicó la migración SQL y que tu cuenta tiene una sede asignada.</p>}
    {!query.isFetching && !query.isError && !rooms?.length && <div className="reception-empty">No hay habitaciones para esta consulta.</div>}
    {!query.isError && view === 'historial' && rooms && rooms.length > 0 && <><div className="reception-history-wrap"><table className="reception-history"><thead><tr><th>Reserva</th><th>Habitación</th><th>Entrada</th><th>Salida</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{rooms.map(room => <tr key={room.id}><td><strong>{room.codigoReserva}</strong></td><td>{room.numero}<small>{room.tipo}</small></td><td>{planned(room.entradaPrevista)}</td><td>{planned(room.salidaPrevista)}</td><td><StayStatus status={stayStatus(room)} /></td><td><button type="button" onClick={() => setSelected(room)}>Ver detalle</button></td></tr>)}</tbody></table></div><nav className="reception-pagination" aria-label="Páginas del historial"><button type="button" disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)}>Anterior</button><span>Página {page}</span><button type="button" disabled={!hasNext || query.isFetching} onClick={() => setPage(page + 1)}>Siguiente</button></nav></>}
    {!query.isError && view !== 'historial' && <div className="reception-list">{rooms?.map(room => <article key={room.id}><div className="reservation-status-heading"><strong className="reservation-code">{room.codigoReserva}</strong><StayStatus status={stayStatus(room)} /></div><div><h2>Habitación {room.numero}</h2><p>{room.tipo}</p></div><div><small>ENTRADA / SALIDA PREVISTAS</small><p>{planned(room.entradaPrevista)} — {planned(room.salidaPrevista)}</p></div><button className="reception-primary" type="button" onClick={() => setSelected(room)}>Ver detalle y gestionar</button></article>)}</div>}
    {selected && <StayDialog room={selected} close={() => setSelected(null)} refresh={() => query.refetch()} />}
  </section>
}
