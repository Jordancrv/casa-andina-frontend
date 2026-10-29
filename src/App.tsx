import { AccessProvider } from '@/app/providers/AccessProvider'
import { useAccess, SECTION_PERMISSIONS } from '@/app/providers/access-context'
import { Roles } from '@/features/portal-admin/roles/Roles'
import { Perfil } from '@/features/perfil/Perfil'
import { ConversationProvider } from '@/features/portal-cliente/chatbot/ConversationProvider'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import { LandingPage } from '@/features/landing/components/LandingPage'
import { AdminShell } from '@/features/portal-admin/AdminShell'
import { DashboardBI } from '@/features/portal-admin/dashboard-bi/DashboardBI'
import { Calendario } from '@/features/portal-admin/calendario/Calendario'
import { Recepcion } from '@/features/portal-admin/recepcion/Recepcion'
import { Habitaciones } from '@/features/portal-admin/habitaciones/Habitaciones'
import { Servicios } from '@/features/portal-admin/servicios/Servicios'
import { Comodidades } from '@/features/portal-admin/comodidades/Comodidades'
import { Usuarios } from '@/features/portal-admin/usuarios/Usuarios'
import { Clientes } from '@/features/portal-admin/clientes/Clientes'
import { Sedes } from '@/features/portal-admin/sedes/Sedes'
import { Reportes } from '@/features/portal-admin/reportes/Reportes'
import { useAuth } from '@/app/providers/auth-context'
import { AuthPage } from '@/features/auth/AuthPage'
import { ClienteShell } from '@/features/portal-cliente/ClienteShell'
import { CompraReserva } from '@/features/portal-cliente/reservas/CompraReserva'
import { MisReservas } from '@/features/portal-cliente/reservas/MisReservas'
import { MiCalendario } from '@/features/portal-cliente/calendario/MiCalendario'
import { Chatbot } from '@/features/portal-cliente/chatbot/components/Chatbot'

// La identidad separa los portales; el servidor resuelve los permisos operativos.
const RequireAccess = ({ client = false, children }: { client?: boolean; children: ReactElement }) => {
  const { usuario } = useAuth()
  const location = useLocation()
  const access = useAccess()
  if (!usuario) return <Navigate to="/login" replace />
  if (client) return usuario.rol === 'Cliente' ? children : <Navigate to="/admin" replace />
  if (usuario.rol === 'Cliente') return <Navigate to="/cliente" replace />
  if (access.loading) return <p className="p-8">Cargando accesos…</p>
  if (access.error) return <div className="p-8"><p>No se pudieron verificar tus accesos.</p><button onClick={access.refresh}>Reintentar</button></div>
  if (location.pathname === '/admin' || location.pathname === '/admin/perfil' || access.can(SECTION_PERMISSIONS[location.pathname])) return children
  return <Navigate to={access.home} replace />
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
        <Route path="/admin" element={<RequireAccess><AdminShell><AdminRoleHome /></AdminShell></RequireAccess>} />
        <Route path="/admin/perfil" element={<RequireAccess><AdminShell><Perfil /></AdminShell></RequireAccess>} />
        <Route path="/admin/recepcion" element={<RequireAccess><AdminShell><Recepcion /></AdminShell></RequireAccess>} />
        <Route path="/admin/dashboard"    element={<RequireAccess><AdminShell><DashboardBI /></AdminShell></RequireAccess>} />
        <Route path="/admin/habitaciones" element={<RequireAccess><AdminShell><Habitaciones /></AdminShell></RequireAccess>} />
        <Route path="/admin/calendario"   element={<RequireAccess><AdminShell><Calendario /></AdminShell></RequireAccess>} />
        <Route path="/admin/servicios"    element={<RequireAccess><AdminShell><Servicios /></AdminShell></RequireAccess>} />
        <Route path="/admin/comodidades" element={<RequireAccess><AdminShell><Comodidades /></AdminShell></RequireAccess>} />
        <Route path="/admin/usuarios"     element={<RequireAccess><AdminShell><Usuarios /></AdminShell></RequireAccess>} />
        <Route path="/admin/sedes"        element={<RequireAccess><AdminShell><Sedes /></AdminShell></RequireAccess>} />
        <Route path="/admin/clientes"     element={<RequireAccess><AdminShell><Clientes /></AdminShell></RequireAccess>} />
        <Route path="/admin/reportes"     element={<RequireAccess><AdminShell><Reportes /></AdminShell></RequireAccess>} />

        <Route path="/admin/roles" element={<RequireAccess><AdminShell><Roles /></AdminShell></RequireAccess>} />
        {/* Portal Cliente — rol: Cliente */}
        <Route
          path="/cliente"
          element={
            <RequireAccess client><ClienteShell><CompraReserva /></ClienteShell></RequireAccess>
          }
        />
        <Route path="/cliente/reservas" element={<RequireAccess client><ClienteShell><MisReservas /></ClienteShell></RequireAccess>} />
        <Route path="/cliente/perfil" element={<RequireAccess client><ClienteShell><Perfil /></ClienteShell></RequireAccess>} />
        <Route path="/cliente/calendario" element={<RequireAccess client><ClienteShell><MiCalendario /></ClienteShell></RequireAccess>} />
        <Route path="/cliente/asistente" element={<RequireAccess client><ClienteShell><Chatbot /></ClienteShell></RequireAccess>} />
      </Routes>
    </Router>
  )
}

const RoleHome = () => {
  const { usuario } = useAuth()
  const access = useAccess()
  if (!usuario) return <Navigate to="/" replace />
  if (access.loading) return <p className="p-8">Cargando accesos…</p>
  if (access.home === '/admin') return <div className="p-8"><h2>Sin secciones disponibles</h2><p>Solicita al administrador que revise tus roles.</p><button onClick={access.refresh}>Actualizar accesos</button></div>
  return <Navigate to={access.home} replace />
}

const AdminRoleHome = () => {
  const { usuario } = useAuth()
  const access = useAccess()
  if (!usuario) return <Navigate to="/login" replace />
  if (access.loading) return <p className="p-8">Cargando accesos…</p>
  if (access.home === '/admin') return <div className="p-8"><h2>Sin secciones disponibles</h2><p>Solicita al administrador que revise tus roles.</p><button onClick={access.refresh}>Actualizar accesos</button></div>
  return <Navigate to={access.home} replace />
}

const App = () => {
  const { usuario } = useAuth()
  return <AccessProvider><ConversationProvider key={usuario?.token ?? 'sin-sesion'}><AppContent /></ConversationProvider></AccessProvider>
}

export default App
