/**
 * CanalesCard.tsx
 * Panel de desglose de canal de reservas + métricas derivadas.
 */

import type { CanalReservasDto } from '@/shared/types/global.types'

interface CanalesCardProps {
  canales: CanalReservasDto
}

function pct(parcial: number, total: number): string {
  if (total === 0) return '0.0'
  return ((parcial / total) * 100).toFixed(1)
}

export function CanalesCard({ canales }: CanalesCardProps) {
  const { reservasDirectas, reservasOTA, totalReservas, ticketPromedioSoles, estadiaPromedioNoches } = canales
  const pctDirecto = pct(reservasDirectas, totalReservas)
  const pctOTA     = pct(reservasOTA, totalReservas)

  return (
    <div className="db-canales" role="region" aria-label="Canal de reservas">
      {/* Barra de reparto visual */}
      <div className="db-canales__barra" aria-hidden="true">
        <div
          className="db-canales__seg db-canales__seg--directo"
          style={{ width: `${pctDirecto}%` }}
          title={`Directo: ${pctDirecto}%`}
        />
        <div
          className="db-canales__seg db-canales__seg--ota"
          style={{ width: `${pctOTA}%` }}
          title={`OTA: ${pctOTA}%`}
        />
      </div>
      {/* Filas de detalle */}
      <div className="db-list">
        <div className="db-list__row">
          <span className="db-list__label">
            <span className="db-canales__dot db-canales__dot--directo" />
            Directo
          </span>
          <span className="db-list__mono">
            {reservasDirectas.toLocaleString('es-PE')} · {pctDirecto}%
          </span>
        </div>
        <div className="db-list__row">
          <span className="db-list__label">
            <span className="db-canales__dot db-canales__dot--ota" />
            OTA
          </span>
          <span className="db-list__mono">
            {reservasOTA.toLocaleString('es-PE')} · {pctOTA}%
          </span>
        </div>
        <div className="db-list__row">
          <span className="db-list__label">Ticket Promedio</span>
          <span className="db-list__mono">S/ {ticketPromedioSoles.toFixed(2)}</span>
        </div>
        <div className="db-list__row">
          <span className="db-list__label">Estadía Promedio</span>
          <span className="db-list__mono">{estadiaPromedioNoches.toFixed(1)} Noches</span>
        </div>
      </div>
    </div>
  )
}
