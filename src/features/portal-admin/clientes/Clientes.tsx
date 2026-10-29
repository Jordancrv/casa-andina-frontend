import { useAccess } from '@/app/providers/access-context'
import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import { getSedeIdFromToken } from '@/shared/lib/jwt'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { getCatalogosCrm, getClientes, type ClientesFiltros } from './clientes.api'
import type { ActividadCliente, CategoriaCliente, Cliente } from './clientes.types'
import { ClienteForm } from './ClienteForm'
import './clientes.css'

const money = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
const date = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
const registeredDate = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(value.endsWith('Z') ? value : `${value}Z`))
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
const categorias: { nombre: CategoriaCliente; regla: string; proposito: string }[] = [
  { nombre: 'Ocasional', regla: '0–1 estadías completadas', proposito: 'Invítalo a descubrir una nueva estadía.' },
  { nombre: 'Frecuente', regla: '2–4 estadías completadas', proposito: 'Reconoce su preferencia con ofertas de regreso.' },
  { nombre: 'VIP', regla: '5 o más estadías completadas', proposito: 'Prioriza su seguimiento y beneficios exclusivos.' },
]

function Icon({ tipo }: { tipo: 'clientes' | 'reservas' | 'nuevos' | 'ver' | 'editar' | 'buscar' }) {
  return <svg width={tipo === 'ver' || tipo === 'editar' ? 16 : 20} height={tipo === 'ver' || tipo === 'editar' ? 16 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {tipo === 'clientes' && <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m4 10v-3a6 6 0 0 0-3-5"/></>}
    {tipo === 'reservas' && <><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M7 3v4m10-4v4M3 11h18m-13 5 3 3 5-5"/></>}
    {tipo === 'nuevos' && <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m4-14v8m-4-4h8"/></>}
    {tipo === 'ver' && <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}
    {tipo === 'editar' && <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14z"/></>}
    {tipo === 'buscar' && <><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>}
  </svg>
}

function ClienteDetail({ cliente, onClose, onEdit }: { cliente: Cliente; onClose: () => void; onEdit: () => void }) {
  const { can } = useAccess()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  const categoria = categorias.find(c => c.nombre === cliente.categoria)!
  return <dialog className="clients-dialog" ref={dialog} onCancel={event => { event.preventDefault(); onClose() }} aria-labelledby="client-detail-title">
    <section className="clients-detail"><header><div><p>PERFIL DEL CLIENTE</p><h2 id="client-detail-title">{cliente.nombre}</h2><span>{cliente.tipoPersona} · Registro {registeredDate(cliente.fechaRegistro)}</span></div><button onClick={onClose} aria-label="Cerrar detalle">×</button></header>
      <div className="clients-profile-segment"><span className={`clients-category is-${cliente.categoria.toLowerCase()}`}>{cliente.categoria}</span><p>{cliente.estadiasCompletadas} {cliente.estadiasCompletadas === 1 ? 'estadía completada' : 'estadías completadas'} en el alcance consultado.</p><small>{categoria.proposito}</small></div>
      <dl><div><dt>Documento</dt><dd>{cliente.documentoNumero ? `${cliente.documentoTipo} ${cliente.documentoNumero}` : 'No registrado'}</dd></div><div><dt>Estado comercial</dt><dd>{cliente.estado}</dd></div><div><dt>Correo de notificación</dt><dd>{cliente.correoNotificacion ?? 'No registrado'}</dd></div><div><dt>Teléfono</dt><dd>{cliente.telefono ?? 'No registrado'}</dd></div><div><dt>Correo de acceso</dt><dd>{cliente.correoAcceso ?? 'Sin cuenta de acceso'}</dd></div><div><dt>Sede de referencia</dt><dd>{cliente.sedeReferencia ?? 'Sin reservas ni sede de registro'}</dd></div><div><dt>Total de reservas</dt><dd>{cliente.totalReservas}</dd></div><div><dt>Reservas activas</dt><dd>{cliente.reservasActivas}</dd></div><div><dt>Importe reservado no cancelado</dt><dd>{money(cliente.importeReservado)}</dd></div><div><dt>Pagos aprobados (simulados)</dt><dd>{money(cliente.importePagadoSimulado)}</dd></div></dl>
      <p className="clients-footnote">Los pagos registrados son simulados; no representan cobros reales.</p>
      <div className="clients-history-heading"><h3>Historial de reservas</h3><button className="clients-text-button" disabled={!can("clientes.editar")} onClick={onEdit}>Editar perfil <Icon tipo="editar" /></button></div>
      {cliente.historial.length === 0 ? <p className="clients-message">Todavía no hay reservas en el alcance consultado.</p> : <ul className="client-history">{cliente.historial.map(item => <li key={item.reservaId}><div><strong>{item.codigoReserva}</strong><span>{item.sede} · {item.estado}</span></div><time>{date(item.fechaCheckIn)} – {date(item.fechaCheckOut)}</time><b>{money(item.importe)}</b></li>)}</ul>}
    </section>
  </dialog>
}

export function Clientes() {
  const { can } = useAccess()
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const scope = `${usuario?.rol}:${usuario ? getSedeIdFromToken(usuario.token) : ''}`
  const [search, setSearch] = useState('')
  const buscar = useDebounce(search.trim(), 300)
  const [filters, setFilters] = useState<Omit<ClientesFiltros, 'buscar'>>({ estado: '', sedeId: '', categoria: '', actividad: '', pageNumber: 1 })
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [editing, setEditing] = useState<{ cliente: Cliente | null } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const catalog = useQuery({ queryKey: ['admin', 'clientes-catalogos', scope], queryFn: ({ signal }) => getCatalogosCrm(signal) })
  const query = useQuery({ queryKey: ['admin', 'clientes', scope, buscar, filters], queryFn: ({ signal }) => getClientes({ ...filters, buscar }, signal) })
  const data = query.data
  const setFilter = <K extends keyof typeof filters>(key: K, value: typeof filters[K]) => { setFilters(prev => ({ ...prev, [key]: value, pageNumber: 1 })); setNotice(null) }
  const setActividad = (value: ActividadCliente) => setFilter('actividad', filters.actividad === value ? '' : value)
  const limpiar = () => { setSearch(''); setFilters({ estado: '', sedeId: '', categoria: '', actividad: '', pageNumber: 1 }); setNotice(null) }
  const onSaved = async (nuevo: boolean, sedeId: number | null) => {
    setNotice(nuevo ? 'Cliente registrado correctamente.' : 'Perfil del cliente actualizado.')
    setSelected(null)
    if (nuevo) { setSearch(''); setFilters({ estado: '', sedeId: catalog.data?.puedeElegirSede && sedeId ? String(sedeId) : '', categoria: '', actividad: '', pageNumber: 1 }) }
    await queryClient.invalidateQueries({ queryKey: ['admin', 'clientes'] })
  }
  const hayFiltros = !!(search || filters.estado || filters.sedeId || filters.categoria || filters.actividad)
  const editar = (cliente: Cliente) => { setSelected(null); setEditing({ cliente }); setNotice(null) }
  const kpis = [
    { label: 'Total clientes', value: data?.kpis.totalClientes, note: 'Perfiles en el resultado', tipo: 'clientes' as const, actividad: '' as ActividadCliente },
    { label: 'Con reservas activas', value: data?.kpis.conReservasActivas, note: 'Clientes con estadías vigentes o futuras', tipo: 'reservas' as const, actividad: 'ConReservasActivas' as ActividadCliente },
    { label: 'Nuevos este mes', value: data?.kpis.nuevosEsteMes, note: 'Registrados durante este mes', tipo: 'nuevos' as const, actividad: 'NuevosMes' as ActividadCliente },
  ]
  return <main className="clients-page">
    <header className="clients-heading"><div><p>RELACIÓN CON CLIENTES</p><h1>Clientes</h1><span>Conoce a tus huéspedes y encuentra oportunidades para que regresen.</span></div><label className="clients-search"><span>Buscar cliente</span><div><Icon tipo="buscar" /><input value={search} onChange={event => { setSearch(event.target.value); setFilters(prev => ({ ...prev, pageNumber: 1 })) }} maxLength={100} placeholder="Nombre, correo o documento" /></div></label></header>
    <section className="clients-kpis" aria-label="Indicadores de clientes" aria-busy={query.isFetching}>{kpis.map(kpi => <button key={kpi.label} type="button" className={`clients-kpi ${filters.actividad === kpi.actividad ? 'is-selected' : ''}`} aria-pressed={filters.actividad === kpi.actividad} onClick={() => kpi.actividad ? setActividad(kpi.actividad) : setFilter('actividad', '')}><div><span>{kpi.label}</span><Icon tipo={kpi.tipo} /></div><strong>{kpi.value === undefined ? '—' : kpi.value.toLocaleString('es-PE')}</strong><small>{kpi.note}</small></button>)}</section>
    <p className="clients-kpi-note">Los indicadores reflejan los filtros seleccionados. Pulsa una tarjeta para filtrar la lista.</p>
    <div className="clients-segments" aria-label="Filtrar por categoría"><button aria-pressed={!filters.categoria} className={!filters.categoria ? 'is-selected' : ''} onClick={() => setFilter('categoria', '')}>Todos los clientes</button>{categorias.map(categoria => <button key={categoria.nombre} className={filters.categoria === categoria.nombre ? 'is-selected' : ''} aria-pressed={filters.categoria === categoria.nombre} title={categoria.regla} onClick={() => setFilter('categoria', categoria.nombre)}><i className={`is-${categoria.nombre.toLowerCase()}`} aria-hidden="true" />{categoria.nombre}<small>{categoria.nombre === 'VIP' ? '5+' : categoria.nombre === 'Frecuente' ? '2–4' : '0–1'}</small></button>)}</div>
    <div className="clients-toolbar"><div className="clients-summary" aria-live="polite"><strong>{data?.totalCount.toLocaleString('es-PE') ?? '—'}</strong><span>clientes encontrados</span>{query.isFetching && <small>Actualizando…</small>}</div><div className="clients-filters"><label><span className="clients-sr-only">Filtrar por estado</span><select value={filters.estado} onChange={event => setFilter('estado', event.target.value as typeof filters.estado)}><option value="">Estado: Todos</option><option value="Activo">Activos</option><option value="Inactivo">Inactivos</option></select></label><label><span className="clients-sr-only">Filtrar por sede</span><select value={catalog.data?.puedeElegirSede ? filters.sedeId : catalog.data?.sedeAsignadaId ?? ''} disabled={!catalog.data?.puedeElegirSede} onChange={event => setFilter('sedeId', event.target.value)}><option value="">{catalog.data?.puedeElegirSede ? 'Sede: Todas' : 'Sede asignada'}</option>{catalog.data?.sedes.map(sede => <option key={sede.id} value={sede.id}>{sede.nombre}</option>)}</select></label><button className="clients-primary" disabled={!catalog.data || catalog.data.sedes.length === 0 || !can("clientes.crear")} onClick={() => { setEditing({ cliente: null }); setNotice(null) }}><span aria-hidden="true">＋</span> Nuevo cliente</button></div></div>
    {hayFiltros && <div className="clients-active-filters"><span>{filters.categoria ? `${filters.categoria} · ${categorias.find(c => c.nombre === filters.categoria)?.regla}` : 'Resultados filtrados'}{filters.actividad && ` · ${filters.actividad === 'NuevosMes' ? 'Nuevos este mes' : 'Con reservas activas'}`}</span><button onClick={limpiar}>Limpiar filtros ×</button></div>}
    {notice && <p className="clients-notice" role="status">{notice}<button aria-label="Cerrar mensaje" onClick={() => setNotice(null)}>×</button></p>}
    {catalog.isError && <div className="clients-message clients-message--error" role="alert"><span>No se cargaron las opciones del formulario ni del filtro de sedes.</span><button onClick={() => void catalog.refetch()}>Reintentar</button></div>}
    {query.isLoading && <div className="clients-message" role="status">Consultando perfiles e historial de clientes…</div>}
    {query.isError && <div className="clients-message clients-message--error" role="alert"><span>No se pudieron cargar los clientes. Verifica tu acceso y vuelve a intentarlo.</span><button onClick={() => void query.refetch()}>Reintentar</button></div>}
    {data && data.items.length === 0 && <div className="clients-empty"><Icon tipo="clientes" /><h2>{hayFiltros ? 'No hay coincidencias' : 'Empieza a conocer a tus clientes'}</h2><p>{hayFiltros ? 'Prueba otro nombre, documento o combinación de filtros.' : 'Los clientes con reservas o registrados en tu sede aparecerán aquí.'}</p>{hayFiltros && <button onClick={limpiar}>Limpiar filtros</button>}</div>}
    {data && data.items.length > 0 && <>
      <div className="clients-table-wrap"><table className="clients-table"><caption className="clients-sr-only">Directorio de clientes segmentado por estadías completadas</caption><thead><tr><th>Cliente</th><th>Contacto</th><th>Documento</th><th>Sede de referencia</th><th>Reservas</th><th>Categoría</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{data.items.map(cliente => <tr key={cliente.clienteId}><td><div className="clients-identity"><span className="clients-avatar" aria-hidden="true">{initials(cliente.nombre)}</span><div><strong>{cliente.nombre}</strong><small>{cliente.tipoPersona}</small></div></div></td><td><span title={cliente.correoNotificacion ?? cliente.correoAcceso ?? undefined}>{cliente.correoNotificacion ?? cliente.correoAcceso ?? 'Sin correo registrado'}</span><small>{cliente.telefono ?? 'Sin teléfono'}</small></td><td>{cliente.documentoNumero ? <><span>{cliente.documentoTipo}</span><small>{cliente.documentoNumero}</small></> : <span className="clients-muted">No registrado</span>}</td><td className="clients-site-cell">{cliente.sedeReferencia ?? 'Sin sede de referencia'}</td><td><strong>{cliente.totalReservas}</strong><small>{cliente.estadiasCompletadas} {cliente.estadiasCompletadas === 1 ? 'completada' : 'completadas'}</small>{cliente.reservasActivas > 0 && <small>{cliente.reservasActivas} {cliente.reservasActivas === 1 ? 'activa' : 'activas'}</small>}</td><td><span className={`clients-category is-${cliente.categoria.toLowerCase()}`}>{cliente.categoria}</span></td><td><span className={`clients-status ${cliente.estado === 'Activo' ? 'is-active' : 'is-inactive'}`}><i aria-hidden="true" />{cliente.estado}</span></td><td><div className="clients-actions"><button onClick={() => setSelected(cliente)} aria-label={`Ver perfil de ${cliente.nombre}`} title="Ver perfil"><Icon tipo="ver" /></button><button disabled={!catalog.data || !can("clientes.editar")} onClick={() => editar(cliente)} aria-label={`Editar ${cliente.nombre}`} title="Editar cliente"><Icon tipo="editar" /></button></div></td></tr>)}</tbody></table></div>
      <footer className="clients-pagination"><span>Mostrando {(data.pageNumber - 1) * 10 + 1}–{(data.pageNumber - 1) * 10 + data.items.length} de {data.totalCount} clientes</span><div><button disabled={!data.hasPreviousPage || query.isFetching} onClick={() => setFilters(prev => ({ ...prev, pageNumber: data.pageNumber - 1 }))}>Anterior</button><span>{data.pageNumber} / {Math.max(data.totalPages, 1)}</span><button disabled={!data.hasNextPage || query.isFetching} onClick={() => setFilters(prev => ({ ...prev, pageNumber: data.pageNumber + 1 }))}>Siguiente</button></div></footer>
    </>}
    <p className="clients-footnote">Categorías automáticas según estadías completadas en la sede o alcance consultado. La sede de referencia corresponde a la reserva más reciente o a la sede de registro.</p>
    {selected && <ClienteDetail cliente={selected} onClose={() => setSelected(null)} onEdit={() => { if (catalog.data) editar(selected) }} />}
    {editing && catalog.data && <ClienteForm cliente={editing.cliente} catalogos={catalog.data} sedeInicial={filters.sedeId} onClose={() => setEditing(null)} onSaved={onSaved} />}
  </main>
}
