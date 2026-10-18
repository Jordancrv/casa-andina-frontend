export const cleanGuestName = (value: string) => value.replace(/[^\p{L}\p{M} '\u2019-]/gu, '')

export const cleanGuestPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 15)
  return (value.trimStart().startsWith('+') ? '+' : '') + digits
}

export const formatGuestPhone = (value: string) => {
  const prefix = value.startsWith('+') ? '+' : ''
  const digits = value.replace(/\D/g, '')
  const countryLength = prefix ? Math.max(0, digits.length - 9) : 0
  const country = digits.slice(0, countryLength)
  const local = digits.slice(countryLength).match(/.{1,3}/g)?.join(' ') ?? ''
  return prefix + (country ? country + ' ' : '') + local
}
