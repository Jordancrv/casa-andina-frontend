/**
 * CancelacionList.tsx
 * Lista de barras horizontales de motivos de cancelación.
 */

import type { CancelacionMotivoDto } from '@/shared/types/global.types'

interface CancelacionListProps {
  motivos: CancelacionMotivoDto[]
}

export function CancelacionList({ motivos }: CancelacionListProps) {
  return (
    <div
      className="db-ocupacion"
      role="list"
      aria-label="Motivos de cancelación"
    >
      {motivos.map((m) => (
        <div
          key={m.motivo}
          className="db-ocupacion__row"
          role="listitem"
          aria-label={`${m.motivo}: ${m.cantidad} (${m.porcentaje}%)`}
        >
          <span className="db-ocupacion__nombre" title={m.motivo}>
            {m.motivo}
          </span>
          <div className="db-ocupacion__track" aria-hidden="true">
            <div
              className="db-ocupacion__fill db-ocupacion__fill--low"
              style={{ width: `${m.porcentaje}%` }}
              title={`Cantidad: ${m.cantidad}`}
            />
          </div>
          <span className="db-ocupacion__pct" style={{ minWidth: '65px', textAlign: 'right' }}>
            {m.cantidad} <small style={{ color: '#888', fontSize: '0.85em' }}>({m.porcentaje}%)</small>
          </span>
        </div>
      ))}
    </div>
  )
}
