import type { DashboardBi } from '../useDashboard'

const colores = ['#205d4e', '#68a18c', '#c69b61', '#94bcb0', '#d4bc93']

export function ServiciosPopulares({ servicios }: { servicios: DashboardBi['serviciosPopulares'] }) {
  if (!servicios) return <p className="db-empty">Actualiza el backend para consultar los servicios.</p>
  if (servicios.length === 0) return <div className="db-unavailable"><strong>Sin servicios agregados</strong><p>No hay servicios en reservas no canceladas creadas durante este periodo.</p></div>
  const total = servicios.reduce((suma, servicio) => suma + servicio.cantidad, 0)
  const circunferencia = 2 * Math.PI * 42
  const segmentos = servicios.map((servicio, index) => {
    const proporcion = total > 0 ? servicio.cantidad / total : 0
    const inicio = total > 0 ? servicios.slice(0, index).reduce((suma, item) => suma + item.cantidad, 0) / total : 0
    return { ...servicio, color: colores[index % colores.length], proporcion, inicio }
  })
  return <div className="db-services"><p className="db-services__note">Unidades de los cinco servicios más agregados en reservas no canceladas creadas en el periodo.</p>
    <div className="db-services__visual"><div className="db-services__donut"><svg viewBox="0 0 100 100" role="img" aria-label="Distribución de unidades entre los servicios del top 5">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#e9f0ed" strokeWidth="12" />
      {segmentos.map(s => <circle key={s.servicioId} cx="50" cy="50" r="42" fill="none" stroke={s.color} strokeWidth="12" strokeDasharray={`${s.proporcion * circunferencia} ${circunferencia}`} strokeDashoffset={-s.inicio * circunferencia} transform="rotate(-90 50 50)"><title>{s.nombre}: {s.cantidad} unidades ({(s.proporcion * 100).toFixed(1)}% del top)</title></circle>)}
    </svg><div className="db-services__center"><strong>{total.toLocaleString('es-PE')}</strong><span>unidades del top</span></div></div>
    <ol className="db-services__list">{segmentos.map(s => <li key={s.servicioId} className="db-services__item"><div className="db-services__heading"><span className="db-services__dot" style={{ background: s.color }} aria-hidden="true"/><strong>{s.nombre}</strong><span className="db-services__quantity">{s.cantidad.toLocaleString('es-PE')} · {(s.proporcion * 100).toFixed(1)}%</span></div><small>{s.reservas} {s.reservas === 1 ? 'reserva' : 'reservas'}</small></li>)}</ol></div>
  </div>
}
