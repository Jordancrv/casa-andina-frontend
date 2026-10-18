import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-context'
import logo from '@/assets/casa-andina.png'
import './cliente.css'

export function ClienteShell({ children }: { children: React.ReactNode }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const initials = useMemo(() => usuario?.nombreCompleto.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase() ?? 'CL', [usuario])

  return <div className="cliente-app">
    <aside className="cliente-sidebar">
      <div className="cliente-brand"><img className="cliente-brand-logo" src={logo} alt="Casa Andina Hoteles" /></div>
      <nav aria-label="Navegación del cliente">
        <button className={pathname === '/cliente' ? 'active' : ''} onClick={() => navigate('/cliente')}>Buscar estadía</button>
        <button className={pathname.startsWith('/cliente/reservas') ? 'active' : ''} onClick={() => navigate('/cliente/reservas')}>Mis reservas</button>
        <button className={pathname === '/cliente/asistente' ? 'active' : ''} onClick={() => navigate('/cliente/asistente')}>Asistente</button>
      </nav>
      <div className="cliente-profile"><span className="cliente-avatar">{initials}</span><span><b>{usuario?.nombreCompleto}</b><small>Cliente</small></span></div>
      <button className="cliente-sidebar-logout" onClick={() => { logout(); navigate('/login') }}>Cerrar sesión</button>
    </aside>
    <main className="cliente-main">
      {children}
    </main>
  </div>
}
