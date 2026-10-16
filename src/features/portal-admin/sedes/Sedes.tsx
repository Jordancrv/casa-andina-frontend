import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'
import { useAuth } from '@/app/providers/auth-context'
import { getSedeIdFromToken } from '@/shared/lib/jwt'
import './sedes.css'

interface SedeAdminDto {
  id: number
  codigo: string
  nombre: string
  region: string
  ciudad: string
  direccion: string | null
  categoria: string
  telefono: string | null
}

export function Sedes() {
  const [search, setSearch] = useState('')
  const { usuario } = useAuth()
  const sedeAsignada = usuario ? getSedeIdFromToken(usuario.token) : null
  const alcanceGlobal = usuario?.rol === 'Superadministrador'
  const query = useQuery({
    queryKey: ['admin', 'sedes'],
    queryFn: async () => await api.get('/sedes') as SedeAdminDto[],
  })
  const sedes = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    return (query.data ?? [])
      .filter(sede => alcanceGlobal || (sedeAsignada !== null && sede.id === sedeAsignada))
      .filter(sede => !term || [sede.nombre, sede.ciudad, sede.region, sede.categoria, sede.codigo].some(value => value.toLocaleLowerCase().includes(term)))
  }, [alcanceGlobal, query.data, search, sedeAsignada])

  return (
    <main className="sites-page">
      <header className="sites-heading"><div><p>OPERACIÓN HOTELERA</p><h1>Sedes</h1><span>Catálogo de establecimientos disponibles.</span></div><label>Buscar sede<input value={search} onChange={event => setSearch(event.target.value)} maxLength={100} placeholder="Nombre, ciudad o región" /></label></header>
      {query.isLoading && <p className="sites-message" role="status">Consultando sedes…</p>}
      {query.isError && <div className="sites-message sites-message--error" role="alert"><span>No se pudo cargar el catálogo de sedes.</span><button onClick={() => void query.refetch()}>Reintentar</button></div>}
      {!alcanceGlobal && sedeAsignada === null && <p className="sites-message sites-message--error" role="alert">Tu cuenta no tiene una sede asignada. Contacta a la administración.</p>}
      {query.data && <div className="sites-summary"><strong>{sedes.length}</strong><span>{search ? 'sedes coincidentes' : 'sedes registradas'}</span></div>}
      {query.data && sedes.length === 0 && <p className="sites-message">No hay sedes que coincidan con la búsqueda.</p>}
      {query.data && sedes.length > 0 && <div className="sites-table-wrap"><table className="sites-table"><thead><tr><th>Código</th><th>Establecimiento</th><th>Ubicación</th><th>Categoría</th><th>Dirección</th><th>Teléfono</th></tr></thead><tbody>{sedes.map(sede => <tr key={sede.id}><td><strong>{sede.codigo}</strong></td><td>{sede.nombre}</td><td>{sede.ciudad} · {sede.region}</td><td>{sede.categoria}</td><td>{sede.direccion ?? 'No registrada'}</td><td>{sede.telefono ?? 'No registrado'}</td></tr>)}</tbody></table></div>}
      <p className="sites-footnote">Catálogo de solo lectura. La creación y edición se mantiene bajo el procedimiento SQL existente.</p>
    </main>
  )
}
