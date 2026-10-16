import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    const siteKey = RECAPTCHA_SITE_KEY
    if (!siteKey || !container.current) return
    let mounted = true
    const renderWidget = () => {
      if (!mounted || !window.grecaptcha || !container.current || widgetIdRef.current !== null) return
      widgetIdRef.current = window.grecaptcha.render(container.current, {
        sitekey: siteKey,
        callback: token => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      })
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', renderWidget)
    renderWidget()
    return () => {
      mounted = false
      script?.removeEventListener('load', renderWidget)
    }
  }, [onToken])

  useEffect(() => {
    if (widgetIdRef.current !== null) window.grecaptcha?.reset(widgetIdRef.current)
    onToken(null)
  }, [onToken, resetKey])

  if (!RECAPTCHA_SITE_KEY) return <p className="auth-captcha-note" role="status">reCAPTCHA pendiente de configurar en este entorno.</p>
  return <div className="auth-captcha" ref={container} aria-label="Verificación reCAPTCHA" />
}
