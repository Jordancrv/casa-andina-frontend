import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import { LandingPage } from '@/features/landing/components/LandingPage'
import { AdminShell } from '@/features/portal-admin/AdminShell'
import { DashboardBI } from '@/features/portal-admin/dashboard-bi/DashboardBI'
import { Calendario } from '@/features/portal-admin/calendario/Calendario'
import { Recepcion } from '@/features/portal-admin/recepcion/Recepcion'
import { Habitaciones } from '@/features/portal-admin/habitaciones/Habitaciones'
import { Servicios } from '@/features/portal-admin/servicios/Servicios'
import { Usuarios } from '@/features/portal-admin/usuarios/Usuarios'
import { Clientes } from '@/features/portal-admin/clientes/Clientes'
import { Sedes } from '@/features/portal-admin/sedes/Sedes'
import { ModulosPendientes } from '@/features/portal-admin/ModulosPendientes'
import { useAuth } from '@/app/providers/auth-context'
import type { Rol } from '@/shared/types/global.types'
import { AuthPage } from '@/features/auth/AuthPage'
import { ClienteShell } from '@/features/portal-cliente/ClienteShell'
import { CompraReserva } from '@/features/portal-cliente/reservas/CompraReserva'
import { MisReservas } from '@/features/portal-cliente/reservas/MisReservas'
import { Chatbot } from '@/features/portal-cliente/chatbot/components/Chatbot'
import { getRoleHomeRoute, ROLE_ACCESS } from '@/shared/constants/role-access'

// Guard de ruta: permite acceso a los roles indicados, redirige a /login si no hay sesión activa
const RequireRole = ({ roles, children }: { roles: readonly Rol[]; children: ReactElement }) => {
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
        <Route path="/admin" element={<RequireRole roles={ROLE_ACCESS.internal}><AdminShell><AdminRoleHome /></AdminShell></RequireRole>} />
        <Route path="/admin/recepcion" element={<RequireRole roles={ROLE_ACCESS.reception}><AdminShell><Recepcion /></AdminShell></RequireRole>} />
        <Route path="/admin/dashboard"    element={<RequireRole roles={ROLE_ACCESS.dashboard}><AdminShell><DashboardBI /></AdminShell></RequireRole>} />
        <Route path="/admin/habitaciones" element={<RequireRole roles={ROLE_ACCESS.rooms}><AdminShell><Habitaciones /></AdminShell></RequireRole>} />
        <Route path="/admin/calendario"   element={<RequireRole roles={ROLE_ACCESS.internal}><AdminShell><Calendario /></AdminShell></RequireRole>} />
        <Route path="/admin/servicios"    element={<RequireRole roles={ROLE_ACCESS.services}><AdminShell><Servicios /></AdminShell></RequireRole>} />
        <Route path="/admin/usuarios"     element={<RequireRole roles={ROLE_ACCESS.users}><AdminShell><Usuarios /></AdminShell></RequireRole>} />
        <Route path="/admin/sedes"        element={<RequireRole roles={ROLE_ACCESS.dashboard}><AdminShell><Sedes /></AdminShell></RequireRole>} />
        <Route path="/admin/clientes"     element={<RequireRole roles={ROLE_ACCESS.dashboard}><AdminShell><Clientes /></AdminShell></RequireRole>} />
        <Route path="/admin/reportes"     element={<RequireRole roles={ROLE_ACCESS.dashboard}><AdminShell><ModulosPendientes modulo="reportes" /></AdminShell></RequireRole>} />

        {/* Portal Cliente — rol: Cliente */}
        <Route
          path="/cliente"
          element={
            <RequireRole roles={ROLE_ACCESS.client}><ClienteShell><CompraReserva /></ClienteShell></RequireRole>
          }
        />
        <Route path="/cliente/reservas" element={<RequireRole roles={ROLE_ACCESS.client}><ClienteShell><MisReservas /></ClienteShell></RequireRole>} />
        <Route path="/cliente/asistente" element={<RequireRole roles={ROLE_ACCESS.client}><ClienteShell><Chatbot /></ClienteShell></RequireRole>} />
      </Routes>
    </Router>
  )
}

const RoleHome = () => {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/" replace />
  return <Navigate to={getRoleHomeRoute(usuario.rol)} replace />
}

const AdminRoleHome = () => {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  return <Navigate to={getRoleHomeRoute(usuario.rol)} replace />
}

const App = () => {
  return <AppContent />
}

export default App
