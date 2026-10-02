import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import { LandingPage } from '@/features/landing/components/LandingPage'
import { AdminPanel } from '@/features/portal-admin/admin-panel'
import { AdminShell } from '@/features/portal-admin/AdminShell'
import { DashboardBI } from '@/features/portal-admin/dashboard-bi/DashboardBI'
import { Calendario } from '@/features/portal-admin/calendario/Calendario'
import { Habitaciones } from '@/features/portal-admin/habitaciones/Habitaciones'
import { Servicios } from '@/features/portal-admin/servicios/Servicios'
import { Usuarios } from '@/features/portal-admin/usuarios/Usuarios'
import { useAuth } from '@/app/providers/auth-context'
import type { Rol } from '@/shared/types/global.types'
import { AuthPage } from '@/features/auth/AuthPage'

const PERSONAL_INTERNO: Rol[] = ['Administrador', 'Recepcion', 'Operaciones', 'Mantenimiento']
const GESTION_HABITACIONES: Rol[] = ['Administrador', 'Operaciones', 'Mantenimiento']
const GESTION_SERVICIOS: Rol[] = ['Administrador', 'Operaciones']

// Guard de ruta: permite acceso a los roles indicados, redirige a /login si no hay sesión activa
const RequireRole = ({ roles, children }: { roles: Rol[]; children: ReactElement }) => {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (!roles.includes(usuario.rol)) {
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
  const { usuario } = useAuth()

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<AuthPage />} />
        <Route path="/registro" element={<AuthPage />} />

        {/* Portal Admin — AdminShell provee sidebar + topbar para TODAS las rutas */}
        <Route path="/admin" element={<RequireRole roles={PERSONAL_INTERNO}><AdminShell><AdminPanel /></AdminShell></RequireRole>} />
        <Route path="/admin/dashboard"    element={<RequireRole roles={PERSONAL_INTERNO}><AdminShell><DashboardBI /></AdminShell></RequireRole>} />
        <Route path="/admin/habitaciones" element={<RequireRole roles={GESTION_HABITACIONES}><AdminShell><Habitaciones /></AdminShell></RequireRole>} />
        <Route path="/admin/calendario"   element={<RequireRole roles={PERSONAL_INTERNO}><AdminShell><Calendario /></AdminShell></RequireRole>} />
        <Route path="/admin/servicios"    element={<RequireRole roles={GESTION_SERVICIOS}><AdminShell><Servicios /></AdminShell></RequireRole>} />
        <Route path="/admin/usuarios"     element={<RequireRole roles={['Administrador']}><AdminShell><Usuarios /></AdminShell></RequireRole>} />

        {/* Portal Cliente — rol: Cliente */}
        <Route
          path="/cliente"
          element={
            usuario?.rol === 'Cliente' ? (
              <AdminPanel />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  )
}

const App = () => {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return <AppContent />
}

export default App
