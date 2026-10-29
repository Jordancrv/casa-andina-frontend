import { useAccess } from '@/app/providers/access-context'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/shared/lib/api'
import { getCatalogos } from '../habitaciones/habitaciones.api'
import './comodidades.css'

export function Comodidades() {
  const { can } = useAccess()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const catalog = useQuery({ queryKey: ['comodidades'], queryFn: getCatalogos })
  const create = useMutation({
    mutationFn: () => api.post('/comodidades', { nombre: name.trim() }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['comodidades'] }); setName(''); setOpen(false); setError('') },
    onError: (reason) => setError(axios.isAxiosError(reason) ? reason.response?.data?.detail || reason.response?.data?.title || 'No se pudo crear la comodidad.' : 'No se pudo crear la comodidad.'),
  })
  const comodidades = catalog.data?.comodidades.filter(item => item.nombre.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) ?? []
  return <main className="amenities-page">
    <header className="amenities-heading"><div><span>ADMINISTRACIÓN HOTELERA</span><h1>Comodidades</h1><p>Consulta y crea las características disponibles para las habitaciones.</p></div><button className="amenities-primary" disabled={!can("comodidades.crear")} onClick={() => { setOpen(true); setError('') }}>＋ Nueva comodidad</button></header>
    <div className="amenities-note">El catálogo es compartido por la cadena. La asignación se realiza en cada habitación de tu sede.</div>
    <section className="amenities-card"><div className="amenities-toolbar"><div><h2>Catálogo de comodidades</h2><p>{comodidades.length} resultados</p></div><label><span>Buscar comodidad</span><input type="search" placeholder="Buscar por nombre" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
      {catalog.isLoading && <p role="status">Cargando comodidades…</p>}
      {catalog.isError && <p role="alert">No se pudo cargar el catálogo. <button onClick={() => void catalog.refetch()}>Reintentar</button></p>}
      {!catalog.isLoading && !catalog.isError && (comodidades.length ? <div className="amenities-table"><table><thead><tr><th>Comodidad</th><th>Asignación</th></tr></thead><tbody>{comodidades.map(item => <tr key={item.id}><td><strong>{item.nombre}</strong></td><td>Gestionada por habitación</td></tr>)}</tbody></table></div> : <p>No se encontraron comodidades.</p>)}
      <button className="amenities-secondary" disabled={!can("habitaciones.ver")} onClick={() => navigate('/admin/habitaciones')}>Administrar habitaciones</button>
    </section>
    {open && <div className="amenities-overlay" onClick={event => { if (event.target === event.currentTarget && !create.isPending) setOpen(false) }}><form className="amenities-modal" role="dialog" aria-modal="true" aria-labelledby="amenities-title" onSubmit={event => { event.preventDefault(); if (name.trim()) create.mutate() }}><header><h2 id="amenities-title">Nueva comodidad</h2><button type="button" disabled={create.isPending} onClick={() => setOpen(false)} aria-label="Cerrar">×</button></header><p>Estará disponible para las habitaciones de todas las sedes.</p><label>Nombre<input autoFocus required maxLength={60} value={name} onChange={event => {setName(event.target.value);setError('')}} placeholder="Ej. Aire acondicionado" /></label>{error && <p role="alert" className="amenities-error">{error}</p>}<footer><button type="button" disabled={create.isPending} onClick={() => setOpen(false)}>Cancelar</button><button className="amenities-primary" type="submit" disabled={create.isPending || !name.trim()}>{create.isPending ? 'Guardando…' : 'Crear comodidad'}</button></footer></form></div>}
  </main>
}
