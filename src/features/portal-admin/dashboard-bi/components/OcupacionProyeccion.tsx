import { useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'

interface Week { inicio: string; fin: string; capacidadNoches: number; reservadasNoches: number; estimadasNoches: number | null; reservadasPct: number; estimadasPct: number | null }
interface Projection { disponible: boolean; motivo: string | null; semanasHistoria: number; habitacionesActivas: number; semanas: Week[] }
const date = (value: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))

export function OcupacionProyeccion() {
 const [selected, setSelected] = useState<number | null>(null)
 const gradientId = useId()
 const query = useQuery({ queryKey: ['dashboard', 'proyeccion-ocupacion'], queryFn: async () => await api.get('/dashboard/proyeccion-ocupacion') as Projection })
 if (query.isLoading) return <p className="occupancy-note">Calculando ocupación…</p>
 if (query.isError || !query.data) return <p className="occupancy-note" role="alert">No se pudo calcular la ocupación. <button onClick={() => void query.refetch()}>Reintentar</button></p>
 const data = query.data, points = data.semanas, x = (i: number) => 68 + i * 170, y = (pct: number) => 190 - pct * 1.45
 const path = (value: (w: Week) => number) => points.map((w, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(value(w))}`).join(' ')
 const active = selected === null ? null : points[selected]
 const tooltipX = selected === null ? 0 : Math.max(8, Math.min(472, x(selected) - 85))
 const tooltipY = active ? Math.max(4, Math.min(139, Math.min(y(active.reservadasPct), active.estimadasPct === null ? 190 : y(active.estimadasPct)) - 66)) : 0
 return <div className="occupancy-forecast">
  <p className="occupancy-note">Habitaciones-noche por semana · {data.habitacionesActivas} habitaciones activas · próximas cuatro semanas completas</p>
  {!data.disponible && <p className="occupancy-insufficient" role="status"><strong>Estimación no disponible.</strong> {data.motivo} Se muestran las habitaciones-noche ya reservadas.</p>}
  <div className="occupancy-legend"><span><i className="occupancy-dot booked"/>Ya reservadas</span>{data.disponible && <span><i className="occupancy-dot projected"/>Ocupación estimada</span>}</div>
  <div className="occupancy-chart"><svg viewBox="0 0 650 235" role="img" aria-label="Ocupación semanal reservada y estimada. Selecciona una semana para consultar sus cantidades.">
   <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8a977" stopOpacity=".22"/><stop offset="100%" stopColor="#c8a977" stopOpacity=".02"/></linearGradient></defs>
   {[0,25,50,75,100].map(p => <g key={p}><line x1="55" x2="600" y1={y(p)} y2={y(p)} className="occupancy-grid"/><text x="45" y={y(p)+4} textAnchor="end" className="occupancy-axis">{p}%</text></g>)}
   {points.length > 0 && <path d={`${path(w => w.reservadasPct)} L ${x(points.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`} fill={`url(#${gradientId})`} />}
   <path d={path(w => w.reservadasPct)} className="occupancy-line booked"/>
   {data.disponible && <path d={path(w => w.estimadasPct ?? 0)} className="occupancy-line projected"/>}
   {selected !== null && <line x1={x(selected)} x2={x(selected)} y1="38" y2="190" className="occupancy-guide"/>}
   {points.map((w,i) => <g key={w.inicio} onMouseEnter={() => setSelected(i)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(i)} onBlur={() => setSelected(null)} onClick={() => setSelected(i)} tabIndex={0} role="button" aria-label={`${date(w.inicio)} al ${date(w.fin)}: ${w.reservadasNoches} habitaciones-noche reservadas${w.estimadasNoches === null ? '' : `; ${w.estimadasNoches} estimadas`}`}>
    <rect x={i === 0 ? 0 : x(i)-85} y="25" width={i === 0 ? x(i)+85 : i === points.length - 1 ? 650 - (x(i)-85) : 170} height="178" fill="transparent"/><circle cx={x(i)} cy={y(w.reservadasPct)} r={selected === i ? 7 : 5} className="occupancy-point booked"/>{w.estimadasPct !== null && <circle cx={x(i)} cy={y(w.estimadasPct)} r={selected === i ? 7 : 5} className="occupancy-point projected"/>}<text x={x(i)} y="218" textAnchor="middle" className="occupancy-axis">{date(w.inicio)}</text>
   </g>)}
   {active && <g className="occupancy-tooltip" transform={`translate(${tooltipX} ${tooltipY})`} pointerEvents="none"><rect width="170" height={active.estimadasNoches === null ? 48 : 65} rx="7"/><text x="10" y="16" className="occupancy-tooltip__date">{date(active.inicio)} – {date(active.fin)}</text><text x="10" y="32">Reservadas: {active.reservadasNoches} · {active.reservadasPct}%</text>{active.estimadasNoches !== null && <text x="10" y="49">Estimadas: {active.estimadasNoches} · {active.estimadasPct}%</text>}</g>}
  </svg></div>
  <div className="occupancy-detail" aria-live="polite">{active ? <><strong>{date(active.inicio)} – {date(active.fin)}</strong><span>Reservadas: {active.reservadasNoches} de {active.capacidadNoches} habitaciones-noche ({active.reservadasPct}%)</span>{active.estimadasNoches !== null && <span>Estimadas: {active.estimadasNoches} habitaciones-noche ({active.estimadasPct}%)</span>}</> : <span>Coloca el cursor, toca o selecciona una semana para ver sus valores.</span>}</div>
  <p className="occupancy-note">Una habitación ocupada durante una noche equivale a una habitación-noche. Estimación orientativa basada en {data.semanasHistoria} semanas completas mediante suavizamiento exponencial; usa el inventario activo actual y los estados actuales de las reservas. No garantiza ocupación futura ni incorpora estacionalidad o cancelaciones futuras.</p>
 </div>
}
