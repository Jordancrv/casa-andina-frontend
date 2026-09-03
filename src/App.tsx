import { Button } from '@/shared/ui/Button'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LandingPage } from '@/features/landing/components/LandingPage'
import { AdminPanel } from '@/features/portal-admin/admin-panel'
import { useAuth } from '@/app/providers/AuthProvider'

const AppContent = () => {
  const { user, login } = useAuth()

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <div className="min-h-screen bg-gray-50 p-8">
              <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  await login(
                    formData.get('email') as string,
                    formData.get('password') as string
                  )
                }}
              >
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Contraseña</label>
                  <input
                    type="password"
                    name="password"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded"
                >
                  Entrar
                </Button>
              </form>
            </div>
          }
        />
        <Route
          path="/admin"
          element={
            user?.role === 'admin' ? (
              <AdminPanel />
            ) : (
              <p>No autorizado</p>
            )
          }
        />
        <Route
          path="/cliente"
          element={
            user?.role === 'cliente' ? (
              <AdminPanel />
            ) : (
              <p>No autorizado</p>
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
    return <div>Loading...</div>
  }

  return <AppContent />
}

export default App