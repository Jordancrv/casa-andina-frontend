/**
 * ProyeccionGrid.tsx
 * Grid de 4 tarjetas con la proyección de demanda semanal.
 * Incluye barra de confianza de la estimación.
 */

import type { ProyeccionSemanaDto } from '@/shared/types/global.types'

interface ProyeccionGridProps {
  semanas: ProyeccionSemanaDto[]
}

export function ProyeccionGrid({ semanas }: ProyeccionGridProps) {
  return (
    <div
      className="db-proyeccion"
      role="list"
      aria-label="Proyección de demanda — próximas 4 semanas"
    >
      {semanas.map((s) => (
        <div key={s.semanaLabel} className="db-proyeccion__week" role="listitem">
          <div className="db-proyeccion__name">{s.semanaLabel}</div>
          <div className="db-proyeccion__number">{s.reservasProyectadas}</div>
          <div className="db-proyeccion__sub">Reservas Proyectadas</div>
          {/* Barra de confianza */}
          <div
            className="db-proyeccion__track"
            title={`Confianza de estimación: ${s.confianzaPct}%`}
            aria-hidden="true"
          >
            <span
              className="db-proyeccion__fill"
              style={{ width: `${s.confianzaPct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
