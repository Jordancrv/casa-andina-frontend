import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@/app/providers/auth-context'
import { getRoleHomeRoute } from '@/shared/constants/role-access'
import { getDocumentTypes, registerClient } from './auth.api'
import type { DocumentTypeOption, RegisterClientRequest } from './auth.types'
import { RecaptchaCheckbox } from './RecaptchaCheckbox'
import { isRecaptchaConfigured } from './recaptcha.config'
import { cleanGuestPhone, formatGuestPhone } from '@/features/portal-cliente/reservas/guest-input'
import logo from '@/assets/casa-andina.png'
import './auth.css'

type ApiError = {
  title?: string
  detail?: string
  message?: string
  errors?: Record<string, string[]>
}

const passwordRequirements = (value: string) => [
  value.length >= 10,
  /[A-Z]/.test(value),
  /[a-z]/.test(value),
  /\d/.test(value),
  /[^a-zA-Z0-9]/.test(value),
]
const isPasswordValid = (value: string) => passwordRequirements(value).every(Boolean)
const naturalPersonNamePattern = /^[\p{L}][\p{L}\s.'-]*$/u

const isDocumentNumberValid = (code: string, value: string) => {
  switch (code) {
    case 'DNI': return /^\d{8}$/.test(value)
    case 'CE': return /^[A-Za-z0-9]{9,12}$/.test(value)
    case 'PASAPORTE': return /^[A-Za-z0-9]{6,20}$/.test(value)
    case 'RUC': return /^\d{11}$/.test(value)
    default: return false
  }
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
  const validity = useMemo(() => passwordRequirements(password), [password])
  const rules = [
    ['10 caracteres', validity[0]],
    ['Una mayúscula', validity[1]],
    ['Una minúscula', validity[2]],
    ['Un número', validity[3]],
    ['Un símbolo', validity[4]],
  ] as const

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
  const [documentNumber, setDocumentNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaAttempt, setCaptchaAttempt] = useState(0)
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const handleCaptchaToken = useCallback((token: string | null) => {
    setCaptchaToken(token)
    if (token) setCaptchaRequired(false)
  }, [])

  useEffect(() => {
    if (!isRegister) return
    let active = true
    getDocumentTypes(personType)
      .then((types) => {
        if (!active) return
        setDocumentTypes(types)
        setDocumentCode(types[0]?.codigo ?? '')
        setDocumentNumber('')
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
    setCaptchaRequired(false)
    if (isRecaptchaConfigured && !captchaToken) {
      setCaptchaRequired(true)
      return
    }
    setIsSubmitting(true)
    const data = new FormData(event.currentTarget)

    try {
      await login(String(data.get('email')), String(data.get('password')), captchaToken)
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error) && error.response?.status === 401
          ? 'Correo o contraseña incorrectos. Revisa tus datos e inténtalo nuevamente.'
          : getErrorMessage(error)
      )
    } finally {
      setIsSubmitting(false)
      setCaptchaToken(null)
      setCaptchaAttempt(value => value + 1)
    }
  }

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    const data = new FormData(event.currentTarget)
    const confirmation = String(data.get('confirmPassword'))
    const fullName = String(data.get('nombreCompleto') ?? '').trim()
    const documentNumber = String(data.get('numeroDocumento') ?? '').trim().toUpperCase()

    if (password !== confirmation) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }
    if (!isPasswordValid(password)) {
      setErrorMessage('La contraseña debe cumplir todos los requisitos indicados.')
      return
    }
    if (fullName.length < 3 || fullName.length > 200) {
      setErrorMessage('El nombre o razón social debe tener entre 3 y 200 caracteres.')
      return
    }
    if (personType === 'N' && !naturalPersonNamePattern.test(fullName)) {
      setErrorMessage('El nombre solo puede contener letras y separadores habituales.')
      return
    }
    if (!isDocumentNumberValid(documentCode, documentNumber)) {
      const message = documentCode === 'DNI' ? 'El DNI debe contener exactamente 8 dígitos.'
        : documentCode === 'CE' ? 'El carné de extranjería debe contener entre 9 y 12 letras o números.'
          : documentCode === 'PASAPORTE' ? 'El pasaporte debe contener entre 6 y 20 letras o números.'
            : documentCode === 'RUC' ? 'El RUC debe contener exactamente 11 dígitos.'
              : 'Selecciona un tipo de documento válido.'
      setErrorMessage(message)
      return
    }

    if (phone && !/^\+?[1-9]\d{7,14}$/.test(phone)) {
      setErrorMessage('El teléfono debe tener de 8 a 15 dígitos y puede iniciar con + y código de país.')
      return
    }

    const request: RegisterClientRequest = {
      tipoPersona: personType,
      tipoDocumento: documentCode,
      numeroDocumento: documentNumber,
      nombreCompleto: fullName,
      nombreComercial: personType === 'J' ? String(data.get('nombreComercial') ?? '').trim() || null : null,
      email: String(data.get('email') ?? '').trim().toLowerCase(),
      telefono: phone || null,
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
        <p className="auth-brand-image-description">En cada uno de nuestros hoteles, encuentras una casa llena de espacios pensados para disfrutar el Perú.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-form-container">
          <header>
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
                  <select value={documentCode} onChange={(event) => { setDocumentCode(event.target.value); setDocumentNumber('') }} required>
                    {documentTypes.map((type) => <option key={type.codigo} value={type.codigo}>{type.nombre}</option>)}
                  </select>
                </label>
                <label className="auth-field">
                  <span>Número de documento</span>
                  <input
                    name="numeroDocumento"
                    value={documentNumber}
                    onChange={(event) => {
                      const numeric = documentCode === 'DNI' || documentCode === 'RUC'
                      const limit = documentCode === 'DNI' ? 8 : documentCode === 'RUC' ? 11 : documentCode === 'CE' ? 12 : 20
                      setDocumentNumber(event.target.value.replace(numeric ? /\D/g : /[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, limit))
                    }}
                    inputMode={documentCode === 'PASAPORTE' || documentCode === 'CE' ? 'text' : 'numeric'}
                    autoComplete="off"
                    minLength={documentCode === 'DNI' ? 8 : documentCode === 'RUC' ? 11 : documentCode === 'CE' ? 9 : 6}
                    maxLength={documentCode === 'DNI' ? 8 : documentCode === 'RUC' ? 11 : documentCode === 'CE' ? 12 : 20}
                    pattern={documentCode === 'DNI' ? '[0-9]{8}' : documentCode === 'RUC' ? '[0-9]{11}' : documentCode === 'CE' ? '[A-Za-z0-9]{9,12}' : '[A-Za-z0-9]{6,20}'}
                    title={documentCode === 'DNI' ? 'El DNI debe contener exactamente 8 números.' : documentCode === 'RUC' ? 'El RUC debe contener exactamente 11 números.' : documentCode === 'CE' ? 'Ingresa entre 9 y 12 letras o números.' : 'Ingresa entre 6 y 20 letras o números.'}
                    required
                  />
                </label>
                <label className="auth-field">
                  <span>Teléfono <small>Opcional</small></span>
                  <input name="telefono" type="tel" inputMode="tel" autoComplete="tel" placeholder="+51 999 999 999" maxLength={22} pattern="\+?[1-9][0-9 ]{7,20}" title="Usa de 8 a 15 dígitos; puedes iniciar con + y código de país." value={formatGuestPhone(phone)} onChange={event => setPhone(cleanGuestPhone(event.target.value))} />
                </label>
              </div>
            )}

            <label className="auth-field">
              <span>Correo electrónico</span>
              <input name="email" type="email" autoComplete="email" maxLength={150} required />
            </label>

            <div className="auth-field">
              <label htmlFor="auth-password">Contraseña</label>
              <div className="auth-password-input">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 10 : 6}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
                <button className="auth-password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} aria-controls="auth-password">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {showPassword && <path d="m3 3 18 18" />}
                  </svg>
                </button>
              </div>
            </div>

            {!isRegister && <div className="auth-captcha-group">
              <RecaptchaCheckbox onToken={handleCaptchaToken} resetKey={captchaAttempt} />
              {captchaRequired && <p className="auth-captcha-required" role="alert">Completa la verificación reCAPTCHA antes de iniciar sesión.</p>}
            </div>}

            {isRegister && (
              <>
                <PasswordRequirements password={password} />
                <label className="auth-field">
                  <span>Confirmar contraseña</span>
                  <input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={10} maxLength={72} required />
                </label>
              </>
            )}

            <button className="auth-submit" type="submit" disabled={isSubmitting || (isRegister && !isPasswordValid(password))}>
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
