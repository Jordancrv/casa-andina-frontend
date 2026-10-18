import { useEffect, useRef, useState } from 'react'
import { RECAPTCHA_SITE_KEY } from './recaptcha.config'

interface GrecaptchaApi {
  render(container: HTMLElement, options: {
    sitekey: string
    callback: (token: string) => void
    'expired-callback': () => void
    'error-callback': () => void
  }): number
  reset(widgetId?: number): void
}

declare global {
  interface Window { grecaptcha?: GrecaptchaApi }
}

const SCRIPT_ID = 'google-recaptcha-api'

export function RecaptchaCheckbox({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  const container = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<number | null>(null)
  const activeRef = useRef(false)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    const siteKey = RECAPTCHA_SITE_KEY
    if (!siteKey || !container.current) return
    activeRef.current = true
    let mounted = true
    const reportFailure = () => {
      if (!activeRef.current) return
      setLoadError(true)
      onToken(null)
    }
    const timeoutId = window.setTimeout(() => {
      if (!window.grecaptcha) reportFailure()
    }, 12000)
    const renderWidget = () => {
      if (!mounted || !window.grecaptcha || !container.current || widgetIdRef.current !== null) return
      window.clearTimeout(timeoutId)
      try {
        widgetIdRef.current = window.grecaptcha.render(container.current, {
          sitekey: siteKey,
          callback: token => {
            if (!activeRef.current) return
            setLoadError(false)
            onToken(token)
          },
          'expired-callback': () => {
            if (activeRef.current) onToken(null)
          },
          'error-callback': reportFailure,
        })
      } catch {
        reportFailure()
      }
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    const addScript = !script
    if (!script) {
      script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
    }
    script.addEventListener('load', renderWidget)
    script.addEventListener('error', reportFailure)
    if (addScript) document.head.appendChild(script)
    renderWidget()
    return () => {
      mounted = false
      activeRef.current = false
      window.clearTimeout(timeoutId)
      script?.removeEventListener('load', renderWidget)
      script?.removeEventListener('error', reportFailure)
    }
  }, [onToken, loadAttempt])

  useEffect(() => {
    if (widgetIdRef.current !== null) window.grecaptcha?.reset(widgetIdRef.current)
    onToken(null)
  }, [onToken, resetKey])

  if (!RECAPTCHA_SITE_KEY) return <p className="auth-captcha-note" role="status">reCAPTCHA pendiente de configurar en este entorno.</p>
  return <>
    <div className="auth-captcha" ref={container} aria-label="Verificación reCAPTCHA" />
    {loadError && <div className="auth-captcha-error" role="alert">
      <span>No se pudo cargar la verificación. Revisa tu conexión e inténtalo de nuevo.</span>
      <button type="button" onClick={() => {
        setLoadError(false)
        onToken(null)
        if (window.grecaptcha && widgetIdRef.current !== null) {
          window.grecaptcha.reset(widgetIdRef.current)
        } else {
          widgetIdRef.current = null
          document.getElementById(SCRIPT_ID)?.remove()
          setLoadAttempt(attempt => attempt + 1)
        }
      }}>Reintentar verificación</button>
    </div>}
  </>
}
