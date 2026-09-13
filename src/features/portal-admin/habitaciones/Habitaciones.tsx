import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listHabitaciones,
  createHabitacion,
  getCatalogos,
  type HabitacionDto,
  type CreateHabitacionPayload,
  type TipoHabitacionDto,
  type ComodidadDto,
  type SedeDto,
} from './habitaciones.api'
import logoCasaAndina from '@/assets/casa-andina.png'
import './habitaciones.css'

type FiltroEstado = 'Todas' | 'Disponible' | 'Ocupada' | 'Mantenimiento' | 'Bloqueada'

const emptyForm: CreateHabitacionPayload = {
  sedeId: 0,
  tipoHabitacionId: 0,
  numero: '',
  piso: 1,
  precioBase: 0,
  estado: 'Disponible',
  fotoUrl: '',
  comodidadesIds: [],
}

export const Habitaciones = () => {
  const navigate = useNavigate()

  const [habitaciones, setHabitaciones] = useState<HabitacionDto[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [error, setError]               = useState<string | null>(null)

  // Catálogos desde la BD
  const [tiposHabitacion, setTiposHabitacion] = useState<TipoHabitacionDto[]>([])
  const [comodidades, setComodidades]         = useState<ComodidadDto[]>([])
  const [sedesCatalog, setSedesCatalog]       = useState<SedeDto[]>([])

  const [query, setQuery]   = useState('')
  const [sede, setSede]     = useState('Todas')
  const [estado, setEstado] = useState<FiltroEstado>('Todas')

  // Modal para Crear Habitación
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm]               = useState<CreateHabitacionPayload>(emptyForm)
  const [precioDisplay, setPrecioDisplay] = useState('S/ 0.00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal para Ver Detalle (al hacer clic en los 3 puntos •••)
  const [detailHabitacion, setDetailHabitacion] = useState<HabitacionDto | null>(null)

  // ── Carga inicial desde el backend ────────────────────────────────────────
  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [habData, catData] = await Promise.all([
        listHabitaciones(),
        getCatalogos(),
      ])
      setHabitaciones(habData.items)
      setTiposHabitacion(catData.tiposHabitacion)
      setComodidades(catData.comodidades)
      setSedesCatalog(catData.sedes)

      if (catData.sedes.length > 0 && catData.tiposHabitacion.length > 0) {
        setForm((prev) => ({
          ...prev,
          sedeId: prev.sedeId || catData.sedes[0].id,
          tipoHabitacionId: prev.tipoHabitacionId || catData.tiposHabitacion[0].id,
        }))
      }
    } catch {
      setError('No se pudieron cargar los datos de habitaciones y catálogos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ── Tipo de Habitación seleccionado actualmente ───────────────────────────
  const selectedTipo = useMemo(() => {
    return tiposHabitacion.find((t) => t.id === form.tipoHabitacionId) ?? null
  }, [tiposHabitacion, form.tipoHabitacionId])

  // ── Filtros ────────────────────────────────────────────────────────────────
  const sedesList = useMemo(
    () => ['Todas', ...new Set(habitaciones.map((h) => h.sedeNombre))],
    [habitaciones]
  )

  const filtered = useMemo(
    () =>
      habitaciones.filter((h) => {
        const matchQuery = `${h.numero} ${h.sedeNombre} ${h.tipoHabitacionNombre || ''}`
          .toLowerCase()
          .includes(query.toLowerCase())
        const matchSede  = sede  === 'Todas' || h.sedeNombre === sede
        const matchEstado = estado === 'Todas' || h.estado === estado
        return matchQuery && matchSede && matchEstado
      }),
    [habitaciones, query, sede, estado]
  )

  // ── Formulario ─────────────────────────────────────────────────────────────
  const updateForm = <K extends keyof CreateHabitacionPayload>(
    key: K,
    value: CreateHabitacionPayload[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  // Manejo del campo PrecioBase con formato Soles (S/)
  const handlePrecioChange = (rawInput: string) => {
    const cleanNumber = rawInput.replace(/[^0-9.]/g, '')
    const val = parseFloat(cleanNumber) || 0
    updateForm('precioBase', val)
    setPrecioDisplay(rawInput.startsWith('S/ ') ? rawInput : `S/ ${cleanNumber}`)
  }

  const handlePrecioBlur = () => {
    setPrecioDisplay(`S/ ${form.precioBase.toFixed(2)}`)
  }

  const handlePrecioFocus = () => {
    setPrecioDisplay(form.precioBase > 0 ? form.precioBase.toString() : '')
  }

  // Toggle de comodidades (HabitacionComodidad)
  const toggleComodidad = (comodidadId: number) => {
    setForm((prev) => {
      const exists = prev.comodidadesIds.includes(comodidadId)
      return {
        ...prev,
        comodidadesIds: exists
          ? prev.comodidadesIds.filter((id) => id !== comodidadId)
          : [...prev.comodidadesIds, comodidadId],
      }
    })
  }

  const handleOpenModal = () => {
    const initialSede = sedesCatalog.length > 0 ? sedesCatalog[0].id : 0
    const initialTipo = tiposHabitacion.length > 0 ? tiposHabitacion[0].id : 0
    setForm({
      ...emptyForm,
      sedeId: initialSede,
      tipoHabitacionId: initialTipo,
    })
    setPrecioDisplay('S/ 0.00')
    setIsModalOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.sedeId || !form.tipoHabitacionId || !form.numero) {
      alert('Por favor complete los campos obligatorios.')
      return
    }

    setIsSubmitting(true)
    try {
      await createHabitacion(form)
      await loadData()
      setIsModalOpen(false)
    } catch {
      alert('Error al crear la habitación. Verifique los datos e intente nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Helper para badge de estado ──────────────────────────────────────────
  const getStatusClass = (est: string) => {
    switch (est?.toLowerCase()) {
      case 'disponible': return 'status-disponible'
      case 'ocupada': return 'status-ocupada'
      case 'mantenimiento': return 'status-mantenimiento'
      case 'bloqueada': return 'status-bloqueada'
      default: return 'status-disponible'
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="rooms-shell">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="rooms-sidebar">
        <div className="brand-lockup">
          <img
            src={logoCasaAndina}
            alt="Casa Andina"
            style={{
              height: 'clamp(4.5rem, 6vw, 6.5rem)',
              width: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              objectPosition: 'left'
            }}
          />
          <span>ADMIN CONSOLE</span>
        </div>
        <nav className="rooms-nav" aria-label="Navegación principal">
          {([
            ['Resumen',     '/admin/dashboard'],
            ['Reservas',    '/admin/calendario'],
            ['Habitaciones','/admin/habitaciones'],
            ['Servicios',   '/admin/servicios'],
            ['Usuarios',    '/admin/usuarios'],
          ] as [string, string][]).map(([item, path]) => (
            <button
              className={item === 'Habitaciones' ? 'nav-item active' : 'nav-item'}
              key={item}
              type="button"
              onClick={() => navigate(path)}
            >
              <span aria-hidden="true">{item === 'Habitaciones' ? '▦' : '·'}</span>
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="avatar">AM</span>
          <span><b>Admin User</b><small>Administrador</small></span>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="rooms-main">
        <header className="rooms-topbar">
          <div className="mobile-brand">Casa Andina</div>
          <div className="topbar-actions">
            <span>Ayuda</span>
            <button type="button" aria-label="Abrir configuración">⚙</button>
            <span className="avatar small">AM</span>
          </div>
        </header>

        <div className="rooms-content">
          {/* Encabezado */}
          <div className="page-heading">
            <div>
              <span className="eyebrow">OPERACIÓN / INVENTARIO</span>
              <h1>Habitaciones</h1>
              <p>Administra la disponibilidad, tarifas y comodidades de cada sede.</p>
            </div>
            <button className="primary-button" type="button" onClick={handleOpenModal}>
              + Nueva habitación
            </button>
          </div>

          {/* Estado de carga / error */}
          {isLoading && <div className="empty-state">Cargando habitaciones y catálogos…</div>}
          {error    && <div className="empty-state" style={{ color: 'var(--error, #e53e3e)' }}>{error}</div>}

          {/* Métricas */}
          {!isLoading && !error && (
            <section className="metric-strip" aria-label="Resumen de habitaciones">
              <div><span>Total habitaciones</span><strong>{habitaciones.length}</strong></div>
              <div><span>Precio promedio</span>
                <strong>
                  S/{' '}
                  {habitaciones.length
                    ? (habitaciones.reduce((s, h) => s + h.precioNoche, 0) / habitaciones.length).toFixed(2)
                    : '0.00'}
                </strong>
              </div>
              <div><span>Sedes activas</span><strong>{sedesList.length - 1}</strong></div>
            </section>
          )}

          {/* Tabla */}
          {!isLoading && !error && (
            <section className="room-list-panel">
              <div className="list-toolbar">
                <div>
                  <h2>Inventario de habitaciones</h2>
                  <span>{filtered.length} resultados</span>
                </div>
                <label className="search-box">
                  <span aria-hidden="true">⌕</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar habitación..."
                    aria-label="Buscar habitación"
                  />
                </label>
              </div>

              <div className="filter-row">
                <label>
                  Sede
                  <select value={sede} onChange={(e) => setSede(e.target.value)}>
                    {sedesList.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Estado
                  <select value={estado} onChange={(e) => setEstado(e.target.value as FiltroEstado)}>
                    <option>Todas</option>
                    <option>Disponible</option>
                    <option>Ocupada</option>
                    <option>Mantenimiento</option>
                    <option>Bloqueada</option>
                  </select>
                </label>
                <button
                  className="clear-button"
                  type="button"
                  onClick={() => { setQuery(''); setSede('Todas'); setEstado('Todas') }}
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Habitación</th>
                      <th>Sede</th>
                      <th>Piso</th>
                      <th>Tipo</th>
                      <th>Tarifa / noche</th>
                      <th>Estado</th>
                      <th aria-label="Acciones">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((h) => (
                      <tr key={h.id}>
                        <td>
                          <b className="room-number">{h.numero}</b>
                          <small>{h.comodidades.slice(0, 2).join(' · ') || 'Sin comodidades'}</small>
                        </td>
                        <td>{h.sedeNombre}</td>
                        <td>Piso {h.piso}</td>
                        <td><b>{h.tipoHabitacionNombre || 'Estándar'}</b></td>
                        <td className="price">S/ {h.precioNoche.toFixed(2)}</td>
                        <td>
                          <span className={`status ${getStatusClass(h.estado)}`}>
                            {h.estado || 'Disponible'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="more-button"
                            type="button"
                            title="Ver Detalle Completo"
                            onClick={() => setDetailHabitacion(h)}
                          >
                            •••
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="empty-state">No encontramos habitaciones con esos filtros.</div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ── Modal: Nueva Habitación ──────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <section className="room-modal" role="dialog" aria-modal="true" aria-labelledby="new-room-title">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">NUEVO REGISTRO</span>
                <h2 id="new-room-title">Crear habitación</h2>
              </div>
              <button className="close-button" type="button" onClick={() => setIsModalOpen(false)} aria-label="Cerrar">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Sede */}
                <label>
                  Sede *
                  <select
                    required
                    value={form.sedeId}
                    onChange={(e) => updateForm('sedeId', Number(e.target.value))}
                  >
                    {sedesCatalog.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({s.ciudad})
                      </option>
                    ))}
                  </select>
                </label>

                {/* Combobox: Tipo de Habitación */}
                <label>
                  Tipo de Habitación *
                  <select
                    required
                    value={form.tipoHabitacionId}
                    onChange={(e) => updateForm('tipoHabitacionId', Number(e.target.value))}
                  >
                    {tiposHabitacion.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Número */}
                <label>
                  Número de Habitación *
                  <input
                    required
                    value={form.numero}
                    onChange={(e) => updateForm('numero', e.target.value)}
                    placeholder="Ej. 101"
                  />
                </label>

                {/* Piso */}
                <label>
                  Piso *
                  <input
                    required
                    min="0"
                    type="number"
                    value={form.piso}
                    onChange={(e) => updateForm('piso', Number(e.target.value))}
                  />
                </label>

                {/* Precio Base (Formato Soles S/) */}
                <label>
                  Precio Base (Soles) *
                  <input
                    required
                    type="text"
                    value={precioDisplay}
                    onChange={(e) => handlePrecioChange(e.target.value)}
                    onFocus={handlePrecioFocus}
                    onBlur={handlePrecioBlur}
                    placeholder="S/ 0.00"
                  />
                </label>

                {/* Estado */}
                <label>
                  Estado *
                  <select
                    required
                    value={form.estado}
                    onChange={(e) => updateForm('estado', e.target.value)}
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Ocupada">Ocupada</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Bloqueada">Bloqueada</option>
                  </select>
                </label>

                {/* Foto URL */}
                <label style={{ gridColumn: 'span 2' }}>
                  URL Foto (opcional)
                  <input
                    value={form.fotoUrl ?? ''}
                    onChange={(e) => updateForm('fotoUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </label>
              </div>

              {/* Tarjeta de detalles del Tipo de Habitación estilo Casa Andina */}
              {selectedTipo && (
                <div className="tipo-info-box">
                  <div className="tipo-info-title">Detalles de {selectedTipo.nombre}</div>
                  <p className="tipo-info-desc">
                    {selectedTipo.descripcion || 'Sin descripción registrada para este tipo de habitación.'}
                  </p>
                  <div className="capacity-badges">
                    <div className="capacity-badge">
                      <span>👤 Adultos:</span> <strong>{selectedTipo.capacidadAdultos}</strong>
                    </div>
                    <div className="capacity-badge">
                      <span>👶 Niños:</span> <strong>{selectedTipo.capacidadNinos}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Sección de Comodidades desde BD */}
              <fieldset style={{ marginTop: '16px' }}>
                <legend>Comodidades disponibles (BD)</legend>
                <div className="amenities-grid">
                  {comodidades.map((c) => {
                    const isChecked = form.comodidadesIds.includes(c.id)
                    return (
                      <label className="amenity-option" key={c.id}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleComodidad(c.id)}
                        />
                        {c.nombre}
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button className="primary-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando…' : 'Guardar habitación'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ── Modal: Ver Detalle Completo de Habitación (Al hacer clic en •••) ── */}
      {detailHabitacion && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailHabitacion(null) }}
        >
          <section className="room-modal" role="dialog" aria-modal="true" aria-labelledby="detail-room-title">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">{detailHabitacion.sedeNombre.toUpperCase()}</span>
                <h2 id="detail-room-title">Habitación {detailHabitacion.numero}</h2>
              </div>
              <button className="close-button" type="button" onClick={() => setDetailHabitacion(null)} aria-label="Cerrar">
                ×
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <label>Sede Física</label>
                <span>{detailHabitacion.sedeNombre}</span>
              </div>
              <div className="detail-item">
                <label>Tipo de Habitación</label>
                <span>{detailHabitacion.tipoHabitacionNombre || 'Estándar'}</span>
              </div>
              <div className="detail-item">
                <label>Ubicación / Piso</label>
                <span>Piso {detailHabitacion.piso}</span>
              </div>
              <div className="detail-item">
                <label>Tarifa Base por Noche</label>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  S/ {detailHabitacion.precioNoche.toFixed(2)}
                </span>
              </div>
              <div className="detail-item">
                <label>Estado Actual</label>
                <div>
                  <span className={`status ${getStatusClass(detailHabitacion.estado)}`}>
                    {detailHabitacion.estado || 'Disponible'}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <label>Capacidad Permitida</label>
                <span>👤 Adultos: <b>{detailHabitacion.capacidadAdultos}</b> | 👶 Niños: <b>{detailHabitacion.capacidadNinos}</b></span>
              </div>

              <div className="detail-item full-width">
                <label>Comodidades Incluidas</label>
                <div className="amenities-grid" style={{ marginTop: '6px' }}>
                  {detailHabitacion.comodidades.length > 0 ? (
                    detailHabitacion.comodidades.map((c) => (
                      <span className="amenity-option" key={c}>
                        ✓ {c}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Sin comodidades asociadas.</span>
                  )}
                </div>
              </div>

              {detailHabitacion.fotoUrl && (
                <div className="detail-item full-width">
                  <label>Fotografía Referencial</label>
                  <img
                    src={detailHabitacion.fotoUrl}
                    alt={`Habitación ${detailHabitacion.numero}`}
                    className="room-photo-preview"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={() => setDetailHabitacion(null)}>
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}