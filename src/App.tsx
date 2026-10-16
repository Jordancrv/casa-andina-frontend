import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import { LandingPage } from '@/features/landing/components/LandingPage'
import { AdminShell } from '@/features/portal-admin/AdminShell'
import { DashboardBI } from '@/features/portal-admin/dashboard-bi/DashboardBI'
import { Calendario } from '@/features/portal-admin/calendario/Calendario'
import { Habitaciones } from '@/features/portal-admin/habitaciones/Habitaciones'
import { Servicios } from '@/features/portal-admin/servicios/Servicios'
import { Usuarios } from '@/features/portal-admin/usuarios/Usuarios'
import { useAuth } from '@/app/providers/auth-context'
import type { Rol } from '@/shared/types/global.types'
import { AuthPage } from '@/features/auth/AuthPage'
import { ClienteShell } from '@/features/portal-cliente/ClienteShell'
import { CompraReserva } from '@/features/portal-cliente/reservas/CompraReserva'
import { MisReservas } from '@/features/portal-cliente/reservas/MisReservas'

const PERSONAL_INTERNO: Rol[] = ['Superadministrador', 'Administrador', 'Recepcion', 'Operaciones', 'Mantenimiento']
const GESTION_HABITACIONES: Rol[] = ['Superadministrador', 'Administrador', 'Operaciones', 'Mantenimiento']
const GESTION_SERVICIOS: Rol[] = ['Superadministrador', 'Administrador', 'Operaciones']
const DASHBOARD_ROLES: Rol[] = ['Administrador']

// Guard de ruta: permite acceso a los roles indicados, redirige a /login si no hay sesión activa
const RequireRole = ({ roles, children }: { roles: Rol[]; children: ReactElement }) => {
  const { usuario } = useAuth()
  const location = useLocation()
  if (!usuario) return <Navigate to="/login" replace />
  if (!roles.includes(usuario.rol)) {
    if (usuario.rol === 'Cliente') return <Navigate to="/cliente" replace state={{ from: location }} />
    if (location.pathname === '/admin' || location.pathname === '/admin/dashboard') {
      return <Navigate to="/admin/calendario" replace />
    }
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Acceso No Autorizado</h2>
        <p className="text-gray-600">Tu usuario tiene el rol <span className="font-semibold">{usuario.rol}</span> que no tiene permisos para esta sección.</p>
      </div>
    )
  }
  return children
}

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<RoleHome />} />

        <Route path="/login" element={<AuthPage />} />
        <Route path="/registro" element={<AuthPage />} />

        {/* Portal Admin — AdminShell provee sidebar + topbar para TODAS las rutas */}
        <Route path="/admin" element={<RequireRole roles={PERSONAL_INTERNO}><AdminShell><AdminRoleHome /></AdminShell></RequireRole>} />
        <Route path="/admin/dashboard"    element={<RequireRole roles={DASHBOARD_ROLES}><AdminShell><DashboardBI /></AdminShell></RequireRole>} />
        <Route path="/admin/habitaciones" element={<RequireRole roles={GESTION_HABITACIONES}><AdminShell><Habitaciones /></AdminShell></RequireRole>} />
        <Route path="/admin/calendario"   element={<RequireRole roles={PERSONAL_INTERNO}><AdminShell><Calendario /></AdminShell></RequireRole>} />
        <Route path="/admin/servicios"    element={<RequireRole roles={GESTION_SERVICIOS}><AdminShell><Servicios /></AdminShell></RequireRole>} />
        <Route path="/admin/usuarios"     element={<RequireRole roles={['Administrador']}><AdminShell><Usuarios /></AdminShell></RequireRole>} />

        {/* Portal Cliente — rol: Cliente */}
        <Route
          path="/cliente"
          element={
            <RequireRole roles={['Cliente']}><ClienteShell><CompraReserva /></ClienteShell></RequireRole>
          }
        />
        <Route path="/cliente/reservas" element={<RequireRole roles={['Cliente']}><ClienteShell><MisReservas /></ClienteShell></RequireRole>} />
      </Routes>
    </Router>
  )
}

const RoleHome = () => {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/" replace />
  const destino = usuario.rol === 'Cliente'
    ? '/cliente'
    : usuario.rol === 'Administrador'
      ? '/admin/dashboard'
      : '/admin/calendario'
  return <Navigate to={destino} replace />
}

const AdminRoleHome = () => {
  const { usuario } = useAuth()
  const destino = usuario?.rol === 'Administrador' ? '/admin/dashboard' : '/admin/calendario'
  return <Navigate to={destino} replace />
}

const App = () => {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return <AppContent />
}

export default App
