import { useAccess } from '@/app/providers/access-context'
import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useAuth } from '@/app/providers/auth-context'
import { getCatalogos } from '@/features/portal-admin/habitaciones/habitaciones.api'
import { getSedeIdFromToken } from '@/shared/lib/jwt'
import type { SedeDto, ServicioDto, ServicioPayload } from '@/shared/types/global.types'
import {
  createServicio, deactivateServicio, getServicio, listServicios, updateServicio,
} from './servicios.api'
import './servicios.css'

const emptyForm: ServicioPayload = {
  nombre: '', descripcion: '', precio: 0, sedesIds: [],
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback
  const data = error.response?.data as {
    title?: string
    message?: string
    errors?: Record<string, string[]>
  } | undefined
  return (data?.errors ? Object.values(data.errors).flat()[0] : undefined)
    ?? data?.title ?? data?.message ?? fallback
}

export const Servicios = () => {
  const { can } = useAccess()
  const { usuario } = useAuth()
  const sedeAsignadaId = usuario ? getSedeIdFromToken(usuario.token) : null
  const alcanceGlobal = usuario?.rol === 'Superadministrador' && sedeAsignadaId === null

  const [servicios, setServicios] = useState<ServicioDto[]>([])
  const [sedes, setSedes] = useState<SedeDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sedeFiltro, setSedeFiltro] = useState<number | 'Todas'>('Todas')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ServicioPayload>(emptyForm)
  const [detail, setDetail] = useState<ServicioDto | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [firstPage, catalogos] = await Promise.all([
        listServicios({ pageSize: 100 }),
        getCatalogos(),
      ])
      const pages = [firstPage]
      for (let pageNumber = 2; pageNumber <= firstPage.totalPages; pageNumber += 1) {
        pages.push(await listServicios({ pageNumber, pageSize: 100 }))
      }
      setServicios(pages.flatMap((page) => page.items))
      setSedes(alcanceGlobal ? catalogos.sedes : catalogos.sedes.filter(sede => sede.id === sedeAsignadaId))
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'No se pudieron cargar los servicios.'))
    } finally {
      setIsLoading(false)
    }
  }, [alcanceGlobal, sedeAsignadaId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadData(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return servicios.filter((servicio) => {
      const text = `${servicio.nombre} ${servicio.descripcion ?? ''} ${servicio.sedes.join(' ')}`
      const matchesText = !normalized || text.toLowerCase().includes(normalized)
      const matchesSede = !alcanceGlobal || sedeFiltro === 'Todas' || servicio.sedesIds.includes(sedeFiltro)
      return matchesText && matchesSede
    })
  }, [alcanceGlobal, query, sedeFiltro, servicios])

  const promedio = servicios.length
    ? servicios.reduce((total, servicio) => total + servicio.precio, 0) / servicios.length
    : 0

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      sedesIds: !alcanceGlobal && sedeAsignadaId ? [sedeAsignadaId] : [],
    })
    setError(null)
    setIsFormOpen(true)
  }

  const openEdit = (servicio: ServicioDto) => {
    setEditingId(servicio.id)
    setForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion ?? '',
      precio: servicio.precio,
      sedesIds: servicio.sedesIds,
    })
    setDetail(null)
    setError(null)
    setIsFormOpen(true)
  }

  const openDetail = async (id: number) => {
    setError(null)
    try {
      setDetail(await getServicio(id))
    } catch (detailError) {
      setError(getErrorMessage(detailError, 'No se pudo consultar el servicio.'))
    }
  }

  const toggleSede = (sedeId: number) => {
    if (!alcanceGlobal) return
    setForm((current) => ({
      ...current,
      sedesIds: current.sedesIds.includes(sedeId)
        ? current.sedesIds.filter((id) => id !== sedeId)
        : [...current.sedesIds, sedeId],
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (form.sedesIds.length === 0) {
      setError('Seleccione al menos una sede.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) await updateServicio(editingId, form)
      else await createServicio(form)
      setIsFormOpen(false)
      await loadData()
    } catch (submitError) {
      setError(getErrorMessage(
        submitError,
        `No se pudo ${editingId ? 'actualizar' : 'crear'} el servicio.`
      ))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async (servicio: ServicioDto) => {
    if (!window.confirm(`¿Desactivar el servicio "${servicio.nombre}"? Su historial se conservará.`)) return
    setIsSubmitting(true)
    setError(null)
    try {
      await deactivateServicio(servicio.id)
      setDetail(null)
      await loadData()
    } catch (deactivateError) {
      setError(getErrorMessage(deactivateError, 'No se pudo desactivar el servicio.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="services-content">
      <header className="services-heading">
        <div>
          <span className="services-eyebrow">OPERACIÓN / CATÁLOGO</span>
          <h1>Servicios</h1>
          <p>Administra servicios complementarios, tarifas y disponibilidad por sede.</p>
        </div>
        <button className="services-primary" type="button" disabled={!can("servicios.crear")} onClick={openCreate}>
          Nuevo servicio
        </button>
      </header>

      {error && <div className="services-alert" role="alert">{error}</div>}
      {isLoading && <div className="services-empty">Cargando servicios...</div>}

      {!isLoading && (
        <>
          <section className="services-metrics" aria-label="Resumen de servicios">
            <div><span>Servicios activos</span><strong>{servicios.length}</strong></div>
            <div><span>Precio promedio</span><strong>S/ {promedio.toFixed(2)}</strong></div>
            <div><span>Sedes con servicios</span><strong>{new Set(servicios.flatMap((s) => s.sedesIds)).size}</strong></div>
          </section>

          <section className="services-panel">
            <div className="services-toolbar">
              <div><h2>Catálogo operativo</h2><span>{filtered.length} resultados</span></div>
              <label className="services-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar servicio..."
                  aria-label="Buscar servicios"
                />
              </label>
            </div>
            {alcanceGlobal && <div className="services-filters">
              <label>
                Sede
                <select
                  value={sedeFiltro}
                  onChange={(event) => setSedeFiltro(
                    event.target.value === 'Todas' ? 'Todas' : Number(event.target.value)
                  )}
                >
                  <option value="Todas">Todas</option>
                  {sedes.map((sede) => <option key={sede.id} value={sede.id}>{sede.nombre}</option>)}
                </select>
              </label>
            </div>}

            <div className="services-table-wrap">
              <table>
                <thead><tr><th>Servicio</th><th>Sedes asignadas</th><th>Precio</th><th>Acciones</th></tr></thead>
                <tbody>
                  {filtered.map((servicio) => (
                    <tr key={servicio.id}>
                      <td><strong>{servicio.nombre}</strong><small>{servicio.descripcion || 'Sin descripción'}</small></td>
                      <td>{alcanceGlobal ? servicio.sedes.join(', ') : sedes.map(sede => sede.nombre).join(', ')}</td>
                      <td className="services-price">S/ {servicio.precio.toFixed(2)}</td>
                      <td>
                        <button
                          className="services-action"
                          type="button"
                          title="Ver detalle completo"
                          aria-label={`Ver detalle de ${servicio.nombre}`}
                          onClick={() => void openDetail(servicio.id)}
                        >
                          •••
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="services-empty">No hay servicios con esos filtros.</div>}
            </div>
          </section>
        </>
      )}

      {isFormOpen && (
        <div className="services-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsFormOpen(false)
        }}>
          <section className="services-modal" role="dialog" aria-modal="true" aria-labelledby="service-form-title">
            <header>
              <div>
                <span className="services-eyebrow">{editingId ? 'ACTUALIZACIÓN' : 'NUEVO REGISTRO'}</span>
                <h2 id="service-form-title">{editingId ? 'Editar servicio' : 'Crear servicio'}</h2>
              </div>
              <button type="button" className="services-close" onClick={() => setIsFormOpen(false)} aria-label="Cerrar">×</button>
            </header>
            {error && <div className="services-alert" role="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="services-form-grid">
                <label>Nombre *
                  <input required maxLength={100} value={form.nombre}
                    onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
                </label>
                <label>Precio *
                  <input required type="number" min="0" max="99999999.99" step="0.01" value={form.precio}
                    onChange={(event) => setForm({ ...form, precio: Number(event.target.value) })} />
                </label>
                <label className="services-full-width">Descripción
                  <textarea maxLength={300} rows={3} value={form.descripcion ?? ''}
                    onChange={(event) => setForm({ ...form, descripcion: event.target.value })} />
                </label>
              </div>
              <fieldset>
                <legend>{alcanceGlobal ? 'Sedes disponibles *' : 'Sede asignada'}</legend>
                <div className="services-sedes">
                  {sedes.map((sede) => {
                    const allowed = alcanceGlobal || sede.id === sedeAsignadaId
                    return (
                      <label key={sede.id} className={!allowed ? 'is-disabled' : ''}>
                        <input type="checkbox" checked={form.sedesIds.includes(sede.id)}
                          disabled={!allowed || !alcanceGlobal} onChange={() => toggleSede(sede.id)} />
                        <span>{sede.nombre}<small>{sede.ciudad}</small></span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <footer>
                <button className="services-secondary" type="button" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                <button className="services-primary" type="submit" disabled={isSubmitting || !can(editingId ? "servicios.editar" : "servicios.crear")}>
                  {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar servicio' : 'Guardar servicio'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {detail && (
        <div className="services-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetail(null)
        }}>
          <section className="services-modal services-detail" role="dialog" aria-modal="true" aria-labelledby="service-detail-title">
            <header>
              <div><span className="services-eyebrow">DETALLE DEL SERVICIO</span><h2 id="service-detail-title">{detail.nombre}</h2></div>
              <button type="button" className="services-close" onClick={() => setDetail(null)} aria-label="Cerrar">×</button>
            </header>
            <dl>
              <div><dt>Precio</dt><dd>S/ {detail.precio.toFixed(2)}</dd></div>
              <div><dt>Estado</dt><dd><span className="services-status">Activo</span></dd></div>
              <div className="services-full-width"><dt>Descripción</dt><dd>{detail.descripcion || 'Sin descripción registrada.'}</dd></div>
              <div className="services-full-width"><dt>Sedes asignadas</dt><dd>{alcanceGlobal ? detail.sedes.join(', ') : sedes.map(sede => sede.nombre).join(', ')}</dd></div>
            </dl>
            {!detail.puedeEditar && <p>Este servicio es compartido. Su modificación corresponde a la administración de la cadena.</p>}
            <footer>
              <button className="services-danger" type="button" disabled={isSubmitting || !detail.puedeEditar || !can("servicios.desactivar")}
                onClick={() => void handleDeactivate(detail)}>Desactivar</button>
              <button className="services-secondary" type="button" disabled={!detail.puedeEditar || !can("servicios.editar")} onClick={() => openEdit(detail)}>Editar</button>
              <button className="services-primary" type="button" onClick={() => setDetail(null)}>Cerrar</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}
