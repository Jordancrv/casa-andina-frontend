import './DashboardBI.css'
import { KPICard } from './components/KPICard'
import { DashboardCharts } from './components/DashboardCharts'
import { useDashboard, formatSoles } from './useDashboard'

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

export const DashboardBI = () => {
  const { data, loading, error, refetch } = useDashboard()

  return (
    <main className="db-page">
      <header className="db-heading">
        <div><p className="db-eyebrow">CASA ANDINA · ADMINISTRACIÓN</p><h1>Dashboard</h1><p>Resumen operativo consultado desde la base de datos.</p></div>
        <button className="db-btn-refresh" onClick={() => void refetch()} disabled={loading} aria-label="Actualizar resumen" title="Actualizar resumen">↻</button>
      </header>
      {error && <div className="db-error" role="alert"><span>{error}</span><button className="db-error__btn" onClick={() => void refetch()}>Reintentar</button></div>}
      {loading ? <div className="db-kpis" aria-label="Cargando indicadores" aria-busy="true">{[1,2,3,4].map(item => <div className="db-card db-kpi db-skeleton" key={item} />)}</div> : data ? (
        <section className="db-kpis" aria-label="Indicadores operativos">
          <KPICard label="Habitaciones ocupadas hoy" value={data.habitacionesOcupadas.toLocaleString('es-PE')} icono={<Icon><><path d="M3 11h18v8H3z"/><path d="M5 11V7h6v4m2 0V7h6v4M3 19v2m18-2v2"/></></Icon>} />
          <KPICard label="Habitaciones disponibles" value={data.habitacionesDisponibles.toLocaleString('es-PE')} icono={<Icon><><path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16M3 10h18M8 7h.01M12 7h.01M16 7h.01M8 14h.01M12 14h.01M16 14h.01"/></></Icon>} />
          <KPICard label="Reservas activas" value={data.reservasActivas.toLocaleString('es-PE')} icono={<Icon><><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></></Icon>} />
          <KPICard label="Importe reservado este mes" value={formatSoles(data.importeReservadoMesActual)} variacion="Reservas no canceladas · no equivale a pagos aprobados" icono={<Icon><><circle cx="12" cy="12" r="9"/><path d="M16 8.5c-.7-.8-1.8-1.2-3-1.2-1.7 0-3 .9-3 2.2s1.3 2 3 2.4 3 1.1 3 2.4-1.3 2.2-3 2.2c-1.2 0-2.3-.4-3-1.2M13 5.5v13"/></></Icon>} />
        </section>
      ) : !error ? <p className="db-empty" role="status">No hay datos disponibles para mostrar.</p> : null}
      {!loading && data && <DashboardCharts data={data} />}
      <section className="db-note" aria-label="Alcance de este resumen">
        <h2>Alcance actual</h2>
        <p>Las gráficas muestran ocupación y reservas actuales de la sede autorizada. No se presentan tendencias históricas ni proyecciones porque todavía no existen consultas verificables para esos datos.</p>
      </section>
    </main>
  )
}
