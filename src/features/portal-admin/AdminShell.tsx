/**
 * AdminShell.tsx
 * ---------------------------------------------------------------------------
 * Layout compartido del Portal Admin.
 * Sidebar con SVG icons intuitivos + detección automática de ruta activa.
 *
 * USO:
 *   <AdminShell>
 *     <DashboardBI />
 *   </AdminShell>
 * ---------------------------------------------------------------------------
 */

import { useLocation, useNavigate } from 'react-router-dom'
import logoCasaAndina from '@/assets/casa-andina.png'
import './AdminShell.css'

// ---------------------------------------------------------------------------
// SVG icons del sidebar — uno por sección, intuitivos y de trazo uniforme
// ---------------------------------------------------------------------------

const IcoResumen = () => (
  // Layout de dashboard grid
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
)

const IcoReservas = () => (
  // Calendario con check
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M9 16l2 2 4-4" />
  </svg>
)

const IcoHabitaciones = () => (
  // Llave de habitación
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
)

const IcoServicios = () => (
  // Taza de café / room service
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
)

const IcoUsuarios = () => (
  // Usuario simple
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

// ---------------------------------------------------------------------------
// Ítems de navegación con SVG icon como ReactNode
// ---------------------------------------------------------------------------

const NAV_ITEMS: { label: string; path: string; icon: React.ReactNode }[] = [
  { label: 'Resumen',      path: '/admin/dashboard',    icon: <IcoResumen /> },
  { label: 'Reservas',     path: '/admin/calendario',   icon: <IcoReservas /> },
  { label: 'Habitaciones', path: '/admin/habitaciones', icon: <IcoHabitaciones /> },
  { label: 'Servicios',    path: '/admin/servicios',    icon: <IcoServicios /> },
  { label: 'Usuarios',     path: '/admin/usuarios',     icon: <IcoUsuarios /> },
]

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface AdminShellProps {
  children: React.ReactNode
  nombreUsuario?: string
  rolUsuario?: string
  iniciales?: string
}

export function AdminShell({
  children,
  nombreUsuario = 'Admin User',
  rolUsuario    = 'Administrador',
  iniciales     = 'AM',
}: AdminShellProps) {
  const navigate     = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="shell">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="shell-sidebar" aria-label="Navegación principal">
        {/* Logo */}
        <div className="shell-brand">
          <img
            src={logoCasaAndina}
            alt="Casa Andina"
            className="shell-brand__logo"
          />
          <span className="shell-brand__label">ADMIN CONSOLE</span>
        </div>

        {/* Navegación */}
        <nav className="shell-nav" aria-label="Menú del portal">
          {NAV_ITEMS.map(({ label, path, icon }) => {
            const isActive = pathname === path || pathname.startsWith(path + '/')
            return (
              <button
                key={path}
                type="button"
                className={`shell-nav__item${isActive ? ' shell-nav__item--active' : ''}`}
                onClick={() => navigate(path)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="shell-nav__icon" aria-hidden="true">{icon}</span>
                {label}
              </button>
            )
          })}
        </nav>

        {/* Usuario */}
        <div className="shell-user">
          <span className="shell-avatar">{iniciales}</span>
          <span className="shell-user__info">
            <b>{nombreUsuario}</b>
            <small>{rolUsuario}</small>
          </span>
        </div>
      </aside>

      {/* ── Main (contenido) ────────────────────────────────────────────── */}
      <div className="shell-main">
        <div className="shell-content">
          {children}
        </div>
      </div>
    </div>
  )
}
