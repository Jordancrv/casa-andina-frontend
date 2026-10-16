import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@/app/providers/auth-context'
import { getRoleHomeRoute } from '@/shared/constants/role-access'
import { getDocumentTypes, registerClient } from './auth.api'
import type { DocumentTypeOption, RegisterClientRequest } from './auth.types'
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
  if (error.response?.status === 429) {
    return data?.detail || 'Se alcanzó el límite de registros desde esta conexión. Espera unos minutos antes de intentarlo otra vez.'
  }
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
        <li key={label} className={isValid ? 'is-valid' : 'is-pending'}>
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
  const [personType, setPersonType] = useState<'N' | 'J'>('N')
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeOption[]>([])
  const [documentCode, setDocumentCode] = useState('')

  useEffect(() => {
    if (!isRegister) return
    let active = true
    getDocumentTypes(personType)
      .then((types) => {
        if (!active) return
        setDocumentTypes(types)
        setDocumentCode(types[0]?.codigo ?? '')
      })
      .catch(() => {
        if (active) setErrorMessage('No pudimos cargar los tipos de documento.')
      })
    return () => { active = false }
  }, [isRegister, personType])

  if (usuario) {
    return <Navigate to={getRoleHomeRoute(usuario.rol)} replace />
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
      tipoPersona: personType,
      tipoDocumento: documentCode,
      numeroDocumento: String(data.get('numeroDocumento')),
      nombreCompleto: String(data.get('nombreCompleto')),
      nombreComercial: personType === 'J' ? String(data.get('nombreComercial')) || null : null,
      email: String(data.get('email')),
      telefono: String(data.get('telefono')) || null,
      password
    }

    setIsSubmitting(true)
    try {
      const session = await registerClient(request)
      completeLogin(session)
      navigate(getRoleHomeRoute(session.rol), { replace: true })
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
                  <span>Tipo de persona</span>
                  <select value={personType} onChange={(event) => setPersonType(event.target.value as 'N' | 'J')}>
                    <option value="N">Persona natural</option>
                    <option value="J">Persona jurídica</option>
                  </select>
                </label>
                <label className="auth-field auth-field-wide">
                  <span>{personType === 'N' ? 'Nombre completo' : 'Razón social'}</span>
                  <input name="nombreCompleto" autoComplete="name" minLength={3} maxLength={200} required />
                </label>
                {personType === 'J' && (
                  <label className="auth-field auth-field-wide">
                    <span>Nombre comercial <small>Opcional</small></span>
                    <input name="nombreComercial" maxLength={150} />
                  </label>
                )}
                <label className="auth-field">
                  <span>Tipo de documento</span>
                  <select value={documentCode} onChange={(event) => setDocumentCode(event.target.value)} required>
                    {documentTypes.map((type) => <option key={type.codigo} value={type.codigo}>{type.nombre}</option>)}
                  </select>
                </label>
                <label className="auth-field">
                  <span>Número de documento</span>
                  <input
                    name="numeroDocumento"
                    inputMode={documentCode === 'PASAPORTE' || documentCode === 'CE' ? 'text' : 'numeric'}
                    autoComplete="off"
                    minLength={documentTypes.find((type) => type.codigo === documentCode)?.longitudMinima}
                    maxLength={documentTypes.find((type) => type.codigo === documentCode)?.longitudMaxima ?? 20}
                    required
                  />
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
