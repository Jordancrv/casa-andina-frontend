import { Button } from '@/shared/ui/Button'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { LandingPage } from '@/features/landing/components/LandingPage'
import { AdminPanel } from '@/features/portal-admin/admin-panel'
import { DashboardBI } from '@/features/portal-admin/dashboard-bi/DashboardBI'
import { Calendario } from '@/features/portal-admin/calendario/Calendario'
import { Habitaciones } from '@/features/portal-admin/habitaciones/Habitaciones'
import { Servicios } from '@/features/portal-admin/servicios/Servicios'
import { Usuarios } from '@/features/portal-admin/usuarios/Usuarios'
import { useAuth } from '@/app/providers/AuthProvider'

const ADMIN_ROLES = ['Administrador', 'Recepcion', 'Operaciones', 'Mantenimiento']

// Guard de ruta: permite acceso a los roles indicados, redirige a /login si no hay sesión activa
const RequireRole = ({ roles, children }: { roles: string[]; children: JSX.Element }) => {
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

const LoginPage = () => {
  const { usuario, login } = useAuth()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (usuario) {
    if (usuario.rol === 'Cliente') {
      return <Navigate to="/cliente" replace />
    }
    return <Navigate to="/admin/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      await login(email, password)
    } catch (err: any) {
      console.error('Login error:', err)
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.'
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Casa Andina - Sistema de Gestión
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {errorMsg}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1">
                <input
                  type="password"
                  name="password"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  required
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Ingresando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const AppContent = () => {
  const { usuario } = useAuth()

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />

        {/* Portal Admin — roles internos (Administrador, Recepcion, Operaciones, Mantenimiento) */}
        <Route path="/admin" element={<RequireRole roles={ADMIN_ROLES}><AdminPanel /></RequireRole>} />
        <Route path="/admin/dashboard" element={<RequireRole roles={ADMIN_ROLES}><DashboardBI /></RequireRole>} />
        <Route path="/admin/habitaciones" element={<RequireRole roles={ADMIN_ROLES}><Habitaciones /></RequireRole>} />
        <Route path="/admin/calendario" element={<RequireRole roles={ADMIN_ROLES}><Calendario /></RequireRole>} />
        <Route path="/admin/servicios" element={<RequireRole roles={ADMIN_ROLES}><Servicios /></RequireRole>} />
        <Route path="/admin/usuarios" element={<RequireRole roles={['Administrador']}><Usuarios /></RequireRole>} />

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