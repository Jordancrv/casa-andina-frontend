/**
 * BarChart.tsx
 * Gráfico de barras SVG puro — Reservas confirmadas vs. canceladas por semana.
 * Sin dependencias externas (no necesita chart.js ni recharts).
 */

import { useState } from 'react'
import type { ReservaSemanaSerie } from '@/shared/types/global.types'

interface BarChartProps {
  series: ReservaSemanaSerie[]
  onSelectType?: (type: 'confirmadas' | 'canceladas') => void
  activeType?: 'confirmadas' | 'canceladas'
}

export function BarChart({ series, onSelectType, activeType }: BarChartProps) {
  const [tooltip, setTooltip] = useState<{ semana: string; tipo: 'confirmadas' | 'canceladas' } | null>(null)
  const getOpacidad = (type: 'confirmadas' | 'canceladas') => {
    if (!activeType) return 1
    return activeType === type ? 1 : 0.3
  }

  return (
    <div className="db-barchart" role="region" aria-label="Reservas por semana — últimas 6 semanas">
      <div className="db-barchart__bars">
        {series.map((s, index) => (
          <div key={s.semanaLabel} className={`db-barchart__group${index === 0 ? ' is-first' : index === series.length - 1 ? ' is-last' : ''}`}>
            {tooltip?.semana === s.semanaLabel && <div className="db-barchart__tooltip" role="tooltip"><strong>{s.semanaLabel === 'Actual' ? 'Semana actual' : `Semana ${s.semanaLabel}`}</strong><span>{tooltip.tipo === 'confirmadas' ? `Reservadas: ${s.confirmadas}` : `Canceladas: ${s.canceladas}`}</span></div>}
            <div className="db-barchart__bars-inner">
              <button type="button"
                className="db-barchart__bar db-barchart__bar--conf"
                style={{ 
                  height: `${s.alturaPctConfirmadas}%`, 
                  cursor: onSelectType ? 'pointer' : 'default',
                  opacity: getOpacidad('confirmadas'),
                  transition: 'opacity 0.3s ease'
                }}
                aria-label={`${s.semanaLabel}: ${s.confirmadas} reservas reservadas`}
                onMouseEnter={() => setTooltip({ semana: s.semanaLabel, tipo: 'confirmadas' })}
                onMouseLeave={() => setTooltip(null)}
                onFocus={() => setTooltip({ semana: s.semanaLabel, tipo: 'confirmadas' })}
                onBlur={() => setTooltip(null)}
                onClick={() => onSelectType?.('confirmadas')}
              />
              <button type="button"
                className="db-barchart__bar db-barchart__bar--canc"
                style={{ 
                  height: `${s.alturaPctCanceladas}%`, 
                  cursor: onSelectType ? 'pointer' : 'default',
                  opacity: getOpacidad('canceladas'),
                  transition: 'opacity 0.3s ease'
                }}
                aria-label={`${s.semanaLabel}: ${s.canceladas} reservas canceladas`}
                onMouseEnter={() => setTooltip({ semana: s.semanaLabel, tipo: 'canceladas' })}
                onMouseLeave={() => setTooltip(null)}
                onFocus={() => setTooltip({ semana: s.semanaLabel, tipo: 'canceladas' })}
                onBlur={() => setTooltip(null)}
                onClick={() => onSelectType?.('canceladas')}
              />
            </div>
            <span className="db-barchart__label">{s.semanaLabel}</span>
          </div>
        ))}
      </div>
      {/* Leyenda */}
      <div className="db-barchart__legend">
        <button type="button" className="db-barchart__legend-button"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', cursor: onSelectType ? 'pointer' : 'default',
            opacity: getOpacidad('confirmadas'), transition: 'opacity 0.3s ease'
          }}
          onClick={() => onSelectType?.('confirmadas')}
        >
          <span className="db-barchart__legend-dot db-barchart__legend-dot--conf" />
          <span className="db-barchart__legend-text">Reservadas</span>
        </button>
        <button type="button" className="db-barchart__legend-button"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', cursor: onSelectType ? 'pointer' : 'default',
            opacity: getOpacidad('canceladas'), transition: 'opacity 0.3s ease'
          }}
          onClick={() => onSelectType?.('canceladas')}
        >
          <span className="db-barchart__legend-dot db-barchart__legend-dot--canc" />
          <span className="db-barchart__legend-text">Canceladas</span>
        </button>
      </div>
    </div>
  )
}
