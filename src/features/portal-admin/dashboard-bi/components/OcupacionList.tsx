import type { DashboardBi } from '../useDashboard'

export function OcupacionList({ habitaciones }: { habitaciones: DashboardBi['ocupacionHabitaciones'] }) {
  if (!habitaciones) return <p className="db-empty">Actualiza el backend para consultar la ocupación por habitación.</p>
  if (!habitaciones.length) return <p className="db-empty">No hay habitaciones activas en esta sede.</p>
  return <div className="db-ocupacion-rooms">
    <p className="db-ocupacion-caption">Noches reservadas en el periodo sobre el total de noches del periodo.</p>
    <div className="db-ocupacion db-ocupacion--scroll" role="list" aria-label="Ocupación por habitación en el periodo">
      {habitaciones.map(h => <div key={h.habitacionId} className="db-ocupacion__room" role="listitem">
        <div className="db-ocupacion__room-head"><span><strong>Habitación {h.numero}</strong><small>{h.tipo}</small></span><span><strong>{h.ocupacionPct.toFixed(1)}%</strong><small>{h.nochesReservadas} de {h.nochesPeriodo} noches</small></span></div>
        <div className="db-ocupacion__track" role="progressbar" aria-label={`Habitación ${h.numero}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={h.ocupacionPct}><div className="db-ocupacion__fill db-ocupacion__fill--high" style={{ width: `${h.ocupacionPct}%` }} /></div>
      </div>)}
    </div>
  </div>
}
