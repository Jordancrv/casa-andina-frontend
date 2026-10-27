export type WeatherKind = 'sun' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm' | 'unknown'
export type WeatherScene = 'sunny' | 'breezy' | 'rain' | 'storm' | 'snow' | 'frost' | 'cloudy' | 'mist' | 'neutral'

export function weatherScene(kind: WeatherKind, maximum: number): WeatherScene {
  if (kind === 'unknown' || !Number.isFinite(maximum)) return 'neutral'
  if (kind === 'storm' || kind === 'rain' || kind === 'snow') return kind
  if (kind === 'fog') return 'mist'
  if (maximum < 16) return 'frost'
  if (kind === 'cloud') return 'cloudy'
  if (maximum >= 24 && kind === 'sun') return 'sunny'
  return 'breezy'
}

/** Condiciones del proveedor WMO; la temperatura no permite deducir si está soleado. */
export function weatherCondition(code?: number | null): { label: string; kind: WeatherKind } {
  if (code === 0) return { label: 'Despejado', kind: 'sun' }
  if (code === 1) return { label: 'Mayormente despejado', kind: 'sun' }
  if (code === 2) return { label: 'Parcialmente nublado', kind: 'partly' }
  if (code === 3) return { label: 'Nublado', kind: 'cloud' }
  if (code === 45 || code === 48) return { label: 'Niebla', kind: 'fog' }
  if ([51, 53, 55, 56, 57].includes(code ?? -1)) return { label: 'Llovizna', kind: 'rain' }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code ?? -1)) return { label: 'Lluvia', kind: 'rain' }
  if ([71, 73, 75, 77, 85, 86].includes(code ?? -1)) return { label: 'Nieve', kind: 'snow' }
  if ([95, 96, 97, 99].includes(code ?? -1)) return { label: 'Tormenta', kind: 'storm' }
  return { label: 'Condición sin datos', kind: 'unknown' }
}

/** Referencia meteorológica por meses del hemisferio sur, no un pronóstico regional. */
export function seasonForDate(date: string) {
  const month = Number(date.slice(5, 7))
  if ([12, 1, 2].includes(month)) return 'Verano'
  if ([3, 4, 5].includes(month)) return 'Otoño'
  if ([6, 7, 8].includes(month)) return 'Invierno'
  return 'Primavera'
}

export function safeRoomPhoto(value?: string | null): string | null {
  const url = value?.trim()
  if (!url) return null
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return url
  try {
    const parsed = new URL(url)
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : null
  } catch { return null }
}
