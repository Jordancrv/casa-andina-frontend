import './modulos-pendientes.css'

type Modulo = 'reportes'

const CONFIG: Record<Modulo, { title: string; eyebrow: string; description: string }> = {
  reportes: { title: 'Reportes', eyebrow: 'ANÁLISIS', description: 'Diseño de reportes asistidos por IA.' },
}

export function ModulosPendientes({ modulo }: { modulo: Modulo }) {
  const config = CONFIG[modulo]
  return (
    <main className="admin-module">
      <header className="admin-module__heading">
        <div><p>{config.eyebrow}</p><h1>{config.title}</h1><span>{config.description}</span></div>
        <span className="admin-module__badge">{modulo === 'reportes' ? 'PROTOTIPO DE DISEÑO' : 'INTERFAZ EN PREPARACIÓN'}</span>
      </header>
      <section className="report-preview" aria-label="Prototipo de reporte">
          <div className="report-preview__toolbar"><span>Vista previa del reporte</span><span>Sin datos generados</span></div>
          <div className="report-preview__body"><div className="report-preview__mark" aria-hidden="true">CA</div><p>CASA ANDINA · REPORTE OPERATIVO</p><h2>Elige un periodo para analizar</h2><span>Este prototipo no consulta datos ni genera conclusiones reales.</span><div className="report-preview__skeletons"><i /><i /><i /></div></div>
      </section>
    </main>
  )
}
