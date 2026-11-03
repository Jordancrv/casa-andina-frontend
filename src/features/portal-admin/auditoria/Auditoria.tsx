import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import { useDebounce } from '@/shared/hooks/useDebounce'
import './auditoria.css'

interface Evento { id: number; fechaUtc: string; usuario: string; correo: string; accion: string; entidad: string; entidadId: string; operacion: string | null }
interface Detalle extends Evento { antes: { campo: string; valor: string }[]; despues: { campo: string; valor: string }[] }
interface Resultado { items: Evento[]; pagina: number; haySiguiente: boolean }
const acciones: Record<string, string> = { INSERT: 'Creación', UPDATE: 'Actualización', DELETE: 'Eliminación', LOGIN: 'Inicio de sesión', LOGOUT: 'Cierre de sesión', OTRA: 'Consulta' }
const entidades: Record<string, string> = { Habitaciones: 'Habitaciones', Habitacion: 'Habitaciones', Servicios: 'Servicios', Servicio: 'Servicios', Comodidades: 'Comodidades', Comodidad: 'Comodidades', Recepcion: 'Recepción', Reserva: 'Reservas', ReservaHabitacion: 'Recepción', Reservas: 'Reservas', Usuarios: 'Usuarios', Usuario: 'Usuarios', UsuarioRoles: 'Roles de usuario', Accesos: 'Roles y accesos', Rol: 'Roles', Cliente: 'Clientes', Clientes: 'Clientes', Dashboard: 'Dashboard', Reportes: 'Reportes', Calendario: 'Calendario', Sesion: 'Sesión' }
const operaciones: Record<string, string> = { Get: 'Consultar', GetById: 'Ver detalle', Create: 'Crear', Update: 'Actualizar', Deactivate: 'Desactivar', Activate: 'Activar', CheckIn: 'Registrar ingreso', CheckOut: 'Registrar salida', Analizar: 'Generar análisis', Descargar: 'Descargar reporte', Guardar: 'Guardar', Asignar: 'Asignar roles', CrearPersonal: 'Crear personal', UpdateAccount: 'Editar cuenta', GetDocumentTypes: 'Consultar documentos' }
const fecha = (valor: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(valor.endsWith('Z') ? valor : `${valor}Z`))

function DetalleEvento({ id, close }: { id: number; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  const detail = useQuery({ queryKey: ['auditoria', 'detalle', id], queryFn: async () => await api.get(`/auditoria/${id}`) as Detalle })
  return <dialog ref={dialog} className="audit-dialog" aria-labelledby="audit-detail-title" onCancel={event => { event.preventDefault(); close() }}><div className="audit-detail">
    <header><div><p>REGISTRO DE ACTIVIDAD</p><h2 id="audit-detail-title">Detalle de la acción</h2></div><button type="button" onClick={close} aria-label="Cerrar detalle">×</button></header>
    {detail.isLoading && <p role="status">Cargando detalle…</p>}{detail.isError && <p className="audit-error" role="alert">No se pudo cargar este evento o no pertenece a tu sede.</p>}
    {detail.data && <><dl className="audit-detail-grid"><div><dt>Fecha y hora</dt><dd>{fecha(detail.data.fechaUtc)} · Perú</dd></div><div><dt>Personal</dt><dd>{detail.data.usuario}<small>{detail.data.correo}</small></dd></div><div><dt>Acción</dt><dd>{acciones[detail.data.accion] ?? detail.data.accion}{detail.data.operacion && <> · {operaciones[detail.data.operacion] ?? detail.data.operacion}</>}</dd></div><div><dt>Módulo</dt><dd>{entidades[detail.data.entidad] ?? detail.data.entidad}</dd></div><div><dt>Referencia</dt><dd>{detail.data.entidadId === '-' ? 'No registrada' : `#${detail.data.entidadId}`}</dd></div><div><dt>Evento de auditoría</dt><dd>#{detail.data.id}</dd></div></dl>
      {(detail.data.antes.length > 0 || detail.data.despues.length > 0) ? <div className="audit-changes">{([['Antes', detail.data.antes], ['Después', detail.data.despues]] as const).filter(([, values]) => values.length > 0).map(([title, values]) => <section key={title}><h3>{title}</h3><dl>{values.map(item => <div key={item.campo}><dt>{item.campo}</dt><dd>{item.valor}</dd></div>)}</dl></section>)}</div> : <p className="audit-detail-note">Este evento registra la operación, pero no contiene un detalle de valores anteriores o posteriores.</p>}
      <p className="audit-detail-note">La referencia identifica el registro relacionado cuando está disponible; puede ser un ID interno o un código de reserva.</p></>}
    <footer><button type="button" onClick={close}>Cerrar</button></footer>
  </div></dialog>
}

export function Auditoria() {
  const [buscar, setBuscar] = useState(''); const [accion, setAccion] = useState(''); const [desde, setDesde] = useState(''); const [hasta, setHasta] = useState(''); const [pagina, setPagina] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const busqueda = useDebounce(buscar.trim(), 300)
  const invalido = !!desde && !!hasta && desde > hasta
  const query = useQuery({ queryKey: ['auditoria', busqueda, accion, desde, hasta, pagina], enabled: !invalido,
    queryFn: async () => await api.get('/auditoria', { params: { pagina, buscar: busqueda || undefined, accion: accion || undefined, desde: desde || undefined, hasta: hasta || undefined } }) as Resultado })
  return <main className="audit-page"><header className="audit-heading"><div><p>ADMINISTRACIÓN DE LA SEDE</p><h1>Auditoría</h1><span>Actividad registrada del personal de tu sede.</span></div><button type="button" disabled={query.isFetching || invalido} onClick={() => void query.refetch()}>Actualizar</button></header>
    <section className="audit-panel" aria-label="Filtros de auditoría"><div className="audit-filters">
      <label>Buscar<input value={buscar} maxLength={100} placeholder="Personal, correo o módulo" onChange={e => { setBuscar(e.target.value); setPagina(1) }}/></label>
      <label>Acción<select value={accion} onChange={e => { setAccion(e.target.value); setPagina(1) }}><option value="">Todas</option>{Object.entries(acciones).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Desde<input type="date" value={desde} onChange={e => { setDesde(e.target.value); setPagina(1) }}/></label><label>Hasta<input type="date" value={hasta} onChange={e => { setHasta(e.target.value); setPagina(1) }}/></label>
    </div>{invalido && <p className="audit-error" role="alert">La fecha inicial debe ser anterior o igual a la final.</p>}</section>
    <section className="audit-panel"><div className="audit-section-heading"><div><p>REGISTRO DE ACTIVIDAD</p><h2>Eventos de la sede</h2></div><span>Hora de Perú</span></div><p className="audit-description">Consultas y acciones completadas por el personal, junto con los registros detallados existentes.</p>
      {query.isLoading && <p role="status">Cargando actividad…</p>}{query.isError && <p className="audit-error" role="alert">No se pudo cargar la auditoría. Comprueba tu acceso y vuelve a intentarlo.</p>}
      {query.data && query.data.items.length === 0 && <p className="audit-empty">No hay eventos para los filtros seleccionados.</p>}
      {!!query.data?.items.length && <div className="audit-table-wrap"><table><thead><tr><th>Fecha y hora</th><th>Personal</th><th>Acción</th><th>Módulo</th><th>Referencia</th><th>Detalle</th></tr></thead><tbody>{query.data.items.map(evento => <tr key={evento.id}><td>{fecha(evento.fechaUtc)}</td><td><strong>{evento.usuario}</strong><small>{evento.correo}</small></td><td><span className="audit-badge">{acciones[evento.accion] ?? evento.accion}</span>{evento.operacion && <small>{operaciones[evento.operacion] ?? evento.operacion}</small>}</td><td>{entidades[evento.entidad] ?? evento.entidad}</td><td>{evento.entidadId !== '-' ? `#${evento.entidadId}` : '—'}</td><td><button type="button" className="audit-view" onClick={() => setSelected(evento.id)} aria-label={`Ver detalle del evento ${evento.id}`} title="Ver detalle"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button></td></tr>)}</tbody></table></div>}
      <footer className="audit-pagination"><span>Página {pagina}</span><div><button type="button" disabled={pagina <= 1 || query.isFetching} onClick={() => setPagina(pagina - 1)}>Anterior</button><button type="button" disabled={!query.data?.haySiguiente || query.isFetching} onClick={() => setPagina(pagina + 1)}>Siguiente</button></div></footer>
    </section>{selected !== null && <DetalleEvento id={selected} close={() => setSelected(null)} />}</main>
}
