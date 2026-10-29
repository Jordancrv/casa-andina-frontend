import './stay-status.css'

const statuses = {
  confirmed: { label: 'Reservado', hint: 'Pendiente de check-in', path: 'm8 12 3 3 5-6' },
  active: { label: 'Estadía en curso', hint: 'Check-in registrado', path: 'M9 20V10h6v10M3 10l9-7 9 7v10H3Z' },
  completed: { label: 'Estadía finalizada', hint: 'Check-out registrado', path: 'm7 12 3 3 7-7M5 3h14v18H5Z' },
  cancelled: { label: 'Reserva cancelada', hint: 'La reserva fue cancelada', path: 'm8 8 8 8m0-8-8 8' },
  pending: { label: 'Pendiente', hint: 'Pendiente de confirmación', path: 'M12 7v5l3 2' },
}

export function StayStatus({ status, detailed = false }: { status: string; detailed?: boolean }) {
  const key = ['Reservado', 'Confirmada', 'Reserva confirmada', 'Ingreso pendiente'].includes(status) ? 'confirmed'
    : status === 'Estadía en curso' ? 'active'
    : ['Completada', 'Estadía finalizada'].includes(status) ? 'completed'
    : ['Cancelada', 'Reserva cancelada'].includes(status) ? 'cancelled' : 'pending'
  const state = statuses[key]
  return <div className={`stay-status stay-status--${key}${detailed ? ' stay-status--detailed' : ''}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {['confirmed', 'cancelled', 'pending'].includes(key) && <circle cx="12" cy="12" r="9" />}
      <path d={state.path} />
    </svg>
    <div><span className="stay-status-label">{key === 'pending' ? status || state.label : state.label}</span>{detailed && <span className="stay-status-hint">{state.hint}</span>}</div>
  </div>
}
