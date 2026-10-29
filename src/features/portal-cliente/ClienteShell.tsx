import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-context'
import logo from '@/assets/casa-andina.png'
import { ChatFlotante } from './chatbot/components/ChatFlotante'
import './cliente.css'

export function ClienteShell({ children }: { children: React.ReactNode }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const initials = useMemo(() => usuario?.nombreCompleto.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase() ?? 'CL', [usuario])

  return <div className={`cliente-app${pathname === '/cliente/asistente' ? ' cliente-app--assistant' : ''}${pathname === '/cliente/calendario' ? ' cliente-app--calendar' : ''}`}>
    <aside className="cliente-sidebar">
      <div className="cliente-brand"><img className="cliente-brand-logo" src={logo} alt="Casa Andina Hoteles" /></div>
      <nav aria-label="Navegación del cliente">
        <button className={pathname === '/cliente' ? 'active' : ''} onClick={() => navigate('/cliente')}>Buscar estadía</button>
        <button className={pathname.startsWith('/cliente/reservas') ? 'active' : ''} onClick={() => navigate('/cliente/reservas')}>Mis reservas</button>
        <button className={pathname === '/cliente/calendario' ? 'active' : ''} onClick={() => navigate('/cliente/calendario')}>Mi calendario</button>
        <button className={pathname === '/cliente/asistente' ? 'active' : ''} onClick={() => navigate('/cliente/asistente')}>Asistente</button>
        <button className={pathname === '/cliente/perfil' ? 'active' : ''} onClick={() => navigate('/cliente/perfil')}>Mi perfil</button>
      </nav>
      <div className="cliente-sidebar-footer">
      <button type="button" className="cliente-profile" onClick={() => navigate('/cliente/perfil')} aria-label="Ver mi perfil"><span className="cliente-avatar">{initials}</span><span><b>{usuario?.nombreCompleto}</b><small>Cliente</small></span></button>
      <button className="cliente-sidebar-logout" onClick={() => { logout(); navigate('/login') }}>Cerrar sesión</button>
      </div>
    </aside>
    <main className="cliente-main">
      {children}
    </main>
    {pathname !== '/cliente/asistente' && <ChatFlotante />}
  </div>
}
