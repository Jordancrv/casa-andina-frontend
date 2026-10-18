import './modulos-pendientes.css'

export function ModulosPendientes({ modulo }: { modulo: 'reportes' }) {
  if (modulo !== 'reportes') return null

  return (
    <main className="admin-module report-page">
      <header className="admin-module__heading">
        <div>
          <p>ANÁLISIS OPERATIVO</p>
          <h1>Reportes</h1>
          <span>Vista de reporte asistido para Casa Andina.</span>
        </div>
        <span className="admin-module__badge">PROTOTIPO DE DISEÑO</span>
      </header>

      <div className="report-controls" aria-label="Controles de vista previa">
        <label>
          Periodo
          <select disabled value="">
            <option value="">Disponible al conectar los datos</option>
          </select>
        </label>
        <button type="button" disabled>Generar reporte</button>
      </div>

      <section className="report-preview" aria-label="Vista previa vacía del reporte">
        <header className="report-preview__toolbar">
          <div><strong>Casa Andina</strong><span> · Reporte operativo</span></div>
          <span className="report-preview__status">Sin generar</span>
        </header>

        <div className="report-preview__body">
          <div className="report-preview__intro">
            <p>RESUMEN EJECUTIVO</p>
            <h2>El análisis aparecerá aquí</h2>
            <span>La generación con IA y las fuentes de datos aún no están conectadas.</span>
          </div>

          <div className="report-preview__metrics" aria-label="Indicadores pendientes">
            <section><span>Ocupación</span><strong>—</strong><small>Sin datos</small></section>
            <section><span>Reservas</span><strong>—</strong><small>Sin datos</small></section>
            <section><span>Importe reservado</span><strong>—</strong><small>Sin datos</small></section>
          </div>

          <section className="report-preview__chart">
            <div><h3>Tendencia del periodo</h3><span>Visualización pendiente de conexión</span></div>
            <div className="report-preview__chart-empty" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
          </section>

          <section className="report-preview__observations">
            <h3>Observaciones</h3>
            <p>Las conclusiones se mostrarán cuando exista generación habilitada y datos disponibles.</p>
          </section>
          <p className="report-preview__disclaimer">Prototipo: no contiene cifras, tendencias ni recomendaciones reales.</p>
        </div>
      </section>
    </main>
  )
}
