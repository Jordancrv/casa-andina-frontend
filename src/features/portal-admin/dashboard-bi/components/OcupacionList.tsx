/**
 * OcupacionList.tsx
 * Lista de barras horizontales de ocupación por sede.
 * El color de la barra varía según el porcentaje (verde alto, ámbar medio, rojo bajo).
 */

import type { OcupacionSedeDto } from '@/shared/types/global.types'

interface OcupacionListProps {
  sedes: OcupacionSedeDto[]
}

function getBarColor(pct: number): string {
  if (pct >= 80) return 'db-ocupacion__fill--high'
  if (pct >= 60) return 'db-ocupacion__fill--mid'
  return 'db-ocupacion__fill--low'
}

export function OcupacionList({ sedes }: OcupacionListProps) {
  return (
    <div
      className="db-ocupacion"
      role="list"
      aria-label="Ocupación actual por sede"
    >
      {sedes.map((s) => (
        <div
          key={s.sedeNombre}
          className="db-ocupacion__row"
          role="listitem"
          aria-label={`${s.sedeNombre}: ${s.ocupacionPct}%`}
        >
          <span className="db-ocupacion__nombre" title={s.sedeNombre}>
            {s.sedeNombre.replace('Casa Andina ', '').replace(' Plaza', '')}
          </span>
          <div className="db-ocupacion__track" aria-hidden="true">
            <div
              className={`db-ocupacion__fill ${getBarColor(s.ocupacionPct)}`}
              style={{ width: `${s.ocupacionPct}%` }}
              title={`Cantidad: ${s.cantidad}`}
            />
          </div>
          <span className="db-ocupacion__pct">{s.cantidad}</span>
        </div>
      ))}
    </div>
  )
}
