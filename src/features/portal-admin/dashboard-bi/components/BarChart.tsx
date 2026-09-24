/**
 * BarChart.tsx
 * Gráfico de barras SVG puro — Reservas confirmadas vs. canceladas por semana.
 * Sin dependencias externas (no necesita chart.js ni recharts).
 */

import type { ReservaSemanaSerie } from '@/shared/types/global.types'

interface BarChartProps {
  series: ReservaSemanaSerie[]
  onSelectType?: (type: 'confirmadas' | 'canceladas') => void
  activeType?: 'confirmadas' | 'canceladas'
}

export function BarChart({ series, onSelectType, activeType }: BarChartProps) {
  const getOpacidad = (type: 'confirmadas' | 'canceladas') => {
    if (!activeType) return 1
    return activeType === type ? 1 : 0.3
  }

  return (
    <div className="db-barchart" role="img" aria-label="Reservas por semana — últimas 6 semanas">
      <div className="db-barchart__bars">
        {series.map((s) => (
          <div key={s.semanaLabel} className="db-barchart__group">
            <div className="db-barchart__bars-inner">
              <div
                className="db-barchart__bar db-barchart__bar--conf"
                style={{ 
                  height: `${s.alturaPctConfirmadas}%`, 
                  cursor: onSelectType ? 'pointer' : 'default',
                  opacity: getOpacidad('confirmadas'),
                  transition: 'opacity 0.3s ease'
                }}
                title={`Confirmadas: ${s.confirmadas}`}
                onClick={() => onSelectType?.('confirmadas')}
              />
              <div
                className="db-barchart__bar db-barchart__bar--canc"
                style={{ 
                  height: `${s.alturaPctCanceladas}%`, 
                  cursor: onSelectType ? 'pointer' : 'default',
                  opacity: getOpacidad('canceladas'),
                  transition: 'opacity 0.3s ease'
                }}
                title={`Canceladas: ${s.canceladas}`}
                onClick={() => onSelectType?.('canceladas')}
              />
            </div>
            <span className="db-barchart__label">{s.semanaLabel}</span>
          </div>
        ))}
      </div>
      {/* Leyenda */}
      <div className="db-barchart__legend">
        <div 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', cursor: onSelectType ? 'pointer' : 'default',
            opacity: getOpacidad('confirmadas'), transition: 'opacity 0.3s ease'
          }}
          onClick={() => onSelectType?.('confirmadas')}
        >
          <span className="db-barchart__legend-dot db-barchart__legend-dot--conf" />
          <span className="db-barchart__legend-text">Confirmadas</span>
        </div>
        <div 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', cursor: onSelectType ? 'pointer' : 'default',
            opacity: getOpacidad('canceladas'), transition: 'opacity 0.3s ease'
          }}
          onClick={() => onSelectType?.('canceladas')}
        >
          <span className="db-barchart__legend-dot db-barchart__legend-dot--canc" />
          <span className="db-barchart__legend-text">Canceladas</span>
        </div>
      </div>
    </div>
  )
}
