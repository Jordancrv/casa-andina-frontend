import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import './clientes.css'

interface ReservaCliente {
  reservaId: number
  codigoReserva: string
  estado: string
  fechaCheckIn: string
  fechaCheckOut: string
  importe: number
  sede: string
}

interface Cliente {
  clienteId: number
  nombre: string
  tipoPersona: string
  correo: string | null
  totalReservas: number
  importeReservado: number
  historial: ReservaCliente[]
}

interface Paginated<T> {
  items: T[]
  pageNumber: number
  totalPages: number
  totalCount: number
}

const formatMoney = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
const formatDate = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))

function EyeIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
}

export function Clientes() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Cliente | null>(null)
  const query = useQuery({
    queryKey: ['admin', 'clientes', search, page],
    queryFn: async () => await api.get('/clientes', { params: { buscar: search || undefined, pageNumber: page, pageSize: 20 } }) as Paginated<Cliente>,
  })
  const data = query.data

  return (
    <main className="clients-page">
      <header className="clients-heading"><div><p>RELACIÓN CON CLIENTES</p><h1>Clientes</h1><span>Perfiles e historial de reservas dentro de tu alcance.</span></div><label className="clients-search"><span>Buscar</span><input value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} maxLength={100} placeholder="Nombre o correo" /></label></header>
      <div className="clients-summary" aria-live="polite"><strong>{data?.totalCount ?? (query.isLoading ? '—' : 0)}</strong><span>clientes encontrados</span></div>
      {query.isLoading && <p className="clients-message" role="status">Consultando clientes…</p>}
      {query.isError && <div className="clients-message clients-message--error" role="alert"><span>No se pudieron cargar los clientes. Verifica tu acceso e inténtalo nuevamente.</span><button onClick={() => void query.refetch()}>Reintentar</button></div>}
      {data && data.items.length === 0 && <p className="clients-message">No hay clientes que coincidan con la búsqueda.</p>}
      {data && data.items.length > 0 && <>
        <div className="clients-table-wrap"><table className="clients-table"><thead><tr><th>Cliente</th><th>Tipo</th><th>Correo</th><th>Reservas</th><th>Importe reservado*</th><th aria-label="Acciones" /></tr></thead><tbody>
          {data.items.map(client => <tr key={client.clienteId}><td><strong>{client.nombre}</strong></td><td>{client.tipoPersona}</td><td>{client.correo ?? 'Sin correo registrado'}</td><td>{client.totalReservas}</td><td>{formatMoney(client.importeReservado)}</td><td><button className="clients-icon-btn" onClick={() => setSelected(client)} aria-label={`Ver historial de ${client.nombre}`} title="Ver historial"><EyeIcon /></button></td></tr>)}
        </tbody></table></div>
        <footer className="clients-pagination"><span>Página {data.pageNumber} de {Math.max(data.totalPages, 1)}</span><div><button disabled={page <= 1} onClick={() => setPage(value => value - 1)} aria-label="Página anterior">Anterior</button><button disabled={page >= data.totalPages} onClick={() => setPage(value => value + 1)} aria-label="Página siguiente">Siguiente</button></div></footer>
        <p className="clients-footnote">* Importe de reservas no canceladas. No representa gasto cobrado: el API aún no relaciona aquí los pagos aprobados.</p>
      </>}
      {selected && <div className="clients-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null) }}><section className="clients-detail" role="dialog" aria-modal="true" aria-labelledby="client-detail-title"><header><div><p>HISTORIAL</p><h2 id="client-detail-title">{selected.nombre}</h2><span>{selected.correo ?? 'Sin correo registrado'} · {selected.tipoPersona}</span></div><button onClick={() => setSelected(null)} aria-label="Cerrar detalle">×</button></header><dl><div><dt>Total de reservas</dt><dd>{selected.totalReservas}</dd></div><div><dt>Importe reservado no cancelado</dt><dd>{formatMoney(selected.importeReservado)}</dd></div></dl><h3>Historial de reservas</h3>{selected.historial.length === 0 ? <p className="clients-message">Sin reservas registradas en el alcance disponible.</p> : <ul className="client-history">{selected.historial.map(item => <li key={item.reservaId}><div><strong>{item.codigoReserva}</strong><span>{item.sede} · {item.estado}</span></div><time>{formatDate(item.fechaCheckIn)} – {formatDate(item.fechaCheckOut)}</time><b>{formatMoney(item.importe)}</b></li>)}</ul>}</section></div>}
    </main>
  )
}
