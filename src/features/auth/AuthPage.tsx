import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@/app/providers/auth-context'
import { registerClient } from './auth.api'
import type { RegisterClientRequest } from './auth.types'
import logo from '@/assets/casa-andina.png'
import './auth.css'

type ApiError = {
  title?: string
  detail?: string
  message?: string
  errors?: Record<string, string[]>
}

const getErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError<ApiError>(error)) {
    return 'No pudimos completar la solicitud. Inténtalo nuevamente.'
  }

  const data = error.response?.data
  const validationMessage = data?.errors && Object.values(data.errors).flat()[0]
  return validationMessage || data?.detail || data?.message || data?.title ||
    'No pudimos completar la solicitud. Revisa tus datos.'
}

const PasswordRequirements = ({ password }: { password: string }) => {
  const rules = useMemo(() => [
    ['10 caracteres', password.length >= 10],
    ['Una mayúscula', /[A-Z]/.test(password)],
    ['Una minúscula', /[a-z]/.test(password)],
    ['Un número', /\d/.test(password)],
    ['Un símbolo', /[^a-zA-Z0-9]/.test(password)]
  ] as const, [password])

  return (
    <ul className="auth-password-rules" aria-label="Requisitos de contraseña">
      {rules.map(([label, isValid]) => (
        <li key={label} className={isValid ? 'is-valid' : ''}>
          <span aria-hidden="true">{isValid ? '✓' : '○'}</span> {label}
        </li>
      ))}
    </ul>
  )
}

export const AuthPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, login, completeLogin } = useAuth()
  const isRegister = location.pathname === '/registro'
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (usuario) {
    return <Navigate to={usuario.rol === 'Cliente' ? '/cliente' : '/admin/dashboard'} replace />
  }

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)
    const data = new FormData(event.currentTarget)

    try {
      await login(String(data.get('email')), String(data.get('password')))
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    const data = new FormData(event.currentTarget)
    const confirmation = String(data.get('confirmPassword'))

    if (password !== confirmation) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    const request: RegisterClientRequest = {
      nombreCompleto: String(data.get('nombreCompleto')),
      dni: String(data.get('dni')),
      email: String(data.get('email')),
      telefono: String(data.get('telefono')) || null,
      password
    }

    setIsSubmitting(true)
    try {
      const session = await registerClient(request)
      completeLogin(session)
      navigate('/cliente', { replace: true })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand" aria-label="Casa Andina">
        <Link className="auth-logo" to="/">
          <img src={logo} alt="Casa Andina" />
        </Link>
        <div className="auth-brand-copy">
          <p>Una estadía pensada para ti</p>
          <h1>{isRegister ? 'Empieza tu próxima experiencia' : 'Bienvenido de nuevo'}</h1>
          <span>Gestiona tus reservas, servicios y preferencias desde un solo lugar.</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-form-container">
          <header>
            <p className="auth-eyebrow">Portal de clientes</p>
            <h2>{isRegister ? 'Crear una cuenta' : 'Iniciar sesión'}</h2>
            <p className="auth-intro">
              {isRegister
                ? 'Completa tus datos para reservar en Casa Andina.'
                : 'Ingresa con el correo asociado a tu cuenta.'}
            </p>
          </header>

          {errorMessage && <div className="auth-alert" role="alert">{errorMessage}</div>}

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="auth-form">
            {isRegister && (
              <div className="auth-field-grid">
                <label className="auth-field auth-field-wide">
                  <span>Nombre completo</span>
                  <input name="nombreCompleto" autoComplete="name" minLength={3} maxLength={200} required />
                </label>
                <label className="auth-field">
                  <span>DNI</span>
                  <input name="dni" inputMode="numeric" autoComplete="off" pattern="[0-9]{8}" maxLength={8} required />
                </label>
                <label className="auth-field">
                  <span>Teléfono <small>Opcional</small></span>
                  <input name="telefono" type="tel" inputMode="tel" autoComplete="tel" pattern="\+?[0-9]{7,15}" />
                </label>
              </div>
            )}

            <label className="auth-field">
              <span>Correo electrónico</span>
              <input name="email" type="email" autoComplete="email" maxLength={150} required />
            </label>

            <label className="auth-field">
              <span>Contraseña</span>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 10 : 6}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {isRegister && (
              <>
                <PasswordRequirements password={password} />
                <label className="auth-field">
                  <span>Confirmar contraseña</span>
                  <input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={10} maxLength={72} required />
                </label>
              </>
            )}

            <label className="auth-checkbox">
              <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
              <span>Mostrar contraseña</span>
            </label>

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Ingresar'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? '¿Ya tienes una cuenta?' : '¿Aún no tienes una cuenta?'}{' '}
            <Link to={isRegister ? '/login' : '/registro'}>
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </Link>
          </p>
          <Link className="auth-back" to="/">Volver al inicio</Link>
        </div>
      </section>
    </main>
  )
}
