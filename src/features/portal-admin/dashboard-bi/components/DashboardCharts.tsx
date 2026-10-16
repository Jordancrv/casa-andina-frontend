import type { DashboardResumen } from '../useDashboard'

interface DashboardChartsProps {
  data: DashboardResumen
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const habitaciones = data.habitacionesOcupadas + data.habitacionesDisponibles
  const ocupacion = habitaciones > 0 ? (data.habitacionesOcupadas / habitaciones) * 100 : 0
  const tieneDetalleReservas = Number.isFinite(data.reservasPendientes) && Number.isFinite(data.reservasConfirmadas)
  const reservasPendientes = tieneDetalleReservas ? data.reservasPendientes : 0
  const reservasConfirmadas = tieneDetalleReservas ? data.reservasConfirmadas : 0
  const maxReservas = Math.max(reservasPendientes, reservasConfirmadas, 1)

  return (
    <section className="db-charts" aria-label="Gráficas del resumen operativo">
      <article className="db-card db-chart-card">
        <header className="db-chart-card__head">
          <div>
            <h2>Ocupación de habitaciones</h2>
            <p>Habitaciones ocupadas y disponibles hoy</p>
          </div>
          <span className="db-chart-card__scope">Sede autorizada</span>
        </header>
        <div className="db-donut-layout">
          <div
            className="db-donut"
            role="img"
            aria-label={`${data.habitacionesOcupadas} ocupadas de ${habitaciones} habitaciones ocupadas o disponibles`}
            style={{ background: `conic-gradient(var(--db-primary) ${ocupacion}%, #DDE9E5 ${ocupacion}% 100%)` }}
          >
            <div className="db-donut__center">
              <strong>{ocupacion.toFixed(0)}%</strong>
              <span>ocupación</span>
            </div>
          </div>
          <div className="db-chart-legend">
            <div><span className="db-chart-legend__swatch db-chart-legend__swatch--occupied" /><span>Ocupadas</span><strong>{data.habitacionesOcupadas}</strong></div>
            <div><span className="db-chart-legend__swatch db-chart-legend__swatch--available" /><span>Disponibles</span><strong>{data.habitacionesDisponibles}</strong></div>
            <p>No incluye habitaciones en mantenimiento u otros estados.</p>
          </div>
        </div>
      </article>

      <article className="db-card db-chart-card">
        <header className="db-chart-card__head">
          <div>
            <h2>Reservas activas</h2>
            <p>Distribución por estado actual</p>
          </div>
          <span className="db-chart-card__scope">Total: {data.reservasActivas.toLocaleString('es-PE')}</span>
        </header>
        {tieneDetalleReservas ? (
          <div className="db-status-chart" role="img" aria-label={`${reservasConfirmadas} reservas confirmadas y ${reservasPendientes} pendientes`}>
            <div className="db-status-chart__row">
              <div className="db-status-chart__label"><span>Confirmadas</span><strong>{reservasConfirmadas.toLocaleString('es-PE')}</strong></div>
              <div className="db-status-chart__track"><span className="db-status-chart__bar db-status-chart__bar--confirmed" style={{ width: `${(reservasConfirmadas / maxReservas) * 100}%` }} /></div>
            </div>
            <div className="db-status-chart__row">
              <div className="db-status-chart__label"><span>Pendientes</span><strong>{reservasPendientes.toLocaleString('es-PE')}</strong></div>
              <div className="db-status-chart__track"><span className="db-status-chart__bar db-status-chart__bar--pending" style={{ width: `${(reservasPendientes / maxReservas) * 100}%` }} /></div>
            </div>
            <p className="db-chart-footnote">Conteos consultados desde la base de datos, limitados a la sede de la cuenta.</p>
          </div>
        ) : <p className="db-chart-footnote" role="status">Reinicia el backend para cargar el detalle de reservas por estado.</p>}
      </article>
    </section>
  )
}
