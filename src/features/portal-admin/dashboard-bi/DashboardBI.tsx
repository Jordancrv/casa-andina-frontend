import { useState } from 'react'
import './DashboardBI.css'
import type { DashboardFiltros } from '@/shared/types/global.types'
import { KPICard } from './components/KPICard'
import { BarChart } from './components/BarChart'
import { OcupacionList } from './components/OcupacionList'
import { CanalesCard } from './components/CanalesCard'
import { useDashboard, formatSoles, formatVariacion } from './useDashboard'
import { DashboardReport } from './DashboardReport'

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

function CardWrapper({ titulo, nota, children, className = '' }: { titulo: string; nota?: string; children: React.ReactNode; className?: string }) {
  return <article className={`db-card ${className}`}><header className="db-card__head"><span className="db-card__title">{titulo}</span>{nota && <span className="db-card__note">{nota}</span>}</header><div className="db-card__body">{children}</div></article>
}

function SkeletonCard() {
  return <div className="db-card db-skeleton db-skeleton--tall" aria-busy="true" aria-label="Cargando datos" />
}

function DashboardErrorPanel() {
  return <div className="db-unavailable" role="status"><strong>Datos temporalmente no disponibles</strong><p>La consulta al servidor falló. Reintenta para volver a cargar esta sección.</p></div>
}

function variation(actual: number, previous: number): string {
  if (previous === 0) return `${actual.toLocaleString('es-PE')} en el periodo`
  const percentage = ((actual - previous) / previous) * 100
  return `${formatVariacion(percentage)} Vs. periodo anterior`
}

export const DashboardBI = () => {
  const [periodo, setPeriodo] = useState<DashboardFiltros['periodo']>('30d')
  const [vistaReservas, setVistaReservas] = useState<'confirmadas' | 'canceladas'>('confirmadas')
  const { data, loading, error, refetch } = useDashboard(periodo)
  return (
    <main className="db-page">
      <header className="db-heading">
        <div><p className="db-eyebrow">CASA ANDINA · ADMINISTRACIÓN</p><h1>Dashboard</h1><p>{data ? data.sedeNombre : 'Resumen operativo de la sede asignada'}</p></div>
        <div className="db-page__actions">
          <label className="db-filter-label" htmlFor="db-periodo">Periodo</label>
          <select id="db-periodo" className="db-filtros__select" value={periodo} onChange={event => setPeriodo(event.target.value as DashboardFiltros['periodo'])}>
            <option value="7d">Últimos 7 días</option><option value="30d">Últimos 30 días</option><option value="mes">Este mes</option>
          </select>
          <button className="db-btn-refresh" onClick={() => void refetch()} disabled={loading} aria-label="Actualizar datos" title="Actualizar datos">↻</button>
          <DashboardReport periodo={periodo} disabled={loading || !data || !!error} />
        </div>
      </header>
      {error && <div className="db-error" role="alert"><span>{error}</span><button className="db-error__btn" onClick={() => void refetch()}>Reintentar</button></div>}

      <section className="db-kpis" aria-label="Indicadores principales" aria-busy={loading}>
        {loading ? <>{[1, 2, 3, 4].map(item => <div className="db-card db-kpi db-skeleton" key={item} />)}</> : data ? <>
          <KPICard label="Reservas" value={data.kpis.totalReservas.toLocaleString('es-PE')} variacion={variation(data.kpis.totalReservas, data.kpis.totalReservasPeriodoAnterior)} positivo={data.kpis.totalReservas >= data.kpis.totalReservasPeriodoAnterior} icono={<Icon><><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></></Icon>} />
          <KPICard label="Importe reservado" value={formatSoles(data.kpis.importeReservadoSoles)} variacion={`${variation(data.kpis.importeReservadoSoles, data.kpis.importeReservadoPeriodoAnterior)} · no equivale a pagos aprobados`} positivo={data.kpis.importeReservadoSoles >= data.kpis.importeReservadoPeriodoAnterior} icono={<Icon><><circle cx="12" cy="12" r="9"/><path d="M16 8.5c-.7-.8-1.8-1.2-3-1.2-1.7 0-3 .9-3 2.2s1.3 2 3 2.4 3 1.1 3 2.4-1.3 2.2-3 2.2c-1.2 0-2.3-.4-3-1.2M13 5.5v13"/></></Icon>} />
          <KPICard label="Ocupación actual" value={`${data.kpis.ocupacionActualPct.toFixed(1)}%`} variacion="Habitaciones ocupadas hoy" icono={<Icon><><path d="M3 11h18v8H3z"/><path d="M5 11V7h6v4m2 0V7h6v4M3 19v2m18-2v2"/></></Icon>} />
          <KPICard label="Clientes con reservas" value={data.kpis.totalClientesActivos.toLocaleString('es-PE')} variacion={variation(data.kpis.totalClientesActivos, data.kpis.clientesPeriodoAnterior)} positivo={data.kpis.totalClientesActivos >= data.kpis.clientesPeriodoAnterior} icono={<Icon><><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></></Icon>} />
        </> : error ? <DashboardErrorPanel/> : <p className="db-empty" role="status">No hay datos disponibles para mostrar.</p>}
      </section>

      <section className="db-grid-2" aria-label="Reservas y ocupación por sede">
        {loading ? <><SkeletonCard/><SkeletonCard/></> : data ? <>
          <CardWrapper titulo="Reservas por semana" nota="Últimas 6 semanas · por fecha de creación" className="db-grid-2__main">
            <BarChart series={data.reservasSemana} onSelectType={setVistaReservas} activeType={vistaReservas} />
          </CardWrapper>
          <CardWrapper titulo={vistaReservas === 'confirmadas' ? 'Ocupación de la sede' : 'Reservas canceladas'} nota={vistaReservas === 'confirmadas' ? 'Hoy' : 'Creadas en el periodo; estado actual'}>
            {vistaReservas === 'confirmadas' ? <OcupacionList sedes={data.ocupacionSedes} /> : <div className="db-unavailable"><strong>{data.canceladasPeriodo.toLocaleString('es-PE')} reservas canceladas</strong><p>El sistema no registra motivos de cancelación, por eso no se inventa un desglose.</p></div>}
          </CardWrapper>
        </> : error ? <><CardWrapper titulo="Reservas por semana"><DashboardErrorPanel/></CardWrapper><CardWrapper titulo="Ocupación de la sede"><DashboardErrorPanel/></CardWrapper></> : null}
      </section>

      <section aria-label="Proyección de demanda">
        {loading ? <SkeletonCard/> : data ? <CardWrapper titulo="Proyección de demanda" nota="Próximas 4 semanas">
          <div className="db-unavailable"><strong>Proyección aún no disponible</strong><p>Se habilitará cuando exista un modelo predictivo conectado a datos históricos.</p></div>
        </CardWrapper> : error ? <CardWrapper titulo="Proyección de demanda"><DashboardErrorPanel/></CardWrapper> : null}
      </section>

      <section className="db-grid-2" aria-label="Canales y asistente">
        {loading ? <><SkeletonCard/><SkeletonCard/></> : data ? <>
          <CardWrapper titulo="Canal de reservas" nota="Periodo seleccionado"><CanalesCard canales={data.canales} /></CardWrapper>
          <CardWrapper titulo="Asistente IA" nota="Métricas de uso">
            <div className="db-unavailable"><strong>Sin métricas de uso registradas</strong><p>Las interacciones del asistente aún no se almacenan para generar estadísticas.</p></div>
          </CardWrapper>
        </> : error ? <><CardWrapper titulo="Canal de reservas"><DashboardErrorPanel/></CardWrapper><CardWrapper titulo="Asistente IA"><DashboardErrorPanel/></CardWrapper></> : null}
      </section>
    </main>
  )
}
