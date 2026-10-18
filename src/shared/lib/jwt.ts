interface JwtPayload {
  sede_id?: string | number
}

export function getSedeIdFromToken(token: string): number | null {
  try {
    const encodedPayload = token.split('.')[1]
    if (!encodedPayload) return null

    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(normalized)) as JwtPayload
    const sedeId = Number(payload.sede_id)
    return Number.isInteger(sedeId) && sedeId > 0 ? sedeId : null
  } catch {
    return null
  }
}
