import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/shared/lib/api'

interface Week { inicio: string; fin: string; capacidadNoches: number; reservadasNoches: number; estimadasNoches: number | null; reservadasPct: number; estimadasPct: number | null }
interface Projection { disponible: boolean; motivo: string | null; semanasHistoria: number; habitacionesActivas: number; semanas: Week[] }
const date = (value: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))

export function OcupacionProyeccion() {
 const [selected, setSelected] = useState<number | null>(null)
 const query = useQuery({ queryKey: ['dashboard', 'proyeccion-ocupacion'], queryFn: async () => await api.get('/dashboard/proyeccion-ocupacion') as Projection })
 if (query.isLoading) return <p className="occupancy-note">Calculando ocupación…</p>
 if (query.isError || !query.data) return <p className="occupancy-note" role="alert">No se pudo calcular la ocupación. <button onClick={() => void query.refetch()}>Reintentar</button></p>
 const data = query.data, points = data.semanas, x = (i: number) => 68 + i * 170, y = (pct: number) => 190 - pct * 1.45
 const path = (value: (w: Week) => number) => points.map((w, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(value(w))}`).join(' ')
 const active = selected === null ? null : points[selected]
 return <div className="occupancy-forecast">
  <p className="occupancy-note">Habitaciones-noche por semana · {data.habitacionesActivas} habitaciones activas · próximas cuatro semanas completas</p>
  {!data.disponible && <p className="occupancy-insufficient" role="status"><strong>Estimación no disponible.</strong> {data.motivo} Se muestran las habitaciones-noche ya reservadas.</p>}
  <div className="occupancy-legend"><span><i className="occupancy-dot booked"/>Ya reservadas</span>{data.disponible && <span><i className="occupancy-dot projected"/>Ocupación estimada</span>}</div>
  <div className="occupancy-chart"><svg viewBox="0 0 650 235" role="img" aria-label="Ocupación semanal reservada y estimada. Selecciona una semana para consultar sus cantidades.">
   {[0,25,50,75,100].map(p => <g key={p}><line x1="55" x2="600" y1={y(p)} y2={y(p)} className="occupancy-grid"/><text x="45" y={y(p)+4} textAnchor="end" className="occupancy-axis">{p}%</text></g>)}
   <path d={path(w => w.reservadasPct)} className="occupancy-line booked"/>
   {data.disponible && <path d={path(w => w.estimadasPct ?? 0)} className="occupancy-line projected"/>}
   {points.map((w,i) => <g key={w.inicio} onMouseEnter={() => setSelected(i)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(i)} onBlur={() => setSelected(null)} onClick={() => setSelected(i)} tabIndex={0} role="button" aria-label={`${date(w.inicio)} al ${date(w.fin)}: ${w.reservadasNoches} habitaciones-noche reservadas${w.estimadasNoches === null ? '' : `; ${w.estimadasNoches} estimadas`}`}>
    <rect x={x(i)-35} y="38" width="70" height="160" fill="transparent"/><circle cx={x(i)} cy={y(w.reservadasPct)} r="5" className="occupancy-point booked"/>{w.estimadasPct !== null && <circle cx={x(i)} cy={y(w.estimadasPct)} r="5" className="occupancy-point projected"/>}<text x={x(i)} y="218" textAnchor="middle" className="occupancy-axis">{date(w.inicio)}</text>
   </g>)}
  </svg></div>
  <div className="occupancy-detail" aria-live="polite">{active ? <><strong>{date(active.inicio)} – {date(active.fin)}</strong><span>Reservadas: {active.reservadasNoches} de {active.capacidadNoches} habitaciones-noche ({active.reservadasPct}%)</span>{active.estimadasNoches !== null && <span>Estimadas: {active.estimadasNoches} habitaciones-noche ({active.estimadasPct}%)</span>}</> : <span>Coloca el cursor, toca o selecciona una semana para ver sus valores.</span>}</div>
  <p className="occupancy-note">Una habitación ocupada durante una noche equivale a una habitación-noche. Estimación orientativa basada en {data.semanasHistoria} semanas completas mediante suavizamiento exponencial; usa el inventario activo actual y los estados actuales de las reservas. No garantiza ocupación futura ni incorpora estacionalidad o cancelaciones futuras.</p>
 </div>
}
