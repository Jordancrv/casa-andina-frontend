export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY as string | undefined
export const isRecaptchaConfigured = Boolean(RECAPTCHA_SITE_KEY)
