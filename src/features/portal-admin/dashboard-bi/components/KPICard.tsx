/**
 * KPICard.tsx
 * Tarjeta de indicador principal con valor, label y variación comparativa.
 * El icono acepta cualquier ReactNode (SVG inline recomendado).
 */

interface KPICardProps {
  label: string
  value: string
  variacion?: string
  positivo?: boolean
  icono?: React.ReactNode
}

export function KPICard({ label, value, variacion, positivo = true, icono }: KPICardProps) {
  return (
    <div className="db-card db-kpi" role="region" aria-label={`KPI: ${label}`}>
      <div className="db-kpi__label">
        {icono && <span className="db-kpi__icon">{icono}</span>}
        {label}
      </div>
      <div className="db-kpi__value">{value}</div>
      {variacion && (
        <div className={`db-kpi__trend ${positivo ? 'db-kpi__trend--up' : 'db-kpi__trend--down'}`}>
          {variacion}
        </div>
      )}
    </div>
  )
}
